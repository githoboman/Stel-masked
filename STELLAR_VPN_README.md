# StellarVPN — Decentralized VPN on the Stellar Network

> A permissionless, censorship-resistant VPN where users provide bandwidth, payments settle on the Stellar blockchain via Soroban smart contracts, and every transaction confirms in ~5 seconds with fees under $0.001.

---

## Table of Contents

1. [What We Are Building](#1-what-we-are-building)
2. [Why Stellar](#2-why-stellar)
3. [Architecture Overview](#3-architecture-overview)
4. [Technology Stack](#4-technology-stack)
5. [Project Structure](#5-project-structure)
6. [Phase 1 — Environment Setup](#6-phase-1--environment-setup)
7. [Phase 2 — Soroban Smart Contracts](#7-phase-2--soroban-smart-contracts)
   - [registry contract](#71-registry-contract)
   - [payment contract](#72-payment-contract)
   - [reputation contract](#73-reputation-contract)
   - [governance contract](#74-governance-contract)
8. [Phase 3 — Testing Contracts Locally](#8-phase-3--testing-contracts-locally)
9. [Phase 4 — Node Daemon](#9-phase-4--node-daemon)
10. [Phase 5 — Client Application](#10-phase-5--client-application)
11. [Phase 6 — React Frontend](#11-phase-6--react-frontend)
12. [Phase 7 — Server Switching Logic](#12-phase-7--server-switching-logic)
13. [Phase 8 — Testnet Deployment](#13-phase-8--testnet-deployment)
14. [Phase 9 — Mainnet Deployment](#14-phase-9--mainnet-deployment)
15. [Security Checklist](#15-security-checklist)
16. [Build Timeline](#16-build-timeline)
17. [Server Availability by Phase](#17-server-availability-by-phase)
18. [FAQ](#18-faq)

---

## 1. What We Are Building

StellarVPN is a decentralized VPN network where:

- **Anyone** can run a node, stake XLM, and earn USDC by providing bandwidth
- **Users** pay per megabyte using streaming micropayments settled on Stellar
- **No central authority** controls the network — Soroban smart contracts are the rules
- **Payments confirm in ~5 seconds** with fees of fractions of a cent
- **USDC** (Circle's stablecoin, native on Stellar) is the preferred payment currency — no crypto volatility for node operators
- **WireGuard** handles the encrypted tunnel — fast, modern, kernel-native

---

## 2. Why Stellar

| Feature | Detail |
|---------|--------|
| ~5 second finality | Stellar's Federated Byzantine Agreement (FBA) settles transactions in seconds — fast enough for near-real-time micropayments |
| Sub-cent fees | Transaction fees are ~0.00001 XLM (~$0.000001) — viable for per-MB micropayments at scale |
| Native USDC | Circle's USDC is issued natively on Stellar — node operators earn stable USD-denominated income with no bridging |
| Soroban smart contracts | Rust-based, WASM-compiled contracts — familiar tooling, strong type safety, thorough test framework |
| Horizon API | Free public REST API for reading blockchain state — no self-hosted node needed to start |
| Built-in DEX | XLM ↔ USDC swaps available on-chain — users can pay in XLM and nodes receive USDC automatically |
| Freighter wallet | Browser-extension wallet with native Soroban support — clean UX for non-crypto users |

### Stellar vs Other Chains for a VPN

| | Stellar | Stacks (Bitcoin L2) | Ethereum |
|---|---|---|---|
| Finality | ~5 seconds | ~5 seconds (post-Nakamoto) | ~12 seconds |
| Fee per tx | ~$0.000001 | ~$0.001 | $0.50–$5.00 |
| Payment currency | USDC (stable) | STX / sBTC | ETH / ERC-20 |
| Smart contracts | Soroban (Rust) | Clarity | Solidity |
| Bitcoin security | No | Yes (PoX anchor) | No |
| Best for | High-frequency micropayments | Bitcoin-native users | Large DeFi integrations |

**Verdict**: Stellar wins on fees and USDC stability — critical for a VPN where you're settling hundreds of small payments per hour.

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                          │
│  VPN App  │  Freighter Wallet  │  Session Manager        │
└─────────────────────┬────────────────────────────────────┘
                      │ invoke Soroban contracts
┌─────────────────────▼────────────────────────────────────┐
│            SOROBAN SMART CONTRACT LAYER                   │
│                                                           │
│  registry   │   payment   │  reputation  │  governance   │
│  (node reg) │   (escrow)  │  (slash)     │  (DAO params) │
│                                                           │
│  USDC SAC (Stellar Asset Contract) for payments          │
│  Horizon API for state reads (free, no self-hosted node) │
└─────────────────────┬────────────────────────────────────┘
                      │ stake / settle / slash
┌─────────────────────▼────────────────────────────────────┐
│               NODE PROVIDER NETWORK                       │
│                                                           │
│  Node Daemon   │  Staking Vault  │  WireGuard relay      │
│  (bandwidth +  │  (100 XLM min)  │  (tunnel + IP pool)   │
│   heartbeat)   │                 │                        │
└─────────────────────┬────────────────────────────────────┘
                      │ FBA consensus
┌─────────────────────▼────────────────────────────────────┐
│       STELLAR NETWORK — Federated Byzantine Agreement     │
│  ~5 second finality, $0.000001 per transaction           │
└──────────────────────────────────────────────────────────┘
```

### Payment Flow (Per Session)

1. Client queries `registry` contract off-chain via Horizon API — free, instant
2. Client pings top 5 nodes, picks lowest latency
3. Client calls `payment.open_session` — locks USDC escrow in Soroban contract
4. Client and node exchange WireGuard public keys
5. WireGuard tunnel comes up — encrypted traffic flows
6. Every 60 seconds node sends `reputation.heartbeat` transaction
7. On disconnect, node calls `payment.claim_payment` with MB served
8. Unused USDC escrow is automatically refunded to client
9. If client disconnects dirty, node waits for `SESSION_TTL` then calls `payment.claim_timeout`

### Server Switching Flow

1. Query cached Horizon API node list locally — no on-chain call
2. Probe latency of top 5 candidates simultaneously
3. **In parallel**: submit final voucher to old node + open escrow on new node
4. Bring up new WireGuard tunnel, tear down old one
5. Traffic resumes — target under 3 seconds total

---

## 4. Technology Stack

| Component | Technology |
|-----------|-----------|
| Smart contracts | Soroban (Rust + WASM) |
| Contract testing | `cargo test` + Soroban test utilities |
| Node daemon | Node.js + `@stellar/stellar-sdk` |
| VPN tunneling | WireGuard |
| Frontend | React + Vite |
| Wallet integration | Freighter (`@stellar/freighter-api`) |
| Stellar JS SDK | `@stellar/stellar-sdk` |
| Payment currency | USDC (primary), XLM (fallback) |
| Blockchain reads | Horizon REST API (free, public) |
| Event monitoring | Horizon event stream / webhooks |
| Block explorer | Stellar Expert, Stellar Laboratory |
| Node infrastructure | Any Ubuntu 22.04 VPS |

---

## 5. Project Structure

```
stellar-vpn/
├── contracts/
│   ├── registry/
│   │   ├── src/
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   ├── payment/
│   │   ├── src/
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   ├── reputation/
│   │   ├── src/
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   └── governance/
│       ├── src/
│       │   └── lib.rs
│       └── Cargo.toml
│
├── vpn-node/               ← Node daemon (runs on VPS)
│   ├── daemon.js
│   ├── wireguard.js
│   ├── meter.js
│   ├── heartbeat.js
│   ├── .env
│   └── package.json
│
├── vpn-client/             ← Client session library
│   ├── session.js
│   ├── discovery.js
│   ├── wireguard.js
│   └── package.json
│
└── vpn-ui/                 ← React frontend
    ├── src/
    │   ├── App.jsx
    │   ├── NodeList.jsx
    │   └── SessionStatus.jsx
    ├── .env
    └── package.json
```

---

## 6. Phase 1 — Environment Setup

### Prerequisites

- Ubuntu 22.04, macOS, or Windows (WSL2 recommended for Windows)
- Node.js 18+
- Rust (for Soroban contracts)
- Git

### Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup target add wasm32-unknown-unknown
```

### Install Stellar CLI

```bash
# Install via cargo
cargo install --locked stellar-cli --features opt

# Verify
stellar --version
```

### Scaffold the Soroban Project

```bash
# Create contract workspaces
mkdir stellar-vpn && cd stellar-vpn

stellar contract init contracts/registry
stellar contract init contracts/payment
stellar contract init contracts/reputation
stellar contract init contracts/governance
```

### Install Node.js Dependencies (Node Daemon)

```bash
mkdir vpn-node && cd vpn-node
npm init -y
npm install @stellar/stellar-sdk express dotenv
cd ..
```

### Install Node.js Dependencies (Client)

```bash
mkdir vpn-client && cd vpn-client
npm init -y
npm install @stellar/stellar-sdk @stellar/freighter-api dotenv
cd ..
```

### Scaffold React Frontend

```bash
npm create vite@latest vpn-ui -- --template react
cd vpn-ui
npm install @stellar/stellar-sdk @stellar/freighter-api
cd ..
```

### Configure Stellar CLI for Testnet

```bash
# Add testnet network
stellar network add \
  --network-passphrase "Test SDF Network ; September 2015" \
  --rpc-url https://soroban-testnet.stellar.org \
  testnet

# Generate a deployer identity
stellar keys generate deployer --network testnet

# Fund with testnet XLM via Friendbot
stellar keys fund deployer --network testnet

# Check balance
stellar keys address deployer
```

---

## 7. Phase 2 — Soroban Smart Contracts

> Soroban contracts are written in Rust and compiled to WASM. They run inside Stellar's smart contract VM. Use `cargo test` for unit tests before deploying anything.

### 7.1 Registry Contract

Handles node registration. Nodes stake XLM to be listed. Clients read this contract via Horizon to discover servers.

```rust
// contracts/registry/src/lib.rs

#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token,
    Address, Env, String, Map, Symbol,
};

const MIN_STAKE: i128 = 100_000_000; // 100 XLM in stroops

#[contracttype]
#[derive(Clone)]
pub struct NodeInfo {
    pub stake:            i128,
    pub wireguard_pubkey: String,
    pub region:           String,
    pub capacity_mbps:    u32,
    pub registered_at:    u32,   // ledger sequence
    pub active:           bool,
}

#[contracttype]
pub enum DataKey {
    Node(Address),
    XlmToken,
    ReputationContract,
}

#[contract]
pub struct RegistryContract;

#[contractimpl]
impl RegistryContract {

    /// Called once at deployment to set XLM token address
    pub fn initialize(env: Env, xlm_token: Address, reputation: Address) {
        env.storage().instance().set(&DataKey::XlmToken, &xlm_token);
        env.storage().instance().set(&DataKey::ReputationContract, &reputation);
    }

    /// Node registers by staking XLM
    pub fn register_node(
        env: Env,
        node: Address,
        wg_pubkey: String,
        region: String,
        capacity_mbps: u32,
    ) {
        node.require_auth();

        // Reject duplicate registration
        assert!(
            !env.storage().persistent().has(&DataKey::Node(node.clone())),
            "already registered"
        );

        // Transfer stake from node into contract
        let xlm_token: Address = env.storage().instance().get(&DataKey::XlmToken).unwrap();
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(&node, &env.current_contract_address(), &MIN_STAKE);

        env.storage().persistent().set(
            &DataKey::Node(node.clone()),
            &NodeInfo {
                stake:            MIN_STAKE,
                wireguard_pubkey: wg_pubkey,
                region,
                capacity_mbps,
                registered_at:    env.ledger().sequence(),
                active:           true,
            },
        );
    }

    /// Read a node's registration data (free simulation call)
    pub fn get_node(env: Env, node: Address) -> Option<NodeInfo> {
        env.storage().persistent().get(&DataKey::Node(node))
    }

    /// Node updates its WireGuard public key
    pub fn update_pubkey(env: Env, node: Address, new_pubkey: String) {
        node.require_auth();
        let mut info: NodeInfo = env
            .storage().persistent()
            .get(&DataKey::Node(node.clone()))
            .expect("not registered");
        info.wireguard_pubkey = new_pubkey;
        env.storage().persistent().set(&DataKey::Node(node), &info);
    }

    /// Node deregisters and reclaims stake
    pub fn deregister_node(env: Env, node: Address) {
        node.require_auth();
        let info: NodeInfo = env
            .storage().persistent()
            .get(&DataKey::Node(node.clone()))
            .expect("not registered");

        let xlm_token: Address = env.storage().instance().get(&DataKey::XlmToken).unwrap();
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(&env.current_contract_address(), &node, &info.stake);

        env.storage().persistent().remove(&DataKey::Node(node));
    }

    /// Called by reputation contract to slash a misbehaving node
    pub fn slash_node(env: Env, node: Address, slash_amount: i128) {
        // Only the reputation contract can call this
        let reputation: Address = env
            .storage().instance()
            .get(&DataKey::ReputationContract)
            .unwrap();
        reputation.require_auth();

        let mut info: NodeInfo = env
            .storage().persistent()
            .get(&DataKey::Node(node.clone()))
            .expect("not registered");

        info.stake -= slash_amount;
        info.active = false;
        env.storage().persistent().set(&DataKey::Node(node), &info);
    }
}
```

---

### 7.2 Payment Contract

Session escrow using USDC. Users lock USDC when opening a session. Nodes claim payment per MB served. Timeout protection for dirty disconnects.

```rust
// contracts/payment/src/lib.rs

#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

// ~12 minutes at 5s/ledger = 144 ledgers
const SESSION_TTL: u32 = 144;

#[contracttype]
#[derive(Clone)]
pub struct Session {
    pub escrow:        i128,
    pub opened_at:     u32,   // ledger sequence
    pub rate_per_mb:   i128,  // USDC stroops per MB
}

#[contracttype]
pub enum DataKey {
    Session(Address, Address), // (client, node)
    UsdcToken,
}

#[contract]
pub struct PaymentContract;

#[contractimpl]
impl PaymentContract {

    pub fn initialize(env: Env, usdc_token: Address) {
        env.storage().instance().set(&DataKey::UsdcToken, &usdc_token);
    }

    /// Client opens a session — locks USDC escrow
    pub fn open_session(
        env: Env,
        client: Address,
        node: Address,
        escrow_amount: i128,
        rate_per_mb: i128,
    ) {
        client.require_auth();

        let usdc: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let token_client = token::Client::new(&env, &usdc);

        // Lock escrow into contract
        token_client.transfer(&client, &env.current_contract_address(), &escrow_amount);

        env.storage().persistent().set(
            &DataKey::Session(client, node),
            &Session {
                escrow: escrow_amount,
                opened_at: env.ledger().sequence(),
                rate_per_mb,
            },
        );
    }

    /// Node claims payment for MB served — unused escrow refunded to client
    pub fn claim_payment(
        env: Env,
        node: Address,
        client: Address,
        mb_served: i128,
    ) {
        node.require_auth();

        let session: Session = env
            .storage().persistent()
            .get(&DataKey::Session(client.clone(), node.clone()))
            .expect("session not found");

        let usdc: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let token_client = token::Client::new(&env, &usdc);

        let owed = mb_served * session.rate_per_mb;
        let payout = owed.min(session.escrow);
        let refund = session.escrow - payout;

        // Pay node
        if payout > 0 {
            token_client.transfer(&env.current_contract_address(), &node, &payout);
        }

        // Refund unused escrow to client
        if refund > 0 {
            token_client.transfer(&env.current_contract_address(), &client, &refund);
        }

        env.storage().persistent().remove(&DataKey::Session(client, node));
    }

    /// Node claims full escrow after SESSION_TTL if client disappeared
    pub fn claim_timeout(env: Env, node: Address, client: Address) {
        node.require_auth();

        let session: Session = env
            .storage().persistent()
            .get(&DataKey::Session(client.clone(), node.clone()))
            .expect("session not found");

        let age = env.ledger().sequence() - session.opened_at;
        assert!(age > SESSION_TTL, "timeout not reached yet");

        let usdc: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let token_client = token::Client::new(&env, &usdc);
        token_client.transfer(&env.current_contract_address(), &node, &session.escrow);

        env.storage().persistent().remove(&DataKey::Session(client, node));
    }

    /// Read session data (free simulation call)
    pub fn get_session(env: Env, client: Address, node: Address) -> Option<Session> {
        env.storage().persistent().get(&DataKey::Session(client, node))
    }
}
```

---

### 7.3 Reputation Contract

Tracks node liveness via heartbeats. Challengers can slash silent nodes and earn 80% of the slashed stake.

```rust
// contracts/reputation/src/lib.rs

#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

const HEARTBEAT_INTERVAL: u32 = 12;  // ledgers (~60s)
const SLASH_THRESHOLD: u32    = 36;  // 3 missed intervals
const SLASH_AMOUNT: i128       = 25_000_000; // 25 XLM in stroops

#[contracttype]
#[derive(Clone)]
pub struct NodeScore {
    pub last_beat:     u32,
    pub uptime_count:  u32,
    pub slash_count:   u32,
}

#[contracttype]
pub enum DataKey {
    Score(Address),
    RegistryContract,
}

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {

    pub fn initialize(env: Env, registry: Address) {
        env.storage().instance().set(&DataKey::RegistryContract, &registry);
    }

    /// Node calls this every ~60 seconds to prove liveness
    pub fn heartbeat(env: Env, node: Address) {
        node.require_auth();

        let current = env.ledger().sequence();

        let score = env.storage().persistent()
            .get(&DataKey::Score(node.clone()))
            .unwrap_or(NodeScore {
                last_beat: current,
                uptime_count: 0,
                slash_count: 0,
            });

        assert!(
            current - score.last_beat >= HEARTBEAT_INTERVAL,
            "too soon"
        );

        env.storage().persistent().set(
            &DataKey::Score(node),
            &NodeScore {
                last_beat: current,
                uptime_count: score.uptime_count + 1,
                slash_count: score.slash_count,
            },
        );
    }

    /// Anyone can challenge a silent node and earn 80% of slashed stake
    pub fn challenge_node(env: Env, challenger: Address, node: Address) {
        challenger.require_auth();

        let score: NodeScore = env
            .storage().persistent()
            .get(&DataKey::Score(node.clone()))
            .expect("node not found");

        let gap = env.ledger().sequence() - score.last_beat;
        assert!(gap > SLASH_THRESHOLD, "node is alive");

        // Call registry to slash the node
        let registry: Address = env
            .storage().instance()
            .get(&DataKey::RegistryContract)
            .unwrap();

        // Cross-contract call into registry
        let registry_client = RegistryContractClient::new(&env, &registry);
        registry_client.slash_node(&node, &SLASH_AMOUNT);

        // Update score
        env.storage().persistent().set(
            &DataKey::Score(node),
            &NodeScore {
                last_beat: score.last_beat,
                uptime_count: 0,
                slash_count: score.slash_count + 1,
            },
        );
    }

    /// Read a node's reputation score
    pub fn get_score(env: Env, node: Address) -> Option<NodeScore> {
        env.storage().persistent().get(&DataKey::Score(node))
    }

    /// Check if a node is currently alive
    pub fn is_alive(env: Env, node: Address) -> bool {
        let score: Option<NodeScore> = env
            .storage().persistent()
            .get(&DataKey::Score(node));
        match score {
            None => false,
            Some(s) => env.ledger().sequence() - s.last_beat < SLASH_THRESHOLD,
        }
    }
}
```

---

### 7.4 Governance Contract

DAO-controlled parameters. Set owner to multisig at launch. Transition to full community voting later.

```rust
// contracts/governance/src/lib.rs

#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
pub enum DataKey {
    Owner,
    MinStake,
    RateFloor,
    SessionTtl,
    HeartbeatInterval,
}

#[contract]
pub struct GovernanceContract;

#[contractimpl]
impl GovernanceContract {

    pub fn initialize(env: Env, owner: Address) {
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::MinStake, &100_000_000_i128); // 100 XLM
        env.storage().instance().set(&DataKey::RateFloor, &100_i128);         // min USDC stroops/MB
        env.storage().instance().set(&DataKey::SessionTtl, &144_u32);
        env.storage().instance().set(&DataKey::HeartbeatInterval, &12_u32);
    }

    pub fn get_params(env: Env) -> (i128, i128, u32, u32) {
        (
            env.storage().instance().get(&DataKey::MinStake).unwrap(),
            env.storage().instance().get(&DataKey::RateFloor).unwrap(),
            env.storage().instance().get(&DataKey::SessionTtl).unwrap(),
            env.storage().instance().get(&DataKey::HeartbeatInterval).unwrap(),
        )
    }

    pub fn set_min_stake(env: Env, new_amount: i128) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();
        env.storage().instance().set(&DataKey::MinStake, &new_amount);
    }

    pub fn transfer_ownership(env: Env, new_owner: Address) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &new_owner);
    }
}
```

---

## 8. Phase 3 — Testing Contracts Locally

### Run Unit Tests

```bash
cd contracts/registry
cargo test

cd ../payment
cargo test

cd ../reputation
cargo test
```

### Write Unit Tests for Registry

```rust
// contracts/registry/src/lib.rs — add test module at bottom

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

    #[test]
    fn test_register_node() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, RegistryContract);
        let client = RegistryContractClient::new(&env, &contract_id);

        let xlm_token = Address::generate(&env);
        let reputation = Address::generate(&env);
        client.initialize(&xlm_token, &reputation);

        let node = Address::generate(&env);

        client.register_node(
            &node,
            &String::from_str(&env, "abc123wireguardpublickey"),
            &String::from_str(&env, "us-east"),
            &100u32,
        );

        let info = client.get_node(&node).unwrap();
        assert!(info.active);
        assert_eq!(info.capacity_mbps, 100u32);
    }

    #[test]
    #[should_panic(expected = "already registered")]
    fn test_reject_duplicate_registration() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, RegistryContract);
        let client = RegistryContractClient::new(&env, &contract_id);

        let xlm_token = Address::generate(&env);
        let reputation = Address::generate(&env);
        client.initialize(&xlm_token, &reputation);

        let node = Address::generate(&env);

        client.register_node(
            &node,
            &String::from_str(&env, "pubkey1"),
            &String::from_str(&env, "us-east"),
            &100u32,
        );

        // Should panic on second registration
        client.register_node(
            &node,
            &String::from_str(&env, "pubkey2"),
            &String::from_str(&env, "eu-west"),
            &50u32,
        );
    }
}
```

### Write Unit Tests for Payment

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_open_and_claim_session() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, PaymentContract);
        let client = PaymentContractClient::new(&env, &contract_id);

        let usdc_token = Address::generate(&env);
        client.initialize(&usdc_token);

        let node    = Address::generate(&env);
        let user    = Address::generate(&env);

        // Open session with 5 USDC escrow, 1000 stroops/MB rate
        client.open_session(&user, &node, &5_000_000, &1000);

        let session = client.get_session(&user, &node).unwrap();
        assert_eq!(session.escrow, 5_000_000);

        // Node claims 3000 MB = 3_000_000 USDC stroops owed
        client.claim_payment(&node, &user, &3000);

        // Session should be deleted after claim
        assert!(client.get_session(&user, &node).is_none());
    }

    #[test]
    #[should_panic(expected = "timeout not reached yet")]
    fn test_reject_premature_timeout_claim() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, PaymentContract);
        let client = PaymentContractClient::new(&env, &contract_id);

        let usdc_token = Address::generate(&env);
        client.initialize(&usdc_token);

        let node = Address::generate(&env);
        let user = Address::generate(&env);

        client.open_session(&user, &node, &5_000_000, &1000);
        // Should panic — SESSION_TTL not elapsed
        client.claim_timeout(&node, &user);
    }
}
```

---

## 9. Phase 4 — Node Daemon

Runs on a VPS. Manages WireGuard, meters bandwidth, sends heartbeats, claims payment on session close.

### Install WireGuard on Ubuntu VPS

```bash
sudo apt update && sudo apt install wireguard -y

# Generate keypair
wg genkey | sudo tee /etc/wireguard/private.key | wg pubkey | sudo tee /etc/wireguard/public.key
sudo chmod 600 /etc/wireguard/private.key

# View public key — paste this into register_node()
sudo cat /etc/wireguard/public.key
```

### WireGuard Base Config — `/etc/wireguard/wg0.conf`

```ini
[Interface]
PrivateKey = <contents of private.key>
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; \
         iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; \
           iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
```

```bash
sudo wg-quick up wg0
sudo systemctl enable wg-quick@wg0
```

### Node Daemon — `vpn-node/daemon.js`

```javascript
import {
  Keypair, Networks, TransactionBuilder, Operation,
  Contract, SorobanRpc, BASE_FEE, nativeToScVal
} from '@stellar/stellar-sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
dotenv.config();

const execAsync = promisify(exec);

const server    = new SorobanRpc.Server(process.env.SOROBAN_RPC_URL);
const keypair   = Keypair.fromSecret(process.env.NODE_SECRET_KEY);
const CONTRACT  = {
  reputation: process.env.REPUTATION_CONTRACT_ID,
  payment:    process.env.PAYMENT_CONTRACT_ID,
};

// ── Bandwidth metering ────────────────────────────────────────────────────
const sessions = new Map(); // clientAddress -> { bytes, assignedIp, wgPubkey }

async function getWgStats() {
  const { stdout } = await execAsync('sudo wg show wg0 transfer');
  stdout.trim().split('\n').forEach(line => {
    const [pubkey, rx, tx] = line.split('\t');
    const existing = sessions.get(pubkey) || {};
    sessions.set(pubkey, { ...existing, rx: parseInt(rx), tx: parseInt(tx) });
  });
}

// ── WireGuard peer management ─────────────────────────────────────────────
export async function addPeer(wgPubkey, assignedIp) {
  await execAsync(`wg set wg0 peer ${wgPubkey} allowed-ips ${assignedIp}/32`);
  console.log(`[WG] Peer added: ${wgPubkey.slice(0,16)}... → ${assignedIp}`);
}

export async function removePeer(wgPubkey) {
  await execAsync(`wg set wg0 peer ${wgPubkey} remove`);
  console.log(`[WG] Peer removed: ${wgPubkey.slice(0,16)}...`);
}

// ── Build and submit a Soroban transaction ────────────────────────────────
async function invokeContract(contractId, method, args = []) {
  const account  = await server.getAccount(keypair.publicKey());
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.PUBLIC,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(keypair);
  const result = await server.sendTransaction(prepared);
  console.log(`[Chain] ${method} → ${result.hash}`);
  return result;
}

// ── Heartbeat ─────────────────────────────────────────────────────────────
async function sendHeartbeat() {
  try {
    await invokeContract(CONTRACT.reputation, 'heartbeat');
    console.log(`[Heartbeat] ${new Date().toISOString()} — node alive`);
  } catch (err) {
    console.error('[Heartbeat] Failed:', err.message);
  }
}

// ── Claim payment on session close ────────────────────────────────────────
export async function claimPayment(clientAddress, bytesServed) {
  const mbServed = Math.floor(bytesServed / (1024 * 1024));
  if (mbServed === 0) return;

  try {
    await invokeContract(CONTRACT.payment, 'claim_payment', [
      nativeToScVal(keypair.publicKey(), { type: 'address' }),
      nativeToScVal(clientAddress,       { type: 'address' }),
      nativeToScVal(mbServed,            { type: 'i128' }),
    ]);
    console.log(`[Payment] Claimed for ${mbServed} MB from ${clientAddress.slice(0,8)}...`);
  } catch (err) {
    console.error('[Payment] Claim failed:', err.message);
  }
}

// ── Claim timeout for dirty disconnect ────────────────────────────────────
export async function claimTimeout(clientAddress) {
  try {
    await invokeContract(CONTRACT.payment, 'claim_timeout', [
      nativeToScVal(keypair.publicKey(), { type: 'address' }),
      nativeToScVal(clientAddress,       { type: 'address' }),
    ]);
    console.log(`[Timeout] Claimed escrow from ${clientAddress.slice(0,8)}...`);
  } catch (err) {
    console.error('[Timeout] Claim failed:', err.message);
  }
}

// ── Main loop ─────────────────────────────────────────────────────────────
const HEARTBEAT_MS = 60_000;
setInterval(async () => {
  await getWgStats();
  await sendHeartbeat();
}, HEARTBEAT_MS);

console.log('[Daemon] StellarVPN node started');
```

### Environment File — `vpn-node/.env`

```env
NODE_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org
REGISTRY_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
PAYMENT_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
REPUTATION_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NODE_REGION=us-east
NODE_CAPACITY_MBPS=100
```

> **Never commit `.env` to Git.** Add it to `.gitignore` immediately.

### Run as systemd Service

```bash
# /etc/systemd/system/stellarvpn-node.service
[Unit]
Description=StellarVPN Node Daemon
After=network.target wg-quick@wg0.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/vpn-node
ExecStart=/usr/bin/node daemon.js
Restart=always
RestartSec=10
EnvironmentFile=/home/ubuntu/vpn-node/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable stellarvpn-node
sudo systemctl start stellarvpn-node
sudo journalctl -u stellarvpn-node -f
```

---

## 10. Phase 5 — Client Application

### `vpn-client/discovery.js` — Node Discovery

```javascript
import { SorobanRpc, Contract, nativeToScVal } from '@stellar/stellar-sdk';

const server           = new SorobanRpc.Server(process.env.SOROBAN_RPC_URL);
const REGISTRY_ID      = process.env.REGISTRY_CONTRACT_ID;
const HORIZON_URL      = 'https://horizon.stellar.org';

// Fetch node list from Horizon (free REST API, no on-chain call needed)
export async function fetchNodeList() {
  const res = await fetch(
    `${HORIZON_URL}/accounts?signer=${REGISTRY_ID}&limit=50`
  );
  const data = await res.json();
  // In production: query contract storage directly via Soroban RPC simulation
  return data._embedded?.records || [];
}

// Probe latency to a node endpoint
export async function probeLatency(nodeEndpoint, timeoutMs = 3000) {
  const start = Date.now();
  try {
    await Promise.race([
      fetch(`http://${nodeEndpoint}:8080/ping`),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error('timeout')), timeoutMs)
      ),
    ]);
    return Date.now() - start;
  } catch {
    return Infinity;
  }
}

// Pick the best node — lowest latency, highest reputation score
export async function selectBestNode(nodes) {
  const probes = await Promise.all(
    nodes.slice(0, 5).map(async (node) => ({
      ...node,
      latency: await probeLatency(node.endpoint),
    }))
  );
  return probes
    .filter(n => n.latency < Infinity)
    .sort((a, b) => a.latency - b.latency)[0];
}
```

### `vpn-client/session.js` — Session Manager

```javascript
import {
  Keypair, Networks, TransactionBuilder, Operation,
  Contract, SorobanRpc, BASE_FEE, nativeToScVal
} from '@stellar/stellar-sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
dotenv.config();

const execAsync = promisify(exec);
const server    = new SorobanRpc.Server(process.env.SOROBAN_RPC_URL);
const PAYMENT_CONTRACT = process.env.PAYMENT_CONTRACT_ID;

let currentNode    = null;
let currentSession = null;

async function invokeContract(keypair, contractId, method, args = []) {
  const account  = await server.getAccount(keypair.publicKey());
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.PUBLIC,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();
  const prepared = await server.prepareTransaction(tx);
  prepared.sign(keypair);
  return server.sendTransaction(prepared);
}

// Open VPN session — locks USDC escrow in Soroban contract
export async function openSession(keypair, nodeAddress, escrowAmount, ratePerMb) {
  const result = await invokeContract(keypair, PAYMENT_CONTRACT, 'open_session', [
    nativeToScVal(keypair.publicKey(), { type: 'address' }),
    nativeToScVal(nodeAddress,         { type: 'address' }),
    nativeToScVal(escrowAmount,        { type: 'i128' }),
    nativeToScVal(ratePerMb,           { type: 'i128' }),
  ]);
  console.log(`[Session] Opened. TX: ${result.hash}`);
  currentNode    = nodeAddress;
  currentSession = result.hash;
  return result.hash;
}

// Configure local WireGuard tunnel (requires admin/root)
export async function connectTunnel(nodeWgPubkey, nodeEndpoint, assignedIp) {
  await execAsync(
    `wg set wg0 peer ${nodeWgPubkey} endpoint ${nodeEndpoint}:51820 ` +
    `allowed-ips 0.0.0.0/0 persistent-keepalive 25`
  );
  await execAsync(`ip addr add ${assignedIp}/24 dev wg0 2>/dev/null || true`);
  await execAsync(`ip link set wg0 up`);
  console.log(`[WG] Tunnel up to ${nodeEndpoint}`);
}

// Disconnect tunnel
export async function disconnectTunnel(nodeWgPubkey) {
  await execAsync(`wg set wg0 peer ${nodeWgPubkey} remove`);
  console.log(`[WG] Tunnel torn down`);
}

// Switch servers — close old + open new in parallel
export async function switchServer(keypair, newNode, escrowAmount, ratePerMb) {
  const oldNode = currentNode;
  console.log(`[Switch] ${oldNode?.address} → ${newNode.address}`);

  await Promise.all([
    disconnectTunnel(oldNode.wgPubkey),
    openSession(keypair, newNode.address, escrowAmount, ratePerMb),
  ]);

  await connectTunnel(newNode.wgPubkey, newNode.endpoint, newNode.assignedIp);
  console.log(`[Switch] Complete in ~${Date.now()}ms`);
}
```

---

## 11. Phase 6 — React Frontend

### `vpn-ui/src/App.jsx`

```jsx
import {
  isConnected, getPublicKey, signTransaction
} from '@stellar/freighter-api';
import {
  Networks, TransactionBuilder, Contract,
  SorobanRpc, BASE_FEE, nativeToScVal
} from '@stellar/stellar-sdk';
import { useState, useEffect } from 'react';

const SOROBAN_RPC     = import.meta.env.VITE_SOROBAN_RPC_URL;
const PAYMENT_ID      = import.meta.env.VITE_PAYMENT_CONTRACT_ID;
const ESCROW_AMOUNT   = 5_000_000; // 5 USDC (7 decimal places on Stellar)
const RATE_PER_MB     = 1000;

const server = new SorobanRpc.Server(SOROBAN_RPC);

export default function App() {
  const [publicKey, setPublicKey]   = useState(null);
  const [nodes, setNodes]           = useState([]);
  const [connected, setConnected]   = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [txPending, setTxPending]   = useState(false);
  const [status, setStatus]         = useState('');

  useEffect(() => { if (publicKey) loadNodes(); }, [publicKey]);

  async function connectWallet() {
    const hasFreighter = await isConnected();
    if (!hasFreighter) {
      alert('Please install the Freighter wallet extension');
      return;
    }
    const pubKey = await getPublicKey();
    setPublicKey(pubKey);
    setStatus('Wallet connected');
  }

  async function loadNodes() {
    // Fetch available nodes from Horizon (free, no gas)
    const res = await fetch(
      `https://horizon.stellar.org/accounts?signer=${PAYMENT_ID}&limit=20`
    );
    const data = await res.json();
    setNodes(data._embedded?.records || []);
  }

  async function connectToNode(node) {
    if (!publicKey) return;
    setTxPending(true);
    setStatus('Opening session on Stellar...');

    try {
      const account  = await server.getAccount(publicKey);
      const contract = new Contract(PAYMENT_ID);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.PUBLIC,
      })
        .addOperation(contract.call('open_session',
          nativeToScVal(publicKey,     { type: 'address' }),
          nativeToScVal(node.address,  { type: 'address' }),
          nativeToScVal(ESCROW_AMOUNT, { type: 'i128' }),
          nativeToScVal(RATE_PER_MB,   { type: 'i128' }),
        ))
        .setTimeout(30)
        .build();

      const prepared   = await server.prepareTransaction(tx);
      const txXdr      = prepared.toXDR();

      // Sign with Freighter wallet
      const signedXdr  = await signTransaction(txXdr, {
        networkPassphrase: Networks.PUBLIC,
      });

      const result = await server.sendTransaction(
        TransactionBuilder.fromXDR(signedXdr, Networks.PUBLIC)
      );

      console.log('Session opened:', result.hash);
      setConnected(true);
      setActiveNode(node);
      setStatus(`Connected to ${node.region} — TX: ${result.hash.slice(0, 12)}...`);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setTxPending(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px' }}>
      <h1>StellarVPN</h1>
      <p style={{ fontSize: 12, color: '#888' }}>{status}</p>

      {!publicKey && (
        <button onClick={connectWallet}>Connect Freighter Wallet</button>
      )}

      {publicKey && !connected && (
        <div>
          <p>Wallet: {publicKey.slice(0, 12)}...</p>
          <h2>Available Nodes</h2>
          {nodes.length === 0 && <p>Loading nodes...</p>}
          {nodes.map(node => (
            <div key={node.id} style={{ marginBottom: 8 }}>
              <span>{node.region} — {node.latency}ms — {node.capacity_mbps} Mbps</span>
              <button
                onClick={() => connectToNode(node)}
                disabled={txPending}
                style={{ marginLeft: 12 }}
              >
                {txPending ? 'Connecting...' : 'Connect (5 USDC escrow)'}
              </button>
            </div>
          ))}
        </div>
      )}

      {connected && activeNode && (
        <div>
          <p>✓ Connected to {activeNode.region}</p>
          <p>Traffic routing through StellarVPN node</p>
          <p>Payment: per-MB USDC streaming to node</p>
          <button onClick={() => { setConnected(false); setActiveNode(null); }}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
```

### `vpn-ui/.env`

```env
VITE_SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org
VITE_REGISTRY_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_PAYMENT_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_NETWORK=mainnet
```

---

## 12. Phase 7 — Server Switching Logic

```javascript
// vpn-client/monitor.js

const LATENCY_THRESHOLD_MS = 300;
const CHECK_INTERVAL_MS    = 10_000;
const HORIZON_URL          = 'https://horizon.stellar.org';

export function startLatencyMonitor(getCurrentNode, onSwitchNeeded) {
  setInterval(async () => {
    const node = getCurrentNode();
    if (!node) return;

    const latency = await probeLatency(node.endpoint);
    console.log(`[Monitor] Latency: ${latency}ms`);

    if (latency > LATENCY_THRESHOLD_MS) {
      console.log('[Monitor] High latency — triggering switch');
      onSwitchNeeded('latency');
    }
  }, CHECK_INTERVAL_MS);
}

// Watch Stellar Horizon event stream for slash events on current node
export function watchReputationEvents(reputationContractId, onNodeFaulted) {
  const eventUrl =
    `${HORIZON_URL}/accounts/${reputationContractId}/transactions` +
    `?order=asc&cursor=now`;

  const es = new EventSource(eventUrl);
  es.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // If a slash transaction involves our current node, trigger switch
    if (data?.memo?.includes('slash')) {
      onNodeFaulted(data.source_account);
    }
  };
}
```

---

## 13. Phase 8 — Testnet Deployment

### Deploy Contracts to Testnet

```bash
# Build all contracts
cd contracts/registry  && cargo build --target wasm32-unknown-unknown --release
cd ../payment          && cargo build --target wasm32-unknown-unknown --release
cd ../reputation       && cargo build --target wasm32-unknown-unknown --release
cd ../governance       && cargo build --target wasm32-unknown-unknown --release

# Deploy registry
stellar contract deploy \
  --wasm contracts/registry/target/wasm32-unknown-unknown/release/registry.wasm \
  --source deployer \
  --network testnet

# Deploy payment
stellar contract deploy \
  --wasm contracts/payment/target/wasm32-unknown-unknown/release/payment.wasm \
  --source deployer \
  --network testnet

# Deploy reputation
stellar contract deploy \
  --wasm contracts/reputation/target/wasm32-unknown-unknown/release/reputation.wasm \
  --source deployer \
  --network testnet

# Deploy governance
stellar contract deploy \
  --wasm contracts/governance/target/wasm32-unknown-unknown/release/governance.wasm \
  --source deployer \
  --network testnet
```

### Get Free Testnet XLM

```bash
# Friendbot — gives 10,000 testnet XLM
curl https://friendbot.stellar.org?addr=YOUR_TESTNET_ADDRESS

# Or use Stellar Laboratory
# https://laboratory.stellar.org/#account-creator?network=testnet
```

### Initialize Contracts on Testnet

```bash
# Initialize registry with testnet XLM asset and reputation contract address
stellar contract invoke \
  --id REGISTRY_CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --xlm_token TESTNET_XLM_ADDRESS \
  --reputation REPUTATION_CONTRACT_ID

# Initialize payment with testnet USDC address
stellar contract invoke \
  --id PAYMENT_CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --usdc_token TESTNET_USDC_ADDRESS
```

### End-to-End Testnet Checklist

- [ ] Registry contract deployed — check on Stellar Expert testnet
- [ ] Node registers with 100 XLM stake — verify contract state
- [ ] Client opens session with 5 USDC escrow — verify locked in payment contract
- [ ] Node sends heartbeat — verify reputation score increments
- [ ] Node claims payment for 3000 MB — verify USDC transfer
- [ ] Client disconnects dirty — wait for SESSION_TTL, node claims timeout
- [ ] Challenger slashes silent node after 3 missed heartbeats
- [ ] Server switch completes in under 3 seconds
- [ ] Frontend connects via Freighter wallet on testnet
- [ ] Escrow amount correct — wrong amount transaction must fail

---

## 14. Phase 9 — Mainnet Deployment

### Pre-Mainnet Security Checklist

- [ ] All `cargo test` passing across all 4 contracts
- [ ] Authentication checks (`require_auth`) on every state-changing function
- [ ] `slash_node` function only callable from reputation contract address
- [ ] SESSION_TTL and HEARTBEAT_INTERVAL validated on testnet observations
- [ ] Secret keys stored in secrets manager — never in source code
- [ ] External Soroban audit completed
- [ ] Governance contract ownership transferred to multisig
- [ ] At least 3 funded VPS nodes running with monitoring
- [ ] Freighter integration tested end-to-end on mainnet

### Deploy to Mainnet

```bash
# Switch Stellar CLI to mainnet
stellar network add \
  --network-passphrase "Public Global Stellar Network ; September 2015" \
  --rpc-url https://soroban-mainnet.stellar.org \
  mainnet

# Deploy all contracts (same commands as testnet, replace --network testnet with --network mainnet)
stellar contract deploy \
  --wasm contracts/registry/target/wasm32-unknown-unknown/release/registry.wasm \
  --source deployer \
  --network mainnet
```

### Monitor with Horizon Event Stream

```javascript
// backend/events.js — react to contract events
import { Horizon } from '@stellar/stellar-sdk';

const server = new Horizon.Server('https://horizon.stellar.org');

// Stream payment contract transactions
server
  .transactions()
  .forAccount(process.env.PAYMENT_CONTRACT_ID)
  .cursor('now')
  .stream({
    onmessage: (tx) => {
      console.log('[Event] Payment TX:', tx.id);
      // Handle session opens, claims, timeouts
    },
  });
```

---

## 15. Security Checklist

| Risk | Mitigation |
|------|-----------|
| Unauthorized contract calls | `require_auth()` on every mutating function |
| Node over-claims MB | `payout = owed.min(escrow)` — can never exceed deposited amount |
| Unauthorized slash | `slash_node` only callable from reputation contract address |
| Node secret key exposed | Store in env vars / secrets manager, rotate on suspicion |
| Session never closes | `claim_timeout` after `SESSION_TTL` ledgers gives node a fallback |
| Low node availability | Bootstrap with 3–5 owned nodes at launch |
| USDC token address spoofing | Hardcode known USDC SAC address at initialization, never allow updates |
| Overflow in payment math | Use Rust's checked arithmetic — `i128` has plenty of headroom |
| Front-running | Session opened with ledger sequence TTL — not wall-clock time |

---

## 16. Build Timeline

| Phase | Work | Days |
|-------|------|------|
| Environment setup | Rust, Stellar CLI, Node.js scaffold | 1 day |
| Soroban contracts | All 4 contracts written | 10 days |
| Contract testing | `cargo test` + failure scenarios | 6 days |
| Node daemon | WireGuard + heartbeat + payment + meter | 10 days |
| Client app | Discovery + session manager + WG config | 8 days |
| React frontend | Freighter auth + UI + Soroban integration | included |
| Integration & ops | E2E testnet, event stream, multi-node switch | 7 days |
| **MVP to testnet** | | **~42 days solo** |
| Security audit | External Soroban audit | +30–60 days |
| **Mainnet ready** | | **~80–100 days** |

Stellar is slightly faster to build on than Stacks because USDC is native (no bridging complexity) and the Horizon API handles state reads without self-hosting a node.

---

## 17. Server Availability by Phase

| Server | When Available |
|--------|---------------|
| Local Rust test environment | Day 1 — runs on your laptop via `cargo test` |
| Stellar testnet | Day 1 — always on, public, free Friendbot XLM |
| Your first VPN node (testnet) | Day 18–22 |
| 2nd + 3rd nodes for switch testing | Day 28–35 |
| Stellar mainnet contracts | Day 55–80 (after audit) |
| Public node network (third parties) | Post-launch |

Run 3–5 bootstrap nodes yourself at launch — suggested regions: Lagos, London, Singapore, São Paulo, New York. These cover the majority of your likely early user base geographically.

---

## 18. FAQ

**Q: Why USDC instead of XLM for payments?**
Node operators want stable USD-denominated income. If they earn XLM and its price drops 30% overnight, they lose money even if the network is running perfectly. USDC removes this friction and makes node economics predictable.

**Q: Does Stellar have smart contracts? I thought it was just payments.**
Stellar launched Soroban smart contracts (Rust-based, compiled to WASM) in 2024. It is now a full smart contract platform, not just a payments rail.

**Q: How do users get USDC on Stellar?**
Users can acquire USDC on Stellar via centralized exchanges (Coinbase, Kraken), the Stellar DEX, or any Stellar anchor. The Freighter wallet has built-in swap functionality.

**Q: What is the Stellar Asset Contract (SAC)?**
USDC on Stellar is represented as a Stellar Asset Contract — a Soroban-compatible token interface that allows smart contracts to hold and transfer USDC. You do not need to write a custom token contract; just reference the USDC SAC address.

**Q: Can node operators also accept XLM?**
Yes — deploy a second payment contract that uses the native XLM token interface. Offer both options in the UI and let node operators specify their preference in the registry.

**Q: Is Stellar decentralized enough for this?**
Stellar uses Federated Byzantine Agreement — validators are known entities (exchanges, companies, foundations). It is more federated than Bitcoin but more decentralized than a single company's server. For a VPN, the payment and incentive layer being on Stellar is a significant improvement over trusting a single company — even if Stellar itself is not as decentralized as Bitcoin.

**Q: How is this different from Orchid?**
Orchid uses Ethereum and its own OXT token. StellarVPN uses Stellar and settles in USDC — stable, fast, and with fees 10,000x cheaper than Ethereum. Users never need to buy a proprietary token to use the network.

---

## Resources

- [Stellar Documentation](https://developers.stellar.org)
- [Soroban Smart Contract Docs](https://developers.stellar.org/docs/smart-contracts)
- [Stellar CLI Reference](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli)
- [Freighter Wallet](https://www.freighter.app)
- [Stellar Laboratory (Testnet)](https://laboratory.stellar.org)
- [Stellar Expert Explorer](https://stellar.expert)
- [Horizon API Reference](https://developers.stellar.org/api/horizon)
- [USDC on Stellar](https://www.circle.com/en/usdc-multichain/stellar)
- [Soroban SDK (Rust)](https://docs.rs/soroban-sdk)
- [WireGuard Quickstart](https://www.wireguard.com/quickstart/)
- [Friendbot (Testnet Faucet)](https://friendbot.stellar.org)

---

*Built on Stellar — payments in USDC, confirmed in 5 seconds, fees under a fraction of a cent.*
