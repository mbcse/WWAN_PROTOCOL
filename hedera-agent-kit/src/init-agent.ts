import HederaAgentKit from './agent';
import { createHederaTools } from './index';
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";

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

export default initializeAgent;