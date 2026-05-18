#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracterror, contracttype,
    symbol_short, token, Address, Env,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    SessionNotFound = 3,
    SessionAlreadyExists = 4,
    InvalidAmount = 5,
    InsufficientBalance = 6,
    Unauthorized = 7,
    SessionClosed = 8,
}

#[contracttype]
#[derive(Clone)]
pub struct Session {
    pub client: Address,
    pub node: Address,
    pub deposited: i128,
    pub consumed: i128,
    pub opened_at: u64,
    pub closed: bool,
}

#[contracttype]
pub enum DataKey {
    Token,
    Admin,
    Session(Address, Address),
}

#[contract]
pub struct Payment;

#[contractimpl]
impl Payment {
    pub fn initialize(env: Env, admin: Address, token: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        Ok(())
    }

    pub fn open_session(
        env: Env,
        client: Address,
        node: Address,
        deposit: i128,
    ) -> Result<(), Error> {
        client.require_auth();
        if deposit <= 0 {
            return Err(Error::InvalidAmount);
        }
        let key = DataKey::Session(client.clone(), node.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::SessionAlreadyExists);
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;
        let token = token::Client::new(&env, &token_addr);
        token.transfer(&client, &env.current_contract_address(), &deposit);

        let session = Session {
            client: client.clone(),
            node: node.clone(),
            deposited: deposit,
            consumed: 0,
            opened_at: env.ledger().timestamp(),
            closed: false,
        };
        env.storage().persistent().set(&key, &session);

        env.events().publish(
            (symbol_short!("opened"), client, node),
            deposit,
        );
        Ok(())
    }

    pub fn settle(
        env: Env,
        client: Address,
        node: Address,
        amount: i128,
    ) -> Result<(), Error> {
        client.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let key = DataKey::Session(client.clone(), node.clone());
        let mut session: Session = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::SessionNotFound)?;
        if session.closed {
            return Err(Error::SessionClosed);
        }
        if session.consumed + amount > session.deposited {
            return Err(Error::InsufficientBalance);
        }

        session.consumed += amount;
        env.storage().persistent().set(&key, &session);

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;
        let token = token::Client::new(&env, &token_addr);
        token.transfer(&env.current_contract_address(), &node, &amount);

        env.events().publish(
            (symbol_short!("settled"), client, node),
            amount,
        );
        Ok(())
    }

    pub fn close_session(
        env: Env,
        client: Address,
        node: Address,
    ) -> Result<i128, Error> {
        client.require_auth();
        let key = DataKey::Session(client.clone(), node.clone());
        let mut session: Session = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::SessionNotFound)?;
        if session.closed {
            return Err(Error::SessionClosed);
        }

        let refund = session.deposited - session.consumed;
        session.closed = true;
        env.storage().persistent().set(&key, &session);

        if refund > 0 {
            let token_addr: Address = env
                .storage()
                .instance()
                .get(&DataKey::Token)
                .ok_or(Error::NotInitialized)?;
            let token = token::Client::new(&env, &token_addr);
            token.transfer(&env.current_contract_address(), &client, &refund);
        }

        env.events().publish(
            (symbol_short!("closed"), client, node),
            refund,
        );
        Ok(refund)
    }

    pub fn get_session(env: Env, client: Address, node: Address) -> Result<Session, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Session(client, node))
            .ok_or(Error::SessionNotFound)
    }
}

#[cfg(test)]
mod test;
