// Runs the compiled circuits in the Compact runtime. No proof server and no node.
// A passing run means the asserts, commitments, and nullifier rules match the source.
import * as RT from "@midnight-ntwrk/compact-runtime";
import { Contract, ledger, pureCircuits } from "../../contract/managed/mandate/contract/index.js";
import {
  advancePurse,
  createSession,
  emptyRecipient,
  hex,
  initialPrivateState,
  sameBytes,
  vendor,
  witnessesFor,
} from "./session.js";

const COIN = "0".repeat(64);

function fail(message: string): never {
  console.error(`SIMULATOR_FAIL ${message}`);
  process.exit(1);
}

function assert(condition: unknown, message: string) {
  if (!condition) fail(message);
}

function reject(run: () => unknown, label: string): string {
  try {
    run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`rejected ${label}: ${message.split("\n")[0]}`);
    return message;
  }
  fail(`${label} was accepted`);
}

const session = createSession();
const contract = new Contract(witnessesFor(session));
const ctor = contract.initialState(RT.createConstructorContext(initialPrivateState, COIN));
const contractState = ctor.currentContractState;
if (!(contractState instanceof RT.ContractState)) {
  fail(
    `ContractState comes from a second compact-runtime copy (${import.meta.resolve("@midnight-ntwrk/compact-runtime")})`,
  );
}
let ctx = RT.createCircuitContext(RT.sampleContractAddress(), COIN, contractState, initialPrivateState);

const absent = ledger(ctx.currentQueryContext.state);
assert(absent.status === 0, `expected ABSENT, got ${absent.status}`);

const agentKey = pureCircuits.agentPublicKey(session.agentSecret);
const created = contract.circuits.createMandate(ctx, agentKey);
ctx = created.context;
const active = ledger(ctx.currentQueryContext.state);
assert(active.status === 1, `expected ACTIVE, got ${active.status}`);
assert(active.nullifiers.size() === 0n, "create wrote a nullifier");
assert(active.receiptCount === 0n, "create wrote a receipt");
assert(sameBytes(active.agentKey, agentKey), "agent key was not stored");
assert(!sameBytes(active.termsCommitment, new Uint8Array(32)), "terms commitment is empty");
const termsHex = hex(active.termsCommitment);
assert(!termsHex.includes(hex(vendor)), "vendor bytes leaked into the terms commitment");

const spent = contract.circuits.spend(ctx, 80n, vendor);
ctx = spent.context;
advancePurse(session, 80n);
const afterPay = ledger(ctx.currentQueryContext.state);
assert(afterPay.nullifiers.size() === 1n, "spend did not write a nullifier");
assert(afterPay.receiptCount === 1n, "spend did not count a receipt");
assert(afterPay.receipts.member(0n), "receipt 0 is missing");
const stored = afterPay.receipts.lookup(0n);
const opened = pureCircuits.receiptCommitment(80n, vendor, session.lastReceiptSalt);
assert(sameBytes(stored, opened), "receipt commitment does not open to 80 for the vendor");
assert(!sameBytes(stored, vendor), "receipt commitment published the recipient");
const purseAfter = hex(afterPay.purseCommitment);
assert(purseAfter !== hex(active.purseCommitment), "purse commitment did not change");

const over = reject(() => contract.circuits.spend(ctx, 150n, vendor), "over cap");
assert(over.includes("per-payment cap"), `unexpected over-cap error: ${over}`);
assert(ledger(ctx.currentQueryContext.state).nullifiers.size() === 1n, "rejected spend wrote a nullifier");

const livePurse = session.purse;
const liveSalt = session.purseSalt;
session.purse = { spent: 0n, payments: 0n };
session.purseSalt = session.createdPurseSalt;
const replay = reject(() => contract.circuits.spend(ctx, 80n, vendor), "replay");
assert(replay.includes("Purse does not match"), `unexpected replay error: ${replay}`);
session.purse = livePurse;
session.purseSalt = liveSalt;

const realAgent = session.agentSecret;
session.agentSecret = new Uint8Array(32).fill(0x44);
const stranger = reject(() => contract.circuits.spend(ctx, 20n, vendor), "wrong agent");
assert(stranger.includes("Wrong agent"), `unexpected agent error: ${stranger}`);
session.agentSecret = realAgent;

const outside = new Uint8Array(32).fill(0x55);
const outsider = reject(() => contract.circuits.spend(ctx, 20n, outside), "outsider");
assert(outsider.includes("outside the mandate"), `unexpected recipient error: ${outsider}`);

const emptyPay = reject(() => contract.circuits.spend(ctx, 20n, emptyRecipient), "empty recipient");
assert(emptyPay.includes("empty"), `unexpected empty-recipient error: ${emptyPay}`);

const revoked = contract.circuits.revoke(ctx);
ctx = revoked.context;
assert(ledger(ctx.currentQueryContext.state).status === 2, "revoke did not set REVOKED");
const afterRevoke = reject(() => contract.circuits.spend(ctx, 20n, vendor), "spend after revoke");
assert(afterRevoke.includes("not active"), `unexpected revoke error: ${afterRevoke}`);

console.log("SIMULATOR_OK");
