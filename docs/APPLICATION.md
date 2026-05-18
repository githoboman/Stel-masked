# Stellar Drips Wave — Maintainer Application

Use these answers when submitting the repo at https://www.drips.network/wave/stellar.

---

## Project name
**StellarVPN**

## One-line description
Decentralized VPN with bandwidth paid in USDC via Soroban streaming micropayments.

## Repository URL
`https://github.com/<your-handle>/stellarvpn` _(fill in after pushing)_

## Why this project belongs in the Stellar ecosystem

StellarVPN is built end-to-end on Stellar primitives that no other chain combines as well:

- **Soroban smart contracts** handle node registry, escrowed sessions, and per-MB settlement
- **Native USDC** lets node operators earn stable income with no bridging
- **Sub-cent fees + ~5s finality** make per-megabyte micropayments economically viable — impossible on Ethereum, marginal on most L2s
- **Horizon API** removes the need for users to run a full node
- **Freighter** gives non-crypto users a clean wallet UX

The project is a real ecosystem use case for Stellar — it answers "what can sub-cent finality unlock that other chains can't?" with a working consumer product.

## Current state of the codebase

- **Contracts (Rust + Soroban):** `registry` and `payment` implemented with full unit test coverage (13 tests). `reputation` and `governance` scoped as Wave issues.
- **Backend (Go):** node daemon skeleton in `backend/` with stubs for WireGuard manager, Stellar client, session store, and settle loop. 15 scoped Wave issues against it.
- **Client (Go):** CLI skeleton in `client/` with subcommands stubbed (list/connect/disconnect/status/balance). 8 Wave issues.
- **Frontend (React + TS):** Vite + Freighter app scaffold in `frontend/`. 8 Wave issues covering connect flow, node list, session dashboard.
- **Infra:** Apache-2.0 license, CONTRIBUTING.md, issue + PR templates, 7 issues for CI workflows, Docker, testnet deploy, and end-to-end harness.
- Full architecture and roadmap in `docs/DESIGN.md`.

## What contributors will work on during Waves

We've pre-filed **65 issues** across the full MVP stack — see `docs/WAVE_ISSUES.md`. Breakdown:

- **19 trivial** — input validation, docs, UI polish, CLI subcommands, config flags, event/error audits
- **32 medium** — new contract entrypoints, WireGuard manager, session store, control API, frontend flows, CI workflows, snapshot tests, coverage
- **14 high** — signed-receipt settlement, reputation contract, end-to-end demo, full connect handshake, paginated registry, fuzz tests, cross-contract integration

**Coverage by area:**

| Area | Issues |
|---|---|
| Soroban contracts + tests | 27 |
| Node daemon (Go) | 15 |
| Client CLI (Go) | 8 |
| Frontend (React) | 8 |
| Infra / CI / docs | 7 |

We'll add 8–12 new issues per Wave to keep the queue full as work completes.

## Maintainer commitment

- Review PRs within 3 business days
- Label new issues at least 1 week before each Wave opens
- Respond to contributor questions in issue comments and Drips Discord
- Squash-merge cleanly so the commit log stays scannable

## Team / maintainer

- **<Your name>** — <GitHub handle>, <Stellar wallet G…>
- Prior open-source contribution history: <link a few merged PRs to other Stellar/Wave repos>

## Anything else
Repo is public, Apache-2.0, no token, no premine, no proprietary components.
