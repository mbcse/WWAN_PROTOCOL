import axios from "axios";

const API_URL = "http://localhost:3006";
const EIGENLAYER_AVS_URL = "https://localhost:4003/task/";

interface UserAIAgent {
    publicKey: string;
    agent: string;
    message: string;
}

export const sendChatMessage = async (message: string) => {
    try {
        const response = await axios.post(`${API_URL}/chat`, {
            message,
        });
        return response.data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

export const parseMessage = async (message: string) => {
    try {
        const response = await axios.post(`${API_URL}/parse-message`, {
            message,
        });
        return response.data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

export const selectUserAIAgent = async (body: UserAIAgent) => {
    try {
        const response = await axios.post(`${EIGENLAYER_AVS_URL}/users/${body.publicKey}/agents/onchain`, {
            agentId: body.agent,
            allowance: body.message
        });
        return response.data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};