# Wave 2 submission notes

Deadline: 17 October 2026. Pool: 4,000 USDT. Each wave is scored on its own.

Do not claim a Preprod address until a deploy receipt exists.

## Slides

1. **Problem.** A company that gives an agent a wallet either sees every payment or sees nothing. Neither is acceptable.
2. **Mandate.** The company commits to a per-payment cap, a total, a payment count, and four recipient slots. The agent proves a payment fits. The ledger stores commitments and a nullifier.
3. **Pass.** Pay 80 to an allowed vendor. Show the explorer: a new nullifier, a new purse commitment, no amount.
4. **Fail.** Pay 150. The assert fires. The nullifier set does not grow.
5. **Auditor.** Open receipt 0 with its salt. Receipt 1 stays a commitment.
6. **Wave 3.** Lace on Preprod, a real allowlist root, and an on-chain disclose circuit for one receipt. Build Club pitch: every agent wallet needs this control.

## 90-second video

1. Say the one-line: prove the agent stayed inside its mandate, and never publish the mandate.
2. Issue the mandate. Point at the public ledger. Caps are not on it.
3. Pay 80. Point at the new nullifier.
4. Pay 150. Point at the unchanged nullifier count.
5. Replay. Point at the purse mismatch.
6. Open receipt 0. Stop.

## Repo checklist

- Public repo: https://github.com/SammyCodes1/mandate
- Apache-2.0 license
- Topic: `midnightntwrk`
- `contract/mandate.compact` in the repo
- Compiled output: the `mandate-compact` artifact from [the compile workflow](https://github.com/SammyCodes1/mandate/actions/workflows/compile.yml) and from [the chain workflow](https://github.com/SammyCodes1/mandate/actions/workflows/chain.yml)
- Deck: `slides/Mandate.pptx`
- Silent console walkthrough: `slides/demo.webm`. The voiceover for it is the 90-second script above. The console uses the local stand-in, and the footer says so.
- Chain transcript: the `mandate-transcript` artifact, once `chain.yml` is green. That address is the local devnet. It is not a Preview or Preprod address.

AKINDO still needs the account holder to paste the repo, the deck, and the video. This repo cannot file that form.
