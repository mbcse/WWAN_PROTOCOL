import React, { useState, useEffect } from 'react';
import {
    MainContainer,
    ChatContainer,
    MessageList,
    Message,
    MessageInput,
    TypingIndicator,
    MessageModel,
    Avatar
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { Agent } from '@/types';
import { sendChatMessage } from '@/services/index';

interface MessageType {
    id: string;
    model: MessageModel;
    createdAt: Date;
    user: {
        name: string;
        avatarSrc: string;
    }
}

function ChatApp({ agent }: { agent: Agent }) {
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = () => {
        const storedMessages = localStorage.getItem('chatMessages');
        if (storedMessages) {
            setMessages(JSON.parse(storedMessages));
        } else {
            setMessages([{
                id: 'initial',
                createdAt: new Date(),
                model: {
                    message: 'Hello, how can I help you?',
                    sender: 'them',
                    direction: 'incoming',
                    position: 'single',
                    type: 'text',
                },
                user: {
                    name: 'Assistant',
                    avatarSrc: agent?.metadata?.imageUrl || '/agent1.png' // Use agent image if available
                }
            }]);
        }
    };

    const saveMessageLocally = (newMessages: MessageType[]) => {
        localStorage.setItem('chatMessages', JSON.stringify(newMessages));
    }


    const handleSend = async (messageText: string) => {
        // 1. Create and display user message immediately
        const userMessage: MessageType = {
            id: Date.now().toString(),
            createdAt: new Date(),
            model: {
                message: messageText,
                sender: 'me',
                direction: 'outgoing',
                position: 'single',
                type: 'text'
            },
            user: {
                name: 'You',
                avatarSrc: '/agent2.png'
            }
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        saveMessageLocally(newMessages);


        // 2. Call the API and handle the response
        try {
            setIsTyping(true); // Show typing indicator while waiting
            const response = await sendChatMessage(messageText);

            console.log(response);

            // 3. Create the AI agent's response message
            const aiMessage: MessageType = {
                id: Date.now().toString(), // Different ID for the AI message
                createdAt: new Date(),
                model: {
                    message: response.join('\n') || "Sorry, I didn't understand that.", // Use response from API
                    sender: 'them',
                    direction: 'incoming',
                    position: 'single',
                    type: 'text'
                },
                user: {
                    name: agent?.metadata?.name || 'AI Agent',
                    avatarSrc: agent?.metadata?.imageUrl || '/agent1.png'
                }
            };

            // 4. Update the messages state with the AI response
            const updatedMessages = [...newMessages, aiMessage];
            setMessages(updatedMessages);
            saveMessageLocally(updatedMessages);

        } catch (error) {
            console.error("Error sending message:", error);

            //Handle error scenario
            const errorMessage: MessageType = {
              id: Date.now().toString(), // Different ID for the AI message
              createdAt: new Date(),
              model: {
                  message: "Sorry, I encountered an error processing your request.",
                  sender: 'them',
                  direction: 'incoming',
                  position: 'single',
                  type: 'text'
              },
              user: {
                  name: agent?.metadata?.name || 'AI Agent',
                  avatarSrc: agent?.metadata?.imageUrl || '/agent1.png'
              }
          };

          const updatedMessages = [...newMessages, errorMessage];
          setMessages(updatedMessages);
          saveMessageLocally(updatedMessages);

        } finally {
            setIsTyping(false); // Hide typing indicator after response
        }
    };


    useEffect(() => {
        console.log(messages);
    }, [messages]);

    return (
        <div className='h-[500px] w-full flex flex-col'>
            {/* Header Section */}
            <div className="bg-gray-700 p-4 rounded-t-lg">
                <h2 className="text-lg font-semibold">Chat with AI Agent</h2>
                <p className="text-sm text-gray-300">Ask any questions you have.</p>
            </div>

            <MainContainer className='rounded-b-lg flex-grow'>
                <ChatContainer className='rounded-b-lg'>
                    <MessageList className='!bg-[#121212] rounded-b-lg pt-4'>
                        {messages.map((message, index) => (
                            <Message key={message.id} model={message.model}>
                                <Avatar src={message.user?.avatarSrc} name={message.user?.name} size="md" />
                            </Message>
                        ))}
                        {isTyping && <TypingIndicator content="Bot is typing" />}
                    </MessageList>
                    <MessageInput placeholder="Type message here" onSend={handleSend} />
                </ChatContainer>
            </MainContainer>
        </div>
    );
}

export default ChatApp;