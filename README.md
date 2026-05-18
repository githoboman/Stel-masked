# StellarVPN

> Decentralized VPN settled on Stellar. Anyone can run a node, stake XLM, and earn USDC for bandwidth they provide. Users pay per megabyte with streaming micropayments confirmed in ~5 seconds at sub-cent fees.

🌐 **Live site:** https://stellarvpn.vercel.app _(replace after first deploy)_

[![License: Apache 2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Stellar Wave](https://img.shields.io/badge/Stellar-Drips%20Wave-7d00ff.svg)](https://www.drips.network/wave/stellar)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black.svg)](https://vercel.com)

## Live on testnet

Both Soroban contracts are deployed and initialized on Stellar testnet — see [`deployments/testnet.json`](deployments/testnet.json).

| Contract | ID | Explorer |
|---|---|---|
| `registry` | `CA4Z2HWNKGMQRZX5JF23VWLV5S2C4FENND56Z2ZFHCOP3V3MXHEZ4FXC` | [view](https://stellar.expert/explorer/testnet/contract/CA4Z2HWNKGMQRZX5JF23VWLV5S2C4FENND56Z2ZFHCOP3V3MXHEZ4FXC) |
| `payment` | `CDRT6MBUNJFTVX2A4QCZTVFEFQCTEL4WTB44MFFPYDXHXQMV7IJKVDC3` | [view](https://stellar.expert/explorer/testnet/contract/CDRT6MBUNJFTVX2A4QCZTVFEFQCTEL4WTB44MFFPYDXHXQMV7IJKVDC3) |

## Status — MVP in progress

| Component | State |
|---|---|
| Soroban contracts (`registry`, `payment`) | **Deployed on testnet** + 13 unit tests passing |
| Soroban `reputation`, `governance` | Planned (issues #9, design doc) |
| Node daemon (Go) | Skeleton — see `backend/` |
| Client CLI (Go) | Skeleton — see `client/` |
| React landing page | Built — Vercel-ready |
| Browser wallet UX (Freighter) | 8 Wave issues filed |

65 scoped contributor issues across all five components are tracked in [`docs/WAVE_ISSUES.md`](docs/WAVE_ISSUES.md) and mirrored on the [GitHub issue tracker](../../issues).

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

**Frontend (landing page)**
```bash
cd frontend && npm install && npm run dev
```
Production build: `npm run build` outputs to `frontend/dist/`.

## Deploy the landing page to Vercel

The repo is preconfigured ([`vercel.json`](vercel.json)) to build and serve the landing page from `frontend/`.

```bash
npm i -g vercel
vercel        # first run: link to your account + project
vercel --prod # production deploy
```

Vercel auto-redeploys on every push to `main`. The `ignoreCommand` in `vercel.json` skips redeploys when no frontend file changed.

## Contributing — Drips Wave

This repo is being submitted to the [Stellar Drips Wave](https://www.drips.network/wave/stellar). Each month, contributors solve labeled issues during a 7-day Wave window and earn cash rewards.

- Browse [open issues](../../issues), each tagged `trivial`, `medium`, or `high`
- See [CONTRIBUTING.md](CONTRIBUTING.md) for claim flow, build/test, and PR conventions
- Full issue backlog with rationale: [`docs/WAVE_ISSUES.md`](docs/WAVE_ISSUES.md)

## Architecture

See [`docs/DESIGN.md`](docs/DESIGN.md) for the full design — protocol flow, WireGuard integration, contract interactions, mainnet rollout plan.

## License

Apache-2.0 — see [LICENSE](LICENSE).
