/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, Search } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea"
import AgentSelector from '@/components/custom/Carousel';
import { parseMessage } from '@/services/index';
import { Agent } from '@/types';
import ChatUI from '@/components/custom/ChatUI';

const Homepage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showAgents, setShowAgents] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent>();
    const [depositMade, setDepositMade] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const handleSearch = async () => {
        if (searchQuery.trim()) {
            console.log('Searching for:', searchQuery);
            setShowAgents(true);
            const data = await parseMessage(searchQuery);
            setAgents(data);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    useEffect(() => {
        if (depositMade) {
            setShowChat(true);
        }
    }, [depositMade]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#1E1E1E] text-white">
            {/* Logo */}
            {/* <img src="/wwan_header.png" alt="WWAN Logo" className="absolute top-0 left-0 opacity-80 h-screen z-0" /> */}
            <div className="mb-8">
                <h1 className="text-center">
                    <span className="text-3xl font-bold">WWAN Protocol: The OnChain Agent Network</span>
                    <span className="block text-xl mt-2">Discover and Communicate with Agents Directly On-Chain</span>
                    <span className="block text-sm mt-1 text-gray-600">Evolving from WWW to WWAN</span>
                </h1>
            </div>

            {/* Search Container */}
            <div className="w-full max-w-5xl px-4">
                <div className="relative">
                    {/* Search Input */}
                    <div className="flex items-center gap-2 w-full mb-6 focus-within:shadow-md transition-shadow px-5 py-3">
                        <Search className="h-5 w-5 text-gray-400 mr-3" />
                        <Textarea
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full outline-none bg-transparent"
                            placeholder="Search for your AI agent here..."
                        />
                        {/* Up Arrow Button */}
                        <Button
                            onClick={handleSearch}
                            className="bottom-3 rounded-full p-2 bg-gray-500 hover:bg-blue-600"
                            size="sm"
                        >
                            <ArrowUp className="h-4 w-4 text-white" />
                        </Button>
                    </div>
                </div>

                {showAgents && <AgentSelector setSelectedAgent={setSelectedAgent} setDepositMade={setDepositMade} agents={agents} setShowAgents={setShowAgents} />}

                {/* Search Buttons */}
                <div className="flex justify-center space-x-2 mt-6">
                    <Button
                        onClick={handleSearch}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2"
                        variant="outline"
                    >
                        Search
                    </Button>
                </div>
            </div>

            <div className='w-full px-10 mt-10'>
                {showChat && <ChatUI agent={agents[0]} />}
            </div>

        </div>
    );
};

export default Homepage;