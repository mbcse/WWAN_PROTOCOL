import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { parseMessage } from './init-agent';
import { fetchMessages } from './init-agent';

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Hedera Agent Kit API is running' });
});

// Chat route
app.post('/chat', async (req: any, res: any) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const response = await fetchMessages(message);

        res.json({ response });
    } catch (error) {
        console.error('Error processing chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/parse-message', async (req: any, res: any) => {
    console.log(req.body.message);
    const agents = await parseMessage(req.body.message);
    res.json(agents);
});

// Define port
const PORT = process.env.PORT || 3006;

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});