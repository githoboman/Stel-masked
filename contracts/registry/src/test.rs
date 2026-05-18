#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, BytesN, Env, String};

fn setup() -> (Env, RegistryClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, Registry);
    let client = RegistryClient::new(&env, &contract_id);
    client.initialize(&admin, &100_0000000_i128);
    (env, client, admin)
}

#[test]
fn registers_node_when_stake_sufficient() {
    let (env, client, _admin) = setup();
    let op = Address::generate(&env);
    let endpoint = String::from_str(&env, "wg://1.2.3.4:51820");
    let pk = BytesN::from_array(&env, &[7u8; 32]);

    client.register_node(&op, &endpoint, &pk, &100_0000000_i128);

    let node = client.get_node(&op);
    assert_eq!(node.operator, op);
    assert_eq!(node.stake, 100_0000000_i128);
    assert!(node.active);
    assert!(client.is_active(&op));
}

#[test]
fn rejects_insufficient_stake() {
    let (env, client, _admin) = setup();
    let op = Address::generate(&env);
    let endpoint = String::from_str(&env, "wg://1.2.3.4:51820");
    let pk = BytesN::from_array(&env, &[1u8; 32]);

    let res = client.try_register_node(&op, &endpoint, &pk, &10_0000000_i128);
    assert_eq!(res, Err(Ok(Error::InsufficientStake)));
}

#[test]
fn rejects_duplicate_registration() {
    let (env, client, _admin) = setup();
    let op = Address::generate(&env);
    let endpoint = String::from_str(&env, "wg://1.2.3.4:51820");
    let pk = BytesN::from_array(&env, &[2u8; 32]);

    client.register_node(&op, &endpoint, &pk, &100_0000000_i128);
    let res = client.try_register_node(&op, &endpoint, &pk, &100_0000000_i128);
    assert_eq!(res, Err(Ok(Error::NodeAlreadyRegistered)));
}

#[test]
fn rejects_empty_endpoint() {
    let (env, client, _admin) = setup();
    let op = Address::generate(&env);
    let endpoint = String::from_str(&env, "");
    let pk = BytesN::from_array(&env, &[3u8; 32]);

    let res = client.try_register_node(&op, &endpoint, &pk, &100_0000000_i128);
    assert_eq!(res, Err(Ok(Error::InvalidEndpoint)));
}

#[test]
fn deregisters_and_returns_stake() {
    let (env, client, _admin) = setup();
    let op = Address::generate(&env);
    let endpoint = String::from_str(&env, "wg://1.2.3.4:51820");
    let pk = BytesN::from_array(&env, &[4u8; 32]);

    client.register_node(&op, &endpoint, &pk, &100_0000000_i128);
    let returned = client.deregister_node(&op);
    assert_eq!(returned, 100_0000000_i128);
    assert!(!client.is_active(&op));
}

#[test]
fn double_initialize_fails() {
    let (_env, client, admin) = setup();
    let res = client.try_initialize(&admin, &50_0000000_i128);
    assert_eq!(res, Err(Ok(Error::AlreadyInitialized)));
}
