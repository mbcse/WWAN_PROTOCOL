interface AgentMetadata {
    name: string;
    description: string;
    publickey: string;
    skillList: string[];
    callEndpointUrl: string;
    costPerCall: string;
    imageUrl: string;
}

export interface Agent {
    address: string;
    metadata: AgentMetadata;
    isActive: boolean;
    reputation: number;
    registeredAt: number;
}

export interface UserAIAgent {
    publicKey: string;
    agent: string;
    allowance: string;
}