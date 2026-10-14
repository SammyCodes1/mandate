# Mandate

A private spending policy for an AI agent, written for the [Midnight Buildathon on AKINDO](https://app.akindo.io/wave-hacks/jaMZjqPOBsLXvjdG).

A company sets a budget and a recipient list. The agent spends. Midnight records that the payment stayed inside the policy. The amount, the recipient, and the remaining budget stay off the ledger. An auditor can open one receipt later.

The chain stores:

- a company key and an agent key (hashes, not secrets)
- a commitment to the terms
- a commitment to the running purse
- a nullifier per accepted payment
- a commitment per receipt

A rejected payment writes nothing.

## What is proven today

`npm test` runs the policy rules: under the cap, over the cap, replay, and the wrong agent. It also checks that a later payment cannot break the total, that an outsider recipient is refused, that one receipt can be opened, and that revoke blocks further spends.

The console at `npm run dev` is the same rules with a local commitment function. It is the demo you can click. It is not a Midnight proof.

The Compact contract is `contract/mandate.compact`. It targets Compact toolchain **0.31.1** (language 0.23, runtime 0.16.0), which is the toolchain [Preprod accepts](https://docs.midnight.network/relnotes/support-matrix). Toolchain 0.35 targets ledger 9 and will not deploy on Preprod.

## Compile and prove

Compact publishes Linux and macOS binaries only. This repo compiles on GitHub Actions with toolchain 0.31.1. The workflow is `.github/workflows/compile.yml`. The compiled keys are the `mandate-compact` artifact. `contract/managed` stays gitignored.

`chain/src/simulate.ts` loads that output and runs the circuits in `@midnight-ntwrk/compact-runtime` 0.16.0. It checks the under-cap payment, the over-cap rejection, the replay, the wrong agent, an outsider recipient, and revoke. No proof server is involved. The commitments in that run are Midnight `persistentCommit` values.

`chain/src/deploy.ts` is the chain run. GitHub Actions starts the official local devnet (`midnightntwrk/midnight-node:1.0.0`, indexer `4.3.3`, proof server `8.1.0`) and deploys with the well-known devnet seed. The workflow is `.github/workflows/chain.yml`. The transcript artifact is `mandate-transcript`.

That address belongs to the runner's devnet. It is not on Preview or Preprod, and a public explorer cannot open it. Preprod's hosted RPC now requires a Blockfrost project id, which this repo does not have. Preview's faucet is a captcha page, so an unattended runner cannot fund a wallet there.

Pin the runtime to 0.16.0. Midnight.js 4.1.1 and Compact.js 2.5.1 expect that runtime. Toolchain 0.35 targets ledger 9 and will not deploy on the public networks.

To repeat the chain run on a Linux machine with Docker:

```bash
compact update 0.31.1
compact compile contract/mandate.compact contract/managed/mandate
cd chain
npm install
npm run simulate
docker compose -f compose.yml up -d --wait
npm run deploy
```

## Circuits

| Circuit | Who | What becomes public |
| --- | --- | --- |
| `createMandate` | Company | Company key, agent key, terms commitment, zero purse commitment |
| `spend` | Agent | Next purse commitment, nullifier, receipt commitment |
| `revoke` | Company | Status becomes `REVOKED` |
| `receiptCommitment` | Auditor, local | Nothing. Recomputes one receipt commitment. |

Witnesses live in `contract/witnesses.ts`.

## License

Apache-2.0. The public repo is [SammyCodes1/mandate](https://github.com/SammyCodes1/mandate) and the topic is `midnightntwrk`. The buildathon also asks for a slide deck, a demo video, and the compiled contract. Notes for those are in `SUBMISSION.md`.
