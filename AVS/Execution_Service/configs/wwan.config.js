module.exports = {

    WWAN_ADDRESS: process.env.WWAN_ADDRESS || "0x63005f878bfB52dF7C4481C09f3e895d6fD5960D",
    WWAN_ABI: [
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "previousAdmin",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "newAdmin",
                    "type": "address"
                }
            ],
            "name": "AdminChanged",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "agentAddress",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "metadata",
                    "type": "string"
                }
            ],
            "name": "AgentRegistered",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "user",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "agent",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "allowance",
                    "type": "uint256"
                }
            ],
            "name": "AgentRegisteredForUser",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "beacon",
                    "type": "address"
                }
            ],
            "name": "BeaconUpgraded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "taskId",
                    "type": "uint256"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "requestingAgent",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "targetAgent",
                    "type": "address"
                }
            ],
            "name": "CollaborationRequested",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "uint8",
                    "name": "version",
                    "type": "uint8"
                }
            ],
            "name": "Initialized",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "taskId",
                    "type": "uint256"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "agent",
                    "type": "address"
                }
            ],
            "name": "TaskAssigned",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "taskId",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "bytes",
                    "name": "signature",
                    "type": "bytes"
                }
            ],
            "name": "TaskCompleted",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "taskId",
                    "type": "uint256"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "creator",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "bytes32",
                    "name": "taskType",
                    "type": "bytes32"
                }
            ],
            "name": "TaskCreated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "implementation",
                    "type": "address"
                }
            ],
            "name": "Upgraded",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "agents",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "agentAddress",
                    "type": "address"
                },
                {
                    "internalType": "string",
                    "name": "metadata",
                    "type": "string"
                },
                {
                    "internalType": "bool",
                    "name": "isActive",
                    "type": "bool"
                },
                {
                    "internalType": "uint256",
                    "name": "reputation",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_taskId",
                    "type": "uint256"
                }
            ],
            "name": "assignTask",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_taskId",
                    "type": "uint256"
                },
                {
                    "internalType": "bytes",
                    "name": "_signature",
                    "type": "bytes"
                }
            ],
            "name": "completeTask",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "_taskType",
                    "type": "bytes32"
                },
                {
                    "internalType": "string",
                    "name": "_taskData",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "_payment",
                    "type": "uint256"
                },
                {
                    "internalType": "address[]",
                    "name": "_collaboratingAgents",
                    "type": "address[]"
                }
            ],
            "name": "createTask",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_agentAddress",
                    "type": "address"
                },
                {
                    "internalType": "bytes32",
                    "name": "_taskType",
                    "type": "bytes32"
                },
                {
                    "internalType": "string",
                    "name": "_taskData",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "_payment",
                    "type": "uint256"
                }
            ],
            "name": "executeAgentTask",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_paymentToken",
                    "type": "address"
                }
            ],
            "name": "initialize",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "owner",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "paymentToken",
            "outputs": [
                {
                    "internalType": "contract IERC20Upgradeable",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "proxiableUUID",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_agentAddress",
                    "type": "address"
                },
                {
                    "internalType": "string",
                    "name": "_metadata",
                    "type": "string"
                }
            ],
            "name": "registerAgent",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_user",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_agentAddress",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_paymentAllowance",
                    "type": "uint256"
                }
            ],
            "name": "registerAgentForOtherUser",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_agentAddress",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_paymentAllowance",
                    "type": "uint256"
                }
            ],
            "name": "registerAgentForUser",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_taskId",
                    "type": "uint256"
                },
                {
                    "internalType": "address",
                    "name": "_collaboratorAgent",
                    "type": "address"
                }
            ],
            "name": "requestCollaboration",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "taskCounter",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "tasks",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "creator",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "assignedAgent",
                    "type": "address"
                },
                {
                    "internalType": "bytes32",
                    "name": "taskType",
                    "type": "bytes32"
                },
                {
                    "internalType": "string",
                    "name": "taskData",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "payment",
                    "type": "uint256"
                },
                {
                    "internalType": "enum WWANProtocol.TaskStatus",
                    "name": "status",
                    "type": "uint8"
                },
                {
                    "internalType": "bytes",
                    "name": "signature",
                    "type": "bytes"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "newImplementation",
                    "type": "address"
                }
            ],
            "name": "upgradeTo",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "newImplementation",
                    "type": "address"
                },
                {
                    "internalType": "bytes",
                    "name": "data",
                    "type": "bytes"
                }
            ],
            "name": "upgradeToAndCall",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        }
    ],
    PINATA_API_KEY: process.env.PINATA_API_KEY || "382227d41b04216217ee",
    PINATA_SECRET_API_KEY: process.env.PINATA_SECRET_API_KEY || "dc4b135521403e82d6179247b757025c158ee154c3dfe4baecfa11311956c9f3",
    IPFS_HOST: process.env.IPFS_HOST || "aqua-yodelling-mammal-447.mypinata.cloud",
    OTHENTIC_CLIENT_RPC_ADDRESS: process.env.OTHENTIC_CLIENT_RPC_ADDRESS || "https://rpc.avs.network",
    PRIVATE_KEY_PERFORMER: process.env.PRIVATE_KEY_PERFORMER,
    ATTESTATION_CENTER_ADDRESS: process.env.ATTESTATION_CENTER_ADDRESS || "0x0000000000771A79D0Fc7F3B7FE270eB4498F20b",
    ATTESTATION_CENTER_ABI: [],
    AVS_GOVERNANCE_ADDRESS: process.env.AVS_GOVERNANCE_ADDRESS || "0x0000000000771A79D0Fc7F3B7FE270eB4498F20b",
    RPC_URL: process.env.RPC_URL || "https://base-sepolia-rpc.publicnode.com",
    STORY_RPC_PROVIDER_URL: process.env.STORY_RPC_PROVIDER_URL || "https://aeneid.storyrpc.io",
    NFT_CONTRACT_ADDRESS: process.env.NFT_CONTRACT_ADDRESS || "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc",
    STORY_PROTOCOL_ADDRESS: process.env.STORY_PROTOCOL_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
}