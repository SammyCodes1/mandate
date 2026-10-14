// Deploys Mandate to the local undeployed devnet and runs the four cases.
// The address dies with the GitHub Actions job. It is not a Preview or Preprod address.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";
import { deployContract, submitCallTx } from "@midnight-ntwrk/midnight-js-contracts";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import type { EnvironmentConfiguration } from "@midnight-ntwrk/testkit-js";
import pino from "pino";
import { firstValueFrom } from "rxjs";
import { take } from "rxjs/operators";
import { Contract, ledger, pureCircuits } from "../../contract/managed/mandate/contract/index.js";
import { localConfig } from "./config.js";
import { buildProviders, type MandateProviders } from "./providers.js";
import {
  advancePurse,
  createSession,
  hex,
  initialPrivateState,
  sameBytes,
  vendor,
  witnessesFor,
} from "./session.js";
import { MidnightWalletProvider, syncWallet } from "./wallet.js";

// @ts-expect-error The indexer client reads a global WebSocket.
globalThis.WebSocket = WebSocket;

const ALICE_SEED = "0000000000000000000000000000000000000000000000000000000000000001";
const PRIVATE_STATE_ID = "mandateSession";
const here = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(here, "../../contract/managed/mandate");
const transcriptPath = path.resolve(here, "../transcript.json");

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport: { target: "pino-pretty" },
});

type Step = {
  name: string;
  ok: boolean;
  error?: string;
  nullifiers?: string;
  receipts?: string;
  status?: string;
};

const steps: Step[] = [];
let contractAddress = "";

function publicView(state: ReturnType<typeof ledger>) {
  return {
    status: state.status,
    companyKey: hex(state.companyKey),
    agentKey: hex(state.agentKey),
    termsCommitment: hex(state.termsCommitment),
    purseCommitment: hex(state.purseCommitment),
    nullifiers: [...state.nullifiers].map((item) => hex(item)),
    receipts: [...state.receipts].map(([index, commitment]) => ({
      index: index.toString(),
      commitment: hex(commitment),
    })),
    receiptCount: state.receiptCount.toString(),
  };
}

function writeTranscript(extra: Record<string, unknown> = {}) {
  const body = {
    network: "undeployed",
    networkNote:
      "Local Midnight devnet started by chain/compose.yml. This address is not on Preview or Preprod and cannot be opened in a public explorer.",
    images: {
      node: "midnightntwrk/midnight-node:1.0.0",
      indexer: "midnightntwrk/indexer-standalone:4.3.3",
      proofServer: "midnightntwrk/proof-server:8.1.0",
    },
    toolchain: "0.31.1",
    compactRuntime: "0.16.0",
    contractAddress,
    steps,
    ...extra,
  };
  writeFileSync(transcriptPath, `${JSON.stringify(body, null, 2)}\n`);
}

async function query(providers: MandateProviders) {
  const state = await providers.publicDataProvider.queryContractState(contractAddress);
  if (!state) throw new Error("Contract state is missing");
  return ledger(state.data);
}

async function expectReject(name: string, run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    logger.info(`${name} rejected: ${message}`);
    return message;
  }
  throw new Error(`${name} was accepted`);
}

function dustBalance(state: { dust: { balance: (at: Date) => bigint } }, at: Date): bigint {
  try {
    return state.dust.balance(at);
  } catch (error) {
    logger.warn(`dust balance unreadable: ${error instanceof Error ? error.message : String(error)}`);
    return 0n;
  }
}

function nightSummary(state: { unshielded?: { availableCoins?: unknown[] } }): string {
  const coins = state.unshielded?.availableCoins ?? [];
  let stars = 0n;
  let registered = 0;
  for (const coin of coins) {
    if (!coin || typeof coin !== "object") continue;
    const record = coin as {
      value?: bigint;
      registeredForDustGeneration?: boolean;
      utxo?: { value?: bigint; registeredForDustGeneration?: boolean };
    };
    const value = typeof record.value === "bigint" ? record.value : record.utxo?.value;
    if (typeof value === "bigint") stars += value;
    if (record.registeredForDustGeneration || record.utxo?.registeredForDustGeneration) registered += 1;
  }
  return `nightCoins=${coins.length} registered=${registered} stars=${stars}`;
}

