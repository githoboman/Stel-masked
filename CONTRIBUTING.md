# Contributing to StellarVPN

Thanks for your interest. This repo participates in the [Stellar Drips Wave](https://www.drips.network/wave/stellar), so merged PRs that close labeled issues earn Points toward monthly cash rewards.

## How to contribute

1. **Find an issue.** Browse [open issues](../../issues) tagged `trivial`, `medium`, or `high`.
2. **Claim it.** Comment `/claim` on the issue. We assign on a first-come basis; if there's no PR in 7 days, the issue is unassigned.
3. **Fork + branch.** Branch name: `<issue-number>-short-description` (e.g. `12-add-pause-flag`).
4. **Build and test.**
   ```bash
   cargo build --target wasm32-unknown-unknown --release
   cargo test
   ```
5. **Open a PR.** Title format: `<scope>: <summary>` (e.g. `registry: emit NodePaused event`). In the body, write `Closes #N`.

## Code standards

- Run `cargo fmt` before pushing
- Run `cargo clippy --all-targets -- -D warnings` and fix lints
- Every new public function needs at least one unit test
- Keep contract changes additive when possible — breaking changes need an upgrade path note in the PR

## Review and merge

- A maintainer reviews within 3 business days
- One approval required; CI must be green
- We squash-merge with the PR title as the commit message

## Wave timing

Drips Waves run for 7 days each month. Plan PRs accordingly — only PRs **merged during an active Wave window** count toward that Wave's rewards. Outside that window, your work still counts toward the next Wave.

## Questions

Open a discussion or ask in the [Drips Discord](https://discord.gg/drips).
