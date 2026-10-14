// Derived from midnightntwrk/example-hello-world src/wallet.ts
// Copyright (C) Midnight Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  type CoinPublicKey,
  DustSecretKey,
  type EncPublicKey,
  type FinalizedTransaction,
  LedgerParameters,
  ZswapSecretKeys,
} from "@midnight-ntwrk/midnight-js-protocol/ledger";
import type { MidnightProvider, UnboundTransaction, WalletProvider } from "@midnight-ntwrk/midnight-js-types";
import { ttlOneHour } from "@midnight-ntwrk/midnight-js-utils";
import type { FacadeState, UnshieldedKeystore, WalletFacade } from "@midnight-ntwrk/wallet-sdk";
import {
  type DustWalletOptions,
  type EnvironmentConfiguration,
  FluentWalletBuilder,
} from "@midnight-ntwrk/testkit-js";
import type { Logger } from "pino";
import * as Rx from "rxjs";

export type WalletSecret = { kind: "seed"; value: string };

export class MidnightWalletProvider implements MidnightProvider, WalletProvider {
  readonly wallet: WalletFacade;
  readonly unshieldedKeystore: UnshieldedKeystore;

  private constructor(
    private readonly logger: Logger,
    wallet: WalletFacade,
    private readonly zswapSecretKeys: ZswapSecretKeys,
    private readonly dustSecretKey: DustSecretKey,
    unshieldedKeystore: UnshieldedKeystore,
  ) {
    this.wallet = wallet;
    this.unshieldedKeystore = unshieldedKeystore;
  }

  getCoinPublicKey(): CoinPublicKey {
    return this.zswapSecretKeys.coinPublicKey;
  }

  getEncryptionPublicKey(): EncPublicKey {
    return this.zswapSecretKeys.encryptionPublicKey;
  }

  async balanceTx(tx: UnboundTransaction, ttl: Date = ttlOneHour()): Promise<FinalizedTransaction> {
    const recipe = await this.wallet.balanceUnboundTransaction(
      tx,
      {
        shieldedSecretKeys: this.zswapSecretKeys,
        dustSecretKey: this.dustSecretKey,
      },
      { ttl },
    );
    return await this.wallet.finalizeRecipe(recipe);
  }

  submitTx(tx: FinalizedTransaction): Promise<string> {
    return this.wallet.submitTransaction(tx);
  }

  async start(): Promise<void> {
    this.logger.info("Starting wallet...");
    await this.wallet.start(this.zswapSecretKeys, this.dustSecretKey);
  }

  async stop(): Promise<void> {
    await this.wallet.stop();
  }

  static async build(
    logger: Logger,
    env: EnvironmentConfiguration,
    secret: WalletSecret,
  ): Promise<MidnightWalletProvider> {
    const dustOptions: DustWalletOptions = {
      ledgerParams: LedgerParameters.initialParameters(),
      additionalFeeOverhead: 1_000n,
      feeBlocksMargin: 5,
    };
    const buildResult = await FluentWalletBuilder.forEnvironment(env)
      .withDustOptions(dustOptions)
      .withSeed(secret.value)
      .buildWithoutStarting();
    const { wallet, seeds, keystore } = buildResult as {
      wallet: WalletFacade;
      seeds: { masterSeed: string; shielded: Uint8Array; dust: Uint8Array };
      keystore: UnshieldedKeystore;
    };
    logger.info(`Wallet built from seed ${seeds.masterSeed.slice(0, 8)}...`);
    return new MidnightWalletProvider(
      logger,
      wallet,
      ZswapSecretKeys.fromSeed(seeds.shielded),
      DustSecretKey.fromSeed(seeds.dust),
      keystore,
    );
  }
}

function isComplete(progress: unknown): boolean {
  if (!progress || typeof progress !== "object") return false;
  const candidate = progress as { isStrictlyComplete?: unknown };
  return typeof candidate.isStrictlyComplete === "function" && candidate.isStrictlyComplete();
}

export async function syncWallet(logger: Logger, wallet: WalletFacade, timeout = 300_000): Promise<FacadeState> {
  logger.info("Syncing wallet...");
  let emissionCount = 0;
  return Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.tap((state: FacadeState) => {
        emissionCount += 1;
        logger.info(
          `Wallet sync [${emissionCount}]: shielded=${isComplete(state.shielded.state.progress)} ` +
            `unshielded=${isComplete(state.unshielded.progress)} dust=${isComplete(state.dust.state.progress)}`,
        );
      }),
      Rx.filter(
        (state: FacadeState) =>
          isComplete(state.shielded.state.progress) &&
          isComplete(state.dust.state.progress) &&
          isComplete(state.unshielded.progress),
      ),
      Rx.timeout({
        each: timeout,
        with: () => Rx.throwError(() => new Error(`Wallet sync timeout after ${timeout}ms`)),
      }),
    ),
  );
}
