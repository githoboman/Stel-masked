#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracterror, contracttype,
    symbol_short, Address, BytesN, Env, String,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NodeNotFound = 3,
    NodeAlreadyRegistered = 4,
    InsufficientStake = 5,
    Unauthorized = 6,
    InvalidEndpoint = 7,
}

#[contracttype]
#[derive(Clone)]
pub struct Node {
    pub operator: Address,
    pub endpoint: String,
    pub pubkey: BytesN<32>,
    pub stake: i128,
    pub registered_at: u64,
    pub active: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    MinStake,
    Node(Address),
}

#[contract]
pub struct Registry;

#[contractimpl]
impl Registry {
    pub fn initialize(env: Env, admin: Address, min_stake: i128) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::MinStake, &min_stake);
        Ok(())
    }

    pub fn register_node(
        env: Env,
        operator: Address,
        endpoint: String,
        pubkey: BytesN<32>,
        stake: i128,
    ) -> Result<(), Error> {
        operator.require_auth();

        let min_stake: i128 = env
            .storage()
            .instance()
            .get(&DataKey::MinStake)
            .ok_or(Error::NotInitialized)?;

        if stake < min_stake {
            return Err(Error::InsufficientStake);
        }

        if endpoint.len() == 0 {
            return Err(Error::InvalidEndpoint);
        }

        let key = DataKey::Node(operator.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::NodeAlreadyRegistered);
        }

        let node = Node {
            operator: operator.clone(),
            endpoint: endpoint.clone(),
            pubkey,
            stake,
            registered_at: env.ledger().timestamp(),
            active: true,
        };

        env.storage().persistent().set(&key, &node);

        env.events().publish(
            (symbol_short!("registd"), operator),
            (endpoint, stake),
        );
        Ok(())
    }

    pub fn deregister_node(env: Env, operator: Address) -> Result<i128, Error> {
        operator.require_auth();
        let key = DataKey::Node(operator.clone());
        let node: Node = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NodeNotFound)?;

        env.storage().persistent().remove(&key);

        env.events().publish(
            (symbol_short!("deregd"), operator),
            node.stake,
        );
        Ok(node.stake)
    }

    pub fn get_node(env: Env, operator: Address) -> Result<Node, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Node(operator))
            .ok_or(Error::NodeNotFound)
    }

    pub fn is_active(env: Env, operator: Address) -> bool {
        env.storage()
            .persistent()
            .get::<DataKey, Node>(&DataKey::Node(operator))
            .map(|n| n.active)
            .unwrap_or(false)
    }

    pub fn min_stake(env: Env) -> Result<i128, Error> {
        env.storage()
            .instance()
            .get(&DataKey::MinStake)
            .ok_or(Error::NotInitialized)
    }
}

#[cfg(test)]
mod test;
