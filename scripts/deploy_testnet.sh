#!/usr/bin/env bash
set -euo pipefail

# Deploy StellarVPN contracts to Stellar testnet.
#
# Prereqs:
#   - stellar-cli installed (https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
#   - A funded testnet identity, e.g.:
#       stellar keys generate --global stellarvpn-deployer --network testnet --fund
#   - Run from repo root: ./scripts/deploy_testnet.sh
#
# Outputs contract IDs to deployments/testnet.json

IDENTITY="${STELLAR_IDENTITY:-stellarvpn-deployer}"
NETWORK="testnet"
OUT_FILE="deployments/testnet.json"
MIN_STAKE="${MIN_STAKE:-1000000000}" # 100 XLM in stroops

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Building contracts (release, wasm32)"
cargo build --target wasm32-unknown-unknown --release

REGISTRY_WASM="target/wasm32-unknown-unknown/release/stellarvpn_registry.wasm"
PAYMENT_WASM="target/wasm32-unknown-unknown/release/stellarvpn_payment.wasm"

for f in "$REGISTRY_WASM" "$PAYMENT_WASM"; do
  if [[ ! -f "$f" ]]; then
    echo "ERROR: build artifact missing: $f" >&2
    exit 1
  fi
done

echo "==> Optimizing WASM"
stellar contract optimize --wasm "$REGISTRY_WASM"
stellar contract optimize --wasm "$PAYMENT_WASM"

REGISTRY_OPT="${REGISTRY_WASM%.wasm}.optimized.wasm"
PAYMENT_OPT="${PAYMENT_WASM%.wasm}.optimized.wasm"

ADMIN_ADDR="$(stellar keys address "$IDENTITY")"
echo "==> Deploying as $ADMIN_ADDR on $NETWORK"

echo "==> Deploying registry"
REGISTRY_ID="$(stellar contract deploy \
  --wasm "$REGISTRY_OPT" \
  --source "$IDENTITY" \
  --network "$NETWORK")"
echo "    registry: $REGISTRY_ID"

echo "==> Initializing registry (admin=$ADMIN_ADDR, min_stake=$MIN_STAKE)"
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source "$IDENTITY" \
  --network "$NETWORK" \
  -- initialize \
  --admin "$ADMIN_ADDR" \
  --min_stake "$MIN_STAKE"

# Native XLM Stellar Asset Contract on testnet
NATIVE_SAC="$(stellar contract id asset --asset native --network "$NETWORK")"

echo "==> Deploying payment"
PAYMENT_ID="$(stellar contract deploy \
  --wasm "$PAYMENT_OPT" \
  --source "$IDENTITY" \
  --network "$NETWORK")"
echo "    payment: $PAYMENT_ID"

echo "==> Initializing payment (admin=$ADMIN_ADDR, token=$NATIVE_SAC)"
stellar contract invoke \
  --id "$PAYMENT_ID" \
  --source "$IDENTITY" \
  --network "$NETWORK" \
  -- initialize \
  --admin "$ADMIN_ADDR" \
  --token "$NATIVE_SAC"

mkdir -p deployments
cat > "$OUT_FILE" <<EOF
{
  "network": "$NETWORK",
  "admin": "$ADMIN_ADDR",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "registry": "$REGISTRY_ID",
    "payment":  "$PAYMENT_ID"
  },
  "tokens": {
    "native_xlm_sac": "$NATIVE_SAC"
  },
  "min_stake_stroops": "$MIN_STAKE"
}
EOF

echo
echo "==> Done. Wrote $OUT_FILE:"
cat "$OUT_FILE"
echo
echo "Verify on stellar.expert:"
echo "  https://stellar.expert/explorer/testnet/contract/$REGISTRY_ID"
echo "  https://stellar.expert/explorer/testnet/contract/$PAYMENT_ID"
