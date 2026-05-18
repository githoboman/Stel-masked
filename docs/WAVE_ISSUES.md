# Wave Issue Backlog — 50 issues

Paste each block as a GitHub issue. Complexity tag in brackets maps directly to Drips Wave point tier.

**Distribution:** 15 trivial · 25 medium · 10 high.
**Areas:** contracts (12) · backend daemon (15) · client CLI (8) · frontend (8) · infra/docs (7).

---

# Contracts — Soroban

## 1. `registry`: pause/unpause a node — [medium]
Add `pause_node(operator)` and `unpause_node(operator)`. Flips `Node.active`. Operator-auth only. Emit `NodePaused` / `NodeUnpaused`. Tests cover state flip, is_active reflects it, non-operator rejected.
Files: `contracts/registry/src/{lib,test}.rs`

## 2. `registry`: enforce max endpoint length — [trivial]
Constant `MAX_ENDPOINT_LEN = 256`. Reject longer endpoints with `Error::InvalidEndpoint`. Add a test.
Files: `contracts/registry/src/{lib,test}.rs`

## 3. `registry`: admin `set_min_stake` — [medium]
Admin-only entrypoint to update min stake. Reject `new_min <= 0`. Emit `MinStakeUpdated{old,new}`. Tests: admin updates, non-admin rejected, new floor enforced on next registration.
Files: `contracts/registry/src/{lib,test}.rs`

## 4. `registry`: list all active nodes — [high]
Add a paginated `list_active(cursor, limit) -> (Vec<Node>, next_cursor)`. Needs a secondary index in storage (operator → bool) updated on register/deregister/pause. Tests cover paging and skipping inactive entries.
Files: `contracts/registry/src/{lib,test}.rs`

## 5. `payment`: top-up an open session — [medium]
`top_up(client, node, amount)`. Pulls tokens, raises `deposited`. Reject if closed/missing. Emit `SessionToppedUp`. Tests cover balance + later settle against new ceiling.
Files: `contracts/payment/src/{lib,test}.rs`

## 6. `payment`: node-initiated settle with signed receipt — [high]
`settle_with_receipt(node, client, amount, nonce, sig)`. Verify ed25519 over `(client,node,amount,nonce)`. Reject reused nonce. Same balance checks. Node calls auth, client does not. Tests: valid receipt, bad sig, replay rejected.
Files: `contracts/payment/src/{lib,test}.rs`

## 7. `payment`: emergency admin pause — [medium]
`pause()` / `unpause()` admin-only. Blocks open_session / settle / top_up; close still works. Tests verify each gated path.
Files: `contracts/payment/src/{lib,test}.rs`

## 8. `payment`: session expiry / timeout-close — [medium]
Add `max_session_duration` config (admin-settable). After expiry anyone can call `close_expired(client, node)` to refund unused balance. Tests cover expiry, pre-expiry rejection, post-close idempotency.
Files: `contracts/payment/src/{lib,test}.rs`

## 9. New contract: `reputation` skeleton — [high]
Create `contracts/reputation/` crate. Track `(node, uptime_score, slash_count)`. Entrypoints: `record_uptime`, `slash`, `score`. Stub `slash` behind admin auth for now. Full tests of state transitions.
Files: `contracts/reputation/**`, root `Cargo.toml`

## 10. Contract size audit — [trivial]
Run `stellar contract build` for each crate, record WASM byte sizes in `docs/CONTRACT_SIZES.md`. Flag any contract over 64KB.
Files: `docs/CONTRACT_SIZES.md`

## 11. Replace `symbol_short!` usage with named events docs — [trivial]
Audit lib.rs files, ensure every `#[contractevent]` has a doc-comment describing topics + fields. No code change beyond comments.
Files: `contracts/*/src/lib.rs`

## 12. Add `version()` view to each contract — [trivial]
Public `version() -> u32` returning a const. Lets clients verify which schema is deployed. One test per contract.
Files: all contracts

---

# Backend — node daemon (Go)

## 13. Load TOML config — [medium]
Parse `noded.toml` with `BurntSushi/toml`. Fields: stellar_secret, horizon_url, soroban_rpc_url, wg_interface, listen_addr, db_path. Validate non-empty. Test with sample config in `backend/testdata/`.
Files: `backend/internal/config/`, `backend/cmd/noded/main.go`

## 14. Stellar client: registration check — [medium]
Implement `IsNodeRegistered(operator)` calling Soroban RPC `simulateTransaction` on `registry.get_node`. Return bool + error. Daemon should exit on startup if not registered.
Files: `backend/internal/stellar/client.go`

