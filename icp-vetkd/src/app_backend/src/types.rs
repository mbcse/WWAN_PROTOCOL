use ic_cdk::export::candid::{CandidType, Deserialize};
use ic_cdk::export::Principal;

pub type CanisterId = Principal;

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq)]
pub enum SecretType {
    #[serde(rename = "api_key")]
    ApiKey,
    #[serde(rename = "private_key")]
    PrivateKey,
    #[serde(rename = "payment_info")]
    PaymentInfo,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct AgentSecret {
    pub secret_type: SecretType,
    pub encrypted_data: Vec<u8>,
    pub encryption_key: String,
    pub created_at: u64,
}

#[derive(CandidType, Deserialize)]
pub enum VetKDCurve {
    #[serde(rename = "bls12_381_g2")]
    #[allow(non_camel_case_types)]
    Bls12_381_G2,
}

#[derive(CandidType, Deserialize)]
pub struct VetKDKeyId {
    pub curve: VetKDCurve,
    pub name: String,
}

#[derive(CandidType, Deserialize)]
pub struct VetKDPublicKeyRequest {
    pub canister_id: Option<CanisterId>,
    pub derivation_path: Vec<Vec<u8>>,
    pub key_id: VetKDKeyId,
}

#[derive(CandidType, Deserialize)]
pub struct VetKDPublicKeyReply {
    pub public_key: Vec<u8>,
}

#[derive(CandidType, Deserialize)]
pub struct VetKDEncryptedKeyRequest {
    pub derivation_path: Vec<Vec<u8>>,
    pub derivation_id: Vec<u8>,
    pub key_id: VetKDKeyId,
    pub encryption_public_key: Vec<u8>,
}

#[derive(CandidType, Deserialize)]
pub struct VetKDEncryptedKeyReply {
    pub encrypted_key: Vec<u8>,
}
