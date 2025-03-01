import HederaAgentKit from './agent';
import { createHederaTools } from './index';
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import axios from 'axios';
import { Agent } from './types/agents';

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
    const url = "https://localhost:5000/v1/agents";
    const agents = await axios.get(url);
    return agents.data as Agent[];
}

export const parseMessage = async (message: string) => {
    const llm = new ChatOpenAI({
        modelName: "gpt-4",
        temperature: 0.7,
        apiKey: process.env.OPENAI_API_KEY || "",
    });

    const agents = await fetchAgentListFromAvs();

    const combined = agents.map(agent => `${agent.name} (${agent.id}): ${agent.description}`).join(", ");

    const systemMessage = `
    You are an analytical AI agent specialized in matching user queries to available AI agents.

    For each user message:
    
    1. Compare the user's query against the descriptions of all available agents in ${combined}
    2. Identify which agents can best address the user's needs based on description similarity
    3. Return a list of ids with matching agents as follows
    
    ["agent_id1", "agent_id2", "agent_id3"]
    
    Only include agents that have a meaningful match to the query. Sort results by match confidence in descending order. If no suitable agents are found, return an empty matchingAgents array and suggest alternatives in the recommendedAction field.
    `;

    const response = await llm.invoke([
        new SystemMessage(systemMessage),
        new HumanMessage(message)
    ]);

    // Parse the response content to extract agent IDs
    let matchingAgentIds: string[];
    try {
        matchingAgentIds = JSON.parse(response as any);
    } catch (error) {
        console.error("Failed to parse LLM response:", error);
        return [];
    }

    // Filter agents to only include those that match the returned IDs
    const matchingAgents = agents.filter(agent => 
        matchingAgentIds.includes(agent.id)
    );

    // Return the filtered list of matching agents
    return matchingAgents;
};

export default initializeAgent;