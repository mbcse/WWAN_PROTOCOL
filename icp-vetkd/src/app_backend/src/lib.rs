use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
    TransformContext,
};
use ic_cdk_macros::{self, query, update};
use serde::{Deserialize, Serialize};
use serde_json::{self, Value};
use std::str::FromStr;
use types::{
    CanisterId, VetKDCurve, VetKDEncryptedKeyReply, VetKDEncryptedKeyRequest, VetKDKeyId,
    VetKDPublicKeyReply, VetKDPublicKeyRequest,
};

mod types;

const VETKD_SYSTEM_API_CANISTER_ID: &str = "s55qq-oqaaa-aaaaa-aaakq-cai";

#[derive(Serialize, Deserialize)]
struct Context {
    bucket_start_time_index: usize,
    closing_price_index: usize,
}

#[update]
async fn store_and_send_private_key(encryption_public_key: Vec<u8>) -> String {
    let encrypted_key_result =
        encrypted_ibe_decryption_key_for_caller(encryption_public_key).await;

    match encrypted_key_result {
        Ok(encrypted_key_hex) => {
            let json_string = format!(
                r#"{{"encrypted_private_key": "{}"}}"#,
                encrypted_key_hex
            );

            let result = send_http_post_request(json_string).await;
            result
        }
        Err(e) => format!("Error retrieving encrypted key: {}", e),
    }
}

async fn send_http_post_request(json_string: String) -> String {
    let url = "http://localhost:3000/api/keys";

    let request_headers = vec![
        HttpHeader {
            name: "User-Agent".to_string(),
            value: "demo_HTTP_POST_canister".to_string(),
        },
        HttpHeader {
            name: "Idempotency-Key".to_string(),
            value: "UUID-678028328".to_string(),
        },
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
    ];

    let json_utf8: Vec<u8> = json_string.into_bytes();
    let request_body: Option<Vec<u8>> = Some(json_utf8);

    let context = Context {
        bucket_start_time_index: 0,
        closing_price_index: 4,
    };

    let request = CanisterHttpRequestArgument {
        url: url.to_string(),
        max_response_bytes: None,
        method: HttpMethod::POST,
        headers: request_headers,
        body: request_body,
        transform: Some(TransformContext::new(transform, serde_json::to_vec(&context).unwrap())),
    };

    match http_request(request).await {
        Ok((response,)) => {
            let str_body = String::from_utf8(response.body)
                .expect("Transformed response is not UTF-8 encoded.");
            ic_cdk::api::print(format!("{:?}", str_body));

            let result: String = format!(
                "{}. Request sent to: {}",
                str_body, url
            );
            result
        }
        Err((r, m)) => {
            let message =
                format!("The http_request resulted into error. RejectionCode: {r:?}, Error: {m}");
            message
        }
    }
}

#[query]
fn transform(raw: TransformArgs) -> HttpResponse {
    let headers = vec![
        HttpHeader {
            name: "Content-Security-Policy".to_string(),
            value: "default-src 'self'".to_string(),
        },
        HttpHeader {
            name: "Referrer-Policy".to_string(),
            value: "strict-origin".to_string(),
        },
        HttpHeader {
            name: "Permissions-Policy".to_string(),
            value: "geolocation=(self)".to_string(),
        },
        HttpHeader {
            name: "Strict-Transport-Security".to_string(),
            value: "max-age=63072000".to_string(),
        },
        HttpHeader {
            name: "X-Frame-Options".to_string(),
            value: "DENY".to_string(),
        },
        HttpHeader {
            name: "X-Content-Type-Options".to_string(),
            value: "nosniff".to_string(),
        },
    ];

    let mut res = HttpResponse {
        status: raw.response.status.clone(),
        body: raw.response.body.clone(),
        headers,
        ..Default::default()
    };

    if res.status == 200 {
        res.body = raw.response.body;
    } else {
        ic_cdk::api::print(format!(
            "Received an error from external API: err = {:?}",
            raw
        ));
    }
    res
}

async fn encrypted_ibe_decryption_key_for_caller(
    encryption_public_key: Vec<u8>,
) -> Result<String, String> {
    debug_println_caller("encrypted_ibe_decryption_key_for_caller");

    let request = VetKDEncryptedKeyRequest {
        derivation_id: ic_cdk::caller().as_slice().to_vec(),
        derivation_path: vec![b"ibe_encryption".to_vec()],
        key_id: bls12_381_g2_test_key_1(),
        encryption_public_key,
    };

    let call_result: Result<(VetKDEncryptedKeyReply,), _> = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_derive_encrypted_key",
        (request,),
    )
    .await;

    match call_result {
        Ok((response,)) => Ok(hex::encode(response.encrypted_key)),
        Err((reject_code, message)) => {
            Err(format!("Call failed with reject code: {:?}, message: {}", reject_code, message))
        }
    }
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

mod types {
    use candid::{CandidType, Deserialize};

    #[derive(CandidType, Deserialize, Clone, Debug)]
    pub struct CanisterId(pub candid::Principal);

    impl FromStr for CanisterId {
        type Err = String;

        fn from_str(s: &str) -> Result<Self, Self::Err> {
            candid::Principal::from_text(s)
                .map(CanisterId)
                .map_err(|e| format!("Invalid principal: {}", e))
        }
    }

    impl From<CanisterId> for candid::Principal {
        fn from(canister_id: CanisterId) -> Self {
            canister_id.0
        }
    }

    #[derive(CandidType, Deserialize, Debug, Clone)]
    pub struct VetKDKeyId {
        pub curve: VetKDCurve,
        pub name: String,
    }

    #[derive(CandidType, Deserialize, Debug, Clone)]
    pub enum VetKDCurve {
        Bls12_381_G1,
        Bls12_381_G2,
    }

    #[derive(CandidType, Deserialize, Debug, Clone)]
    pub struct VetKDPublicKeyRequest {
        pub canister_id: Option<CanisterId>,
        pub derivation_path: Vec<Vec<u8>>,
        pub key_id: VetKDKeyId,
    }

    #[derive(CandidType, Deserialize, Debug, Clone)]
    pub struct VetKDPublicKeyReply {
        pub public_key: Vec<u8>,
    }

    #[derive(CandidType, Deserialize, Debug, Clone)]
    pub struct VetKDEncryptedKeyRequest {
        pub derivation_id: Vec<u8>,
        pub derivation_path: Vec<Vec<u8>>,
        pub key_id: VetKDKeyId,
        pub encryption_public_key: Vec<u8>,
    }

    #[derive(CandidType, Deserialize, Debug, Clone)]
    pub struct VetKDEncryptedKeyReply {
        pub encrypted_key: Vec<u8>,
    }
}