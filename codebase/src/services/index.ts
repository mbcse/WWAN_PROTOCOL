import { Agent, UserAIAgent } from "@/types";
import axios from "axios";

const API_URL = "http://localhost:3006";
const EIGENLAYER_AVS_URL = "https://localhost:4003/task/";

// Function to Chat with the selected AI Agent
export const sendChatMessage = async (message: string, aiUrl = API_URL) => {
    try {
        const response = await axios.post(`${aiUrl}/chat`, {
            message,
        });
        return response.data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

// Parse the message and fetch all the agents that match the requirements
export const parseMessage = async (message: string) => {
    try {
        const response = await axios.post(`${API_URL}/parse-message`, {
            message,
        });
        const data = response.data as Agent[];

        data.forEach((agent) => {
            agent.metadata.imageUrl = `https://gateway.pinata.cloud/ipfs/${agent.metadata.imageUrl}`
        });

        return data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

export const selectUserAIAgent = async (body: UserAIAgent) => {
    try {
        const response = await axios.post(`${EIGENLAYER_AVS_URL}/users/${body.publicKey}/agents/onchain`, {
            agentId: body.agent,
            allowance: body.allowance
        });
        return response.data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};