// Genesis NIGHT creates dust coins before they can pay a fee. balance(now)
// is the spendable amount. A coin count of 1 is not enough for this deploy.
async function waitForDust(wallet: MidnightWalletProvider["wallet"]): Promise<void> {
  const deadline = Date.now() + 10 * 60_000;
  let firstPositiveAt = 0;
  while (Date.now() < deadline) {
    const state = await firstValueFrom(wallet.state().pipe(take(1)));
    const now = new Date();
    const soon = new Date(now.getTime() + 180_000);
    const nowBalance = dustBalance(state, now);
    const soonBalance = dustBalance(state, soon);
    logger.info(
      `${nightSummary(state)} dustCoins=${state.dust.availableCoins.length} dustNow=${nowBalance} dustIn180s=${soonBalance}`,
    );
    if (nowBalance > 0n && firstPositiveAt === 0) firstPositiveAt = Date.now();
    const grew = firstPositiveAt !== 0 && Date.now() - firstPositiveAt >= 90_000;
    const alreadyCapped = nowBalance > 0n && soonBalance <= nowBalance;
    if (grew || alreadyCapped) return;
    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }
  throw new Error("DUST balance stayed at 0 for 10 minutes");
}

function dustShort(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("could not balance dust") || message.includes("InsufficientFunds");
}

