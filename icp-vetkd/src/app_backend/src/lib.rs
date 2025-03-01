use ic_cdk::{update, query};
use std::str::FromStr;
use std::collections::HashMap;
use std::cell::RefCell;
use ic_cdk::export::candid::{CandidType, Deserialize};
use types::{
    CanisterId, VetKDCurve, VetKDEncryptedKeyReply, VetKDEncryptedKeyRequest, VetKDKeyId,
    VetKDPublicKeyReply, VetKDPublicKeyRequest, AgentSecret, SecretType,
};

mod types;

const VETKD_SYSTEM_API_CANISTER_ID: &str = "s55qq-oqaaa-aaaaa-aaakq-cai";

// Store agent secrets in stable memory using RefCell
thread_local! {
    static AGENT_SECRETS: RefCell<HashMap<String, Vec<AgentSecret>>> = RefCell::new(HashMap::new());
}

#[ic_cdk::pre_upgrade]
fn pre_upgrade() {
    let secrets = AGENT_SECRETS.with(|secrets| secrets.borrow().clone());
    ic_cdk::storage::stable_save((secrets,)).expect("Failed to save state");
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    let (secrets,): (HashMap<String, Vec<AgentSecret>>,) = ic_cdk::storage::stable_restore().expect("Failed to restore state");
    AGENT_SECRETS.with(|state| *state.borrow_mut() = secrets);
}

#[update]
async fn symmetric_key_verification_key() -> String {
    let request = VetKDPublicKeyRequest {
        canister_id: None,
        derivation_path: vec![b"symmetric_key".to_vec()],
        key_id: bls12_381_g2_test_key_1(),
    };

    let (response,): (VetKDPublicKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_public_key",
        (request,),
    )
    .await
    .expect("call to vetkd_public_key failed");

    hex::encode(response.public_key)
}

#[update]
async fn encrypted_symmetric_key_for_caller(encryption_public_key: Vec<u8>) -> String {
    debug_println_caller("encrypted_symmetric_key_for_caller");

    let request = VetKDEncryptedKeyRequest {
        derivation_id: ic_cdk::caller().as_slice().to_vec(),
        derivation_path: vec![b"symmetric_key".to_vec()],
        key_id: bls12_381_g2_test_key_1(),
        encryption_public_key,
    };

    let (response,): (VetKDEncryptedKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_derive_encrypted_key",
        (request,),
    )
    .await
    .expect("call to vetkd_derive_encrypted_key failed");

    hex::encode(response.encrypted_key)
}

// New function to store an agent secret
#[update]
async fn store_agent_secret(secret_type: SecretType, encrypted_data: Vec<u8>, encryption_public_key: Vec<u8>) -> bool {
    let caller = ic_cdk::caller();
    let caller_id = caller.to_text();
    
    // Get a derived key specific to this agent for this secret type
    let derivation_path = match secret_type {
        SecretType::ApiKey => vec![b"agent_api_key".to_vec()],
        SecretType::PrivateKey => vec![b"agent_private_key".to_vec()],
        SecretType::PaymentInfo => vec![b"agent_payment_info".to_vec()],
    };
    
    let request = VetKDEncryptedKeyRequest {
        derivation_id: caller.as_slice().to_vec(),
        derivation_path,
        key_id: bls12_381_g2_test_key_1(),
        encryption_public_key: encryption_public_key.clone(),
    };

    let (response,): (VetKDEncryptedKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_derive_encrypted_key",
        (request,),
    )
    .await
    .expect("call to vetkd_derive_encrypted_key failed");
    
    // Create a new agent secret
    let agent_secret = AgentSecret {
        secret_type: secret_type.clone(),
        encrypted_data,
        encryption_key: hex::encode(response.encrypted_key),
        created_at: ic_cdk::api::time(),
    };
    
    // Store the secret
    AGENT_SECRETS.with(|storage| {
        let mut secrets = storage.borrow_mut();
        let agent_secrets = secrets.entry(caller_id).or_insert_with(Vec::new);
        
        // Remove any existing secret of the same type
        agent_secrets.retain(|s| s.secret_type != secret_type);
        
        // Add the new secret
        agent_secrets.push(agent_secret);
    });
    
    true
}

// Retrieve all secrets for the calling agent
#[query]
fn get_agent_secrets() -> Vec<AgentSecret> {
    let caller_id = ic_cdk::caller().to_text();
    
    AGENT_SECRETS.with(|storage| {
        let secrets = storage.borrow();
        secrets.get(&caller_id).cloned().unwrap_or_default()
    })
}

// Get a specific secret by type
#[query]
fn get_agent_secret_by_type(secret_type: SecretType) -> Option<AgentSecret> {
    let caller_id = ic_cdk::caller().to_text();
    
    AGENT_SECRETS.with(|storage| {
        let secrets = storage.borrow();
        if let Some(agent_secrets) = secrets.get(&caller_id) {
            agent_secrets.iter()
                .find(|s| s.secret_type == secret_type)
                .cloned()
        } else {
            None
        }
    })
}

// Delete a specific secret by type
#[update]
fn delete_agent_secret(secret_type: SecretType) -> bool {
    let caller_id = ic_cdk::caller().to_text();
    
    AGENT_SECRETS.with(|storage| {
        let mut secrets = storage.borrow_mut();
        if let Some(agent_secrets) = secrets.get_mut(&caller_id) {
            let initial_len = agent_secrets.len();
            agent_secrets.retain(|s| s.secret_type != secret_type);
            initial_len > agent_secrets.len()
        } else {
            false
        }
    })
}

// Get encryption key for a specific purpose
#[update]
async fn get_purpose_specific_key(purpose: String, encryption_public_key: Vec<u8>) -> String {
    debug_println_caller(&format!("get_purpose_specific_key for {}", purpose));

    let request = VetKDEncryptedKeyRequest {
        derivation_id: ic_cdk::caller().as_slice().to_vec(),
        derivation_path: vec![purpose.as_bytes().to_vec()],
        key_id: bls12_381_g2_test_key_1(),
        encryption_public_key,
    };

    let (response,): (VetKDEncryptedKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_derive_encrypted_key",
        (request,),
    )
    .await
    .expect("call to vetkd_derive_encrypted_key failed");

    hex::encode(response.encrypted_key)
}

fn bls12_381_g2_test_key_1() -> VetKDKeyId {
    VetKDKeyId {
        curve: VetKDCurve::Bls12_381_G2,
        name: "test_key_1".to_string(),
    }
}

fn vetkd_system_api_canister_id() -> CanisterId {
    CanisterId::from_str(VETKD_SYSTEM_API_CANISTER_ID).expect("failed to create canister ID")
}

fn debug_println_caller(method_name: &str) {
    ic_cdk::println!(
        "{}: caller: {} (isAnonymous: {})",
        method_name,
        ic_cdk::caller().to_text(),
        ic_cdk::caller() == candid::Principal::anonymous()
    );
}
