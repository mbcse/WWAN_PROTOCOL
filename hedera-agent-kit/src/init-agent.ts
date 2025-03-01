import HederaAgentKit from './agent';
import { createHederaTools } from './index';
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import axios from 'axios';

const EIGENLAYER_AVS_URL = "http://localhost:4003/task/";

interface AgentMetadata {
    name: string;
    description: string;
    publickey: string;
    skillList: string[];
    callEndpointUrl: string;
    costPerCall: string;
    imageUrl: string;
}

interface AgentType {
    address: string;
    isActive: boolean;
    reputation: number;
    registeredAt: number;
    metadata?: AgentMetadata;  // Optional since not all agents have metadata
}

interface AgentResponse {
    data: AgentType[];
    error: boolean;
    message: null | string;
}

let Agent: any, Config: any;

// Initialize agent
async function initializeAgent() {
    const llm = new ChatOpenAI({
        modelName: "gpt-4",
        temperature: 0.7,
    });

    const hederaKit = new HederaAgentKit(
        process.env.HEDERA_ACCOUNT_ID!,
        process.env.HEDERA_PRIVATE_KEY!,
        process.env.HEDERA_NETWORK as "mainnet" | "testnet" | "previewnet" || "testnet"
    );

    const tools = createHederaTools(hederaKit);
    const memory = new MemorySaver();
    const config = { configurable: { thread_id: "Hedera Agent Kit!" } };

    const agent = createReactAgent({
        llm,
        tools,
        checkpointSaver: memory,
        messageModifier: `
            You are a helpful agent that can interact on-chain using the Hedera Agent Kit. 
            You are empowered to interact on-chain using your tools. If you ever need funds,
            you can request them from a faucet or from the user. 
            Keep your responses concise and helpful.
        `,
    });

    return { agent, config };
};

// INITIALIZE THE AGENT !!!!
initializeAgent().then(({ agent, config }) => {
    Agent = agent;
    Config = config;
})

export const fetchMessages = async (message: string) => {
    try {
        const stream = await Agent.stream({ messages: [new HumanMessage(message)] }, Config);
        let response = [];
        for await (const chunk of stream) {
            if ("agent" in chunk) {
                response.push(chunk.agent.messages[0].content);
            } else if ("tools" in chunk) {
                response.push(chunk.tools.messages[0].content);
            }
        }
        return response;
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error:", error.message);
        }
        process.exit(1);
    }
};

export const fetchAgentListFromAvs = async () => {
    const url = `${EIGENLAYER_AVS_URL}/agents`;
    const agents = await axios.get(url);
    return agents.data as AgentResponse;
}

export const parseMessage = async (message: string) => {
    const llm = new ChatOpenAI({
        modelName: "gpt-4",
        temperature: 0.7,
        apiKey: process.env.OPENAI_API_KEY || "",
    });

    const agents: AgentResponse = await fetchAgentListFromAvs();

    const combined = agents.data.map((agent: AgentType) => `${agent.metadata?.name} (${agent.address}): ${agent.metadata?.description}`).join(", ");

    const systemMessage = `
    You are an analytical AI agent specialized in matching user queries to available AI agents.

    For each user message:
    
    1. Compare the user's query against the descriptions of all available agents in ${combined}
    2. Identify which agents can best address the user's needs based on description similarity
    3. Return a list of ids with matching agents as follows
    
    ["agent 1 address", "agent 2 address", "agent 3 address"]
    
    Only include agents that have a meaningful match to the query. Sort results by match confidence in descending order. If no suitable agents are found, return an empty matchingAgents array.
    If nothing matches or you dont have a good response then reply with []. there should be no other response.
    `;

    const response = await llm.invoke([
        new SystemMessage(systemMessage),
        new HumanMessage(message)
    ]);

    // Parse the response content to extract agent IDs
    let matchingAgentIds: string[];
    try {
        matchingAgentIds = JSON.parse(response.content as any);
    } catch (error) {
        console.error("Failed to parse LLM response:", error);
        return [];
    }

    // Filter agents to only include those that match the returned IDs
    const matchingAgents = agents.data.filter((agent: AgentType) =>
        matchingAgentIds.includes(agent.address)
    );

    // Return the filtered list of matching agents
    return matchingAgents;
};

export default initializeAgent;