async function main() {
  const config = localConfig();
  setNetworkId(config.networkId);
  const session = createSession();
  const witnesses = witnessesFor(session);
  const compiled = CompiledContract.make("Mandate", Contract).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );
  const env = {
    walletNetworkId: config.networkId,
    networkId: config.networkId,
    indexer: config.indexer,
    indexerWS: config.indexerWS,
    node: config.node,
    nodeWS: config.nodeWS,
    faucet: config.faucet,
    proofServer: config.proofServer,
  } satisfies EnvironmentConfiguration;

  const wallet = await MidnightWalletProvider.build(logger, env, { kind: "seed", value: ALICE_SEED });
  await wallet.start();
  try {
    await syncWallet(logger, wallet.wallet, 6 * 60_000);
    await waitForDust(wallet.wallet);
    const providers = buildProviders(wallet, zkConfigPath, config);
    const agentKey = pureCircuits.agentPublicKey(session.agentSecret);

    logger.info("Deploying Mandate");
    let deployed: Awaited<ReturnType<typeof deployContract>> | undefined;
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      try {
        deployed = await deployContract(providers, {
          compiledContract: compiled,
          privateStateId: PRIVATE_STATE_ID,
          initialPrivateState,
        });
        break;
      } catch (error) {
        if (!dustShort(error) || attempt === 6) throw error;
        logger.info(`deploy attempt ${attempt} needs more DUST: ${error instanceof Error ? error.message : String(error)}`);
        await new Promise((resolve) => setTimeout(resolve, 30_000));
      }
    }
    if (!deployed) throw new Error("Deploy did not return a contract");
    contractAddress = deployed.deployTxData.public.contractAddress;
    logger.info(`CONTRACT_ADDRESS=${contractAddress}`);
    steps.push({ name: "deploy", ok: true });
    writeTranscript();

    await submitCallTx(providers, {
      compiledContract: compiled,
      contractAddress,
      privateStateId: PRIVATE_STATE_ID,
      circuitId: "createMandate",
      args: [agentKey],
    });
    let view = publicView(await query(providers));
    if (view.status !== 1) throw new Error(`createMandate status ${view.status}`);
    if (view.nullifiers.length !== 0) throw new Error("createMandate wrote a nullifier");
    steps.push({
      name: "createMandate",
      ok: true,
      status: String(view.status),
      nullifiers: String(view.nullifiers.length),
      receipts: view.receiptCount,
    });
    const termsAtCreate = view.termsCommitment;
    const purseAtCreate = view.purseCommitment;

    await submitCallTx(providers, {
      compiledContract: compiled,
      contractAddress,
      privateStateId: PRIVATE_STATE_ID,
      circuitId: "spend",
      args: [80n, vendor],
    });
    advancePurse(session, 80n);
    view = publicView(await query(providers));
    if (view.nullifiers.length !== 1 || view.receiptCount !== "1") {
      throw new Error(`spend 80 left nullifiers=${view.nullifiers.length} receipts=${view.receiptCount}`);
    }
    if (view.purseCommitment === purseAtCreate) throw new Error("purse commitment did not change");
    const receipt = (await query(providers)).receipts.lookup(0n);
    const opened = pureCircuits.receiptCommitment(80n, vendor, session.lastReceiptSalt);
    if (!sameBytes(receipt, opened)) throw new Error("receipt 0 does not open to the 80 vendor payment");
    if (view.termsCommitment !== termsAtCreate) throw new Error("terms commitment changed on spend");
    const leaked = view.receipts.some((item) => item.commitment === hex(vendor));
    if (leaked) throw new Error("recipient was stored in the clear");
    steps.push({ name: "spend80", ok: true, nullifiers: "1", receipts: "1", status: String(view.status) });
    writeTranscript({ ledgerAfterSpend: view });

    const beforeReject = view.nullifiers.length;
    const over = await expectReject("spend150", () =>
      submitCallTx(providers, {
        compiledContract: compiled,
        contractAddress,
        privateStateId: PRIVATE_STATE_ID,
        circuitId: "spend",
        args: [150n, vendor],
      }),
    );
    view = publicView(await query(providers));
    if (view.nullifiers.length !== beforeReject) throw new Error("over-cap spend wrote a nullifier");
    if (!over.includes("per-payment cap")) throw new Error(`over-cap error was not the cap assert: ${over}`);
    steps.push({ name: "spend150", ok: false, error: over, nullifiers: String(view.nullifiers.length) });

    const livePurse = session.purse;
    const liveSalt = session.purseSalt;
    session.purse = { spent: 0n, payments: 0n };
    session.purseSalt = session.createdPurseSalt;
    const replay = await expectReject("replay", () =>
      submitCallTx(providers, {
        compiledContract: compiled,
        contractAddress,
        privateStateId: PRIVATE_STATE_ID,
        circuitId: "spend",
        args: [80n, vendor],
      }),
    );
    session.purse = livePurse;
    session.purseSalt = liveSalt;
    view = publicView(await query(providers));
    if (view.nullifiers.length !== 1) throw new Error("replay wrote a nullifier");
    if (!replay.includes("Purse does not match")) throw new Error(`replay error was not the purse assert: ${replay}`);
    steps.push({ name: "replay", ok: false, error: replay, nullifiers: "1" });

    const realAgent = session.agentSecret;
    session.agentSecret = new Uint8Array(32).fill(0x44);
    const stranger = await expectReject("wrongAgent", () =>
      submitCallTx(providers, {
        compiledContract: compiled,
        contractAddress,
        privateStateId: PRIVATE_STATE_ID,
        circuitId: "spend",
        args: [20n, vendor],
      }),
    );
    session.agentSecret = realAgent;
    view = publicView(await query(providers));
    if (view.nullifiers.length !== 1) throw new Error("wrong agent wrote a nullifier");
    if (!stranger.includes("Wrong agent")) throw new Error(`wrong-agent error was not the agent assert: ${stranger}`);
    steps.push({ name: "wrongAgent", ok: false, error: stranger, nullifiers: "1" });

    await submitCallTx(providers, {
      compiledContract: compiled,
      contractAddress,
      privateStateId: PRIVATE_STATE_ID,
      circuitId: "revoke",
      args: [],
    });
    view = publicView(await query(providers));
    if (view.status !== 2) throw new Error(`revoke status ${view.status}`);
    steps.push({ name: "revoke", ok: true, status: String(view.status), nullifiers: "1", receipts: view.receiptCount });

    writeTranscript({ ledgerFinal: view });
    logger.info("DEPLOY_OK");
  } finally {
    await wallet.stop().catch((error: unknown) => logger.warn(`wallet stop failed: ${String(error)}`));
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  logger.error(message);
  steps.push({ name: "failed", ok: false, error: message.split("\n")[0] });
  writeTranscript();
  process.exit(1);
});