## 15. Wire SIGTERM graceful shutdown — [trivial]
Daemon cancels root context on SIGTERM/SIGINT, waits up to 10s for goroutines, then exits. Add to `cmd/noded/main.go`.
Files: `backend/cmd/noded/main.go`

## 16. Heartbeat loop — [medium]
Every 60s, call `registry.heartbeat(operator)` (introduce this entrypoint too, side issue #29) to mark liveness. Backoff on failure. Log to stderr in JSON.
Files: `backend/internal/heartbeat/`, contract update

## 17. WireGuard manager: wgctrl-go backend — [high]
Implement `Manager` interface from `internal/wireguard/peer.go` using `golang.zx2c4.com/wireguard/wgctrl`. AddPeer / RemovePeer / ListPeers / UsageBytes. Integration test gated behind a build tag (requires root).
Files: `backend/internal/wireguard/wgctrl.go`

## 18. WireGuard manager: CLI fallback — [medium]
Alternate `Manager` impl that shells out to `wg` and `ip` for environments without netlink. Parse `wg show <iface> dump`.
Files: `backend/internal/wireguard/cli.go`

## 19. Session store: in-memory — [medium]
Implement `Store` from `internal/session/session.go` with sync.RWMutex map. Full unit tests.
Files: `backend/internal/session/memory.go`

## 20. Session store: BoltDB persistent — [medium]
Second `Store` impl using `go.etcd.io/bbolt`. Survives daemon restart. Tests use tempdir.
Files: `backend/internal/session/bolt.go`

## 21. Usage accounting ticker — [medium]
Every 10s, poll `wg` for rx/tx per peer, update Session.BytesIn/Out. Emit metric to log.
Files: `backend/internal/accounting/`

## 22. Settle ticker — [high]
Every 60s, for each session compute unpaid bytes × rate → USDC amount, build a `settle_with_receipt` call signed by the *client* (received via control API), submit to Soroban RPC. Retry with backoff on failure.
Files: `backend/internal/settle/`

## 23. Control API: HTTP server — [medium]
`POST /v1/sessions` to start, `DELETE /v1/sessions/:id` to close, `GET /v1/sessions/:id` for status. Returns WireGuard peer config on success. Auth via Stellar signed challenge in header.
Files: `backend/internal/api/`

## 24. Control API: signed-receipt endpoint — [medium]
`POST /v1/sessions/:id/receipt` accepts a signed receipt from the client, validates signature, stores latest one for the settle ticker. Reject if nonce <= last seen.
Files: `backend/internal/api/receipt.go`

## 25. Pricing config — [trivial]
Add `rate_usdc_per_mb` to noded.toml. Expose via `GET /v1/info`. Clients query before connecting.
Files: `backend/internal/config/`, `backend/internal/api/info.go`

## 26. Prometheus metrics — [medium]
Export `noded_sessions_active`, `noded_bytes_total{peer}`, `noded_settles_total{result}`, `noded_settle_amount_usdc_total`. Bind `/metrics`.
Files: `backend/internal/metrics/`

## 27. Structured logging — [trivial]
Use `log/slog` with JSON handler. Include trace_id per session for cross-cutting logs.
Files: `backend/internal/log/`

---

# Client — CLI (Go)

## 28. `stelvpn list` — fetch active nodes — [medium]
Call `registry.list_active` via Soroban RPC, render table with operator, endpoint, stake, uptime score (when reputation lands). Sort by score desc.
Files: `client/cmd/stelvpn/list.go`

## 29. `stelvpn connect <node>` — full handshake — [high]
1) call node's `/v1/info` for rate and pubkey, 2) call payment.open_session with chosen deposit, 3) POST to node `/v1/sessions` with signed challenge, 4) write `wg-quick`-compatible config to `~/.stelvpn/wg0.conf`, 5) `wg-quick up`. Cleanly roll back on any failure.
Files: `client/cmd/stelvpn/connect.go`

## 30. `stelvpn disconnect` — [medium]
`wg-quick down`, DELETE the session on the node, call `payment.close_session` to collect refund. Tests use a mocked node.
Files: `client/cmd/stelvpn/disconnect.go`

## 31. `stelvpn status` — [trivial]
Read `~/.stelvpn/state.json`, show current node, bytes used, USDC spent, remaining balance.
Files: `client/cmd/stelvpn/status.go`

## 32. `stelvpn balance` — [trivial]
Query Horizon for account balances (XLM + USDC). Format human-readable.
Files: `client/cmd/stelvpn/balance.go`

