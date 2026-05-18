# StellarVPN

> Decentralized VPN settled on Stellar. Anyone can run a node, stake XLM, and earn USDC for bandwidth they provide. Users pay per megabyte with streaming micropayments confirmed in ~5 seconds at sub-cent fees.

[![License: Apache 2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Stellar Wave](https://img.shields.io/badge/Stellar-Drips%20Wave-7d00ff.svg)](https://www.drips.network/wave/stellar)

## Status — MVP in progress

| Component | State |
|---|---|
| Soroban contracts (`registry`, `payment`) | Implemented + unit-tested |
| Soroban `reputation`, `governance` | Planned (issues #9, design doc) |
| Node daemon (Go) | Skeleton — see `backend/` |
| Client CLI (Go) | Skeleton — see `client/` |
| React frontend | Skeleton — see `frontend/` |
| Testnet deployment | Pending (issue #47) |

50 scoped contributor issues across all five components are tracked in [`docs/WAVE_ISSUES.md`](docs/WAVE_ISSUES.md) and mirrored on the [GitHub issue tracker](../../issues).

## Repo layout

```
contracts/        Soroban smart contracts (Rust)
  registry/       Node registration + stake
  payment/        Session escrow + streaming settle
backend/          Node daemon — runs on bandwidth providers (Go)
client/           End-user CLI — connect, pay, disconnect (Go)
frontend/         Browser app — Freighter wallet UX (React + TS)
scripts/          Deploy + e2e scripts
deployments/      Contract IDs per network (testnet.json, mainnet.json)
docs/             Design, contract reference, application materials
```

## Quick start

**Contracts**
```bash
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release
cargo test
```

**Node daemon**
```bash
cd backend && go build ./cmd/noded
```

**Client CLI**
```bash
cd client && go build ./cmd/stelvpn
```

**Frontend**
```bash
cd frontend && npm install && npm run dev
```

## Contributing — Drips Wave

This repo is being submitted to the [Stellar Drips Wave](https://www.drips.network/wave/stellar). Each month, contributors solve labeled issues during a 7-day Wave window and earn cash rewards.

- Browse [open issues](../../issues), each tagged `trivial`, `medium`, or `high`
- See [CONTRIBUTING.md](CONTRIBUTING.md) for claim flow, build/test, and PR conventions
- Full issue backlog with rationale: [`docs/WAVE_ISSUES.md`](docs/WAVE_ISSUES.md)

## Architecture

See [`docs/DESIGN.md`](docs/DESIGN.md) for the full design — protocol flow, WireGuard integration, contract interactions, mainnet rollout plan.

## License

Apache-2.0 — see [LICENSE](LICENSE).
