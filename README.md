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

## Compile

Compact publishes Linux and macOS binaries only. On Windows, install [WSL Ubuntu](https://docs.midnight.network/guides/windows-compact-setup), then inside Ubuntu:

```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
source ~/.bashrc
compact update 0.31.1
compact compile --version
```

From this repo:

```bash
npm run compile
npm install -D @midnight-ntwrk/compact-runtime@0.16.0
npm test
```

`npm run compile` writes `contract/managed/mandate`. Do not commit that directory. Pin the runtime to 0.16.0. A bare `npm install` of the runtime pulls 0.20.x, which rejects contracts compiled for Preprod.

Deploy needs Docker (proof server `midnightntwrk/proof-server:8.1.3`), a Lace wallet on Preprod, tNIGHT from the faucet, and tDUST generated in the wallet. The contract is three circuits on purpose. Large Compact contracts fail to deploy through Lace.

## Circuits

| Circuit | Who | What becomes public |
| --- | --- | --- |
| `createMandate` | Company | Company key, agent key, terms commitment, zero purse commitment |
| `spend` | Agent | Next purse commitment, nullifier, receipt commitment |
| `revoke` | Company | Status becomes `REVOKED` |
| `receiptCommitment` | Auditor, local | Nothing. Recomputes one receipt commitment. |

Witnesses live in `contract/witnesses.ts`.

## License

Apache-2.0. Add the GitHub topic `midnightntwrk` when the repo is published. The buildathon asks for that topic, a slide deck, a demo video, and the compiled contract. Slide and video notes are in `SUBMISSION.md`.