## 33. Receipt signer — [medium]
Every 30s while connected, sign a receipt for the cumulative spend and POST to the node's `/v1/sessions/:id/receipt`. Increment nonce. Local persistence so reconnect doesn't reuse a nonce.
Files: `client/internal/session/receipt.go`

## 34. Keypair management — [medium]
`stelvpn keygen` to create a keypair stored encrypted at `~/.stelvpn/key`. Use `argon2id` + AES-GCM. Prompt for passphrase on use. `stelvpn import <secret>` and `stelvpn export`.
Files: `client/cmd/stelvpn/key.go`

## 35. Friendbot helper — [trivial]
`stelvpn fund` calls Stellar friendbot to fund a testnet account. Refuse on mainnet network ID. One-liner curl wrapper with proper error handling.
Files: `client/cmd/stelvpn/fund.go`

---

# Frontend — React + Freighter

## 36. Freighter connect button — [medium]
`useFreighter()` hook. Detects extension, requests permission, exposes signed-by address. Show address on connect; "Install Freighter" CTA if missing.
Files: `frontend/src/lib/freighter.ts`, `frontend/src/components/ConnectButton.tsx`

## 37. Node list page — [medium]
Fetch from registry contract via `@stellar/stellar-sdk` Soroban RPC. Card per node with endpoint, stake, score, "Connect" button. Loading + empty + error states.
Files: `frontend/src/components/NodeList.tsx`

## 38. Session dashboard — [medium]
Live counter of bytes used, USDC spent, remaining balance. Polls node `/v1/sessions/:id` every 5s. Disconnect button.
Files: `frontend/src/components/SessionDashboard.tsx`

## 39. Open-session flow — [high]
Sign + submit `open_session` tx via Freighter. Show pending state, success with tx hash linked to stellar.expert, failure with parsed error. Save session locally so refresh resumes.
Files: `frontend/src/lib/openSession.ts`, `frontend/src/components/ConnectFlow.tsx`

## 40. Network switcher — [trivial]
Header dropdown for testnet/mainnet/futurenet. Persists in localStorage. Triggers reload of contract addresses from `deployments/<network>.json`.
Files: `frontend/src/components/NetworkSwitcher.tsx`

## 41. Toast notifications — [trivial]
Lightweight toast for tx success/failure. No dependency on a toast library — vanilla React, ~40 lines.
Files: `frontend/src/components/Toast.tsx`

## 42. Dark mode — [trivial]
Toggle in header, persists in localStorage, applies CSS custom properties. No flicker on load.
Files: `frontend/src/lib/theme.ts`

## 43. Empty + error states polish — [trivial]
Replace placeholder text in NodeList, SessionDashboard with proper empty/error illustrations (use simple inline SVG, no asset dependency).
Files: `frontend/src/components/`

---

# Infra · Docs · CI

## 44. GitHub Actions: contracts CI — [medium]
On push/PR: `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test`, `cargo build --target wasm32-unknown-unknown --release`. Cache cargo + target.
Files: `.github/workflows/contracts.yml`

## 45. GitHub Actions: backend + client CI — [medium]
`go test ./...`, `go vet ./...`, `staticcheck`. Matrix for backend and client modules.
Files: `.github/workflows/go.yml`

## 46. GitHub Actions: frontend CI — [trivial]
`npm ci && npm run build && npm run lint` for frontend. Cache node_modules.
Files: `.github/workflows/frontend.yml`

## 47. Testnet deploy script — [medium]
`scripts/deploy_testnet.sh`: build contracts, deploy registry + payment with admin = `$STELLAR_ACCOUNT`. Write contract IDs to `deployments/testnet.json`. Idempotent.
Files: `scripts/deploy_testnet.sh`, `docs/DEPLOY.md`

## 48. Dockerfile for `noded` — [medium]
Multi-stage build, distroless final image. Expose `/metrics` and control port. Document run command with `--cap-add=NET_ADMIN`.
Files: `backend/Dockerfile`, `docs/DOCKER.md`

## 49. Contract API reference doc — [trivial]
`docs/CONTRACTS.md` listing each entrypoint: params, returns, events, errors. Derive from current code, keep in sync via PR review.
Files: `docs/CONTRACTS.md`

## 50. End-to-end demo script — [high]
`scripts/e2e.sh` spins up a local Stellar quickstart, deploys contracts, starts `noded` in a container, runs a `stelvpn connect` + transfer + disconnect, asserts balances changed correctly. Used in CI nightly.
Files: `scripts/e2e.sh`, `.github/workflows/e2e.yml`
