#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

fn setup() -> (Env, PaymentClient<'static>, Address, Address, Address, TokenClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);

    let sac = env.register_stellar_asset_contract_v2(issuer.clone());
    let token_addr = sac.address();
    let token = TokenClient::new(&env, &token_addr);
    let token_admin = StellarAssetClient::new(&env, &token_addr);

    let contract_id = env.register(Payment, ());
    let client = PaymentClient::new(&env, &contract_id);
    client.initialize(&admin, &token_addr);

    let user = Address::generate(&env);
    let node = Address::generate(&env);
    token_admin.mint(&user, &1_000_0000000_i128);

    (env, client, user, node, contract_id, token)
}

#[test]
fn opens_session_and_locks_deposit() {
    let (_env, client, user, node, contract_id, token) = setup();
    client.open_session(&user, &node, &100_0000000_i128);

    assert_eq!(token.balance(&user), 900_0000000_i128);
    assert_eq!(token.balance(&contract_id), 100_0000000_i128);

    let s = client.get_session(&user, &node);
    assert_eq!(s.deposited, 100_0000000_i128);
    assert_eq!(s.consumed, 0);
    assert!(!s.closed);
}

#[test]
fn rejects_zero_deposit() {
    let (_env, client, user, node, _c, _t) = setup();
    let res = client.try_open_session(&user, &node, &0_i128);
    assert_eq!(res, Err(Ok(Error::InvalidAmount)));
}

#[test]
fn rejects_duplicate_session() {
    let (_env, client, user, node, _c, _t) = setup();
    client.open_session(&user, &node, &50_0000000_i128);
    let res = client.try_open_session(&user, &node, &50_0000000_i128);
    assert_eq!(res, Err(Ok(Error::SessionAlreadyExists)));
}

#[test]
fn settle_transfers_to_node() {
    let (_env, client, user, node, _c, token) = setup();
    client.open_session(&user, &node, &100_0000000_i128);
    client.settle(&user, &node, &30_0000000_i128);

    assert_eq!(token.balance(&node), 30_0000000_i128);
    let s = client.get_session(&user, &node);
    assert_eq!(s.consumed, 30_0000000_i128);
}

#[test]
fn settle_rejects_overdraft() {
    let (_env, client, user, node, _c, _t) = setup();
    client.open_session(&user, &node, &10_0000000_i128);
    let res = client.try_settle(&user, &node, &20_0000000_i128);
    assert_eq!(res, Err(Ok(Error::InsufficientBalance)));
}

#[test]
fn close_refunds_unused() {
    let (_env, client, user, node, _c, token) = setup();
    client.open_session(&user, &node, &100_0000000_i128);
    client.settle(&user, &node, &25_0000000_i128);
    let refund = client.close_session(&user, &node);

    assert_eq!(refund, 75_0000000_i128);
    assert_eq!(token.balance(&user), 975_0000000_i128);
    assert_eq!(token.balance(&node), 25_0000000_i128);
}

#[test]
fn cannot_settle_after_close() {
    let (_env, client, user, node, _c, _t) = setup();
    client.open_session(&user, &node, &100_0000000_i128);
    client.close_session(&user, &node);
    let res = client.try_settle(&user, &node, &1_0000000_i128);
    assert_eq!(res, Err(Ok(Error::SessionClosed)));
}
