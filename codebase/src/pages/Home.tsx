import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, Search } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea"
import speechService from '@/components/custom/TextToSpeech';

interface VoiceOption {
    gender: 'male' | 'female';
    index: number;
    name: string;
  }

const Homepage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [voices, setVoices] = useState<VoiceOption[]>([]);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            console.log('Searching for:', searchQuery);
            speechService.speak(`${searchQuery}`, {
                voiceName: 'Samantha'
            })
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    useEffect(() => {
        speechService.initialize().then(() => {
            const categories = speechService.getVoiceCategories();

            // Create voice options from categories
            const voiceOptions: VoiceOption[] = [];

            categories.male.forEach((name, index) => {
                voiceOptions.push({ gender: 'male', index, name });
            });

            categories.female.forEach((name, index) => {
                voiceOptions.push({ gender: 'female', index, name });
            });

            setVoices(voiceOptions);
        });
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            {/* Logo */}
            <div className="mb-8">
                <h1 className="text-3xl font-normal">
                    <span className='font-bold'>WWAN Protocol</span> -- Find your Agent
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

                {/* Search Buttons */}
                <div className="flex justify-center space-x-2 mt-6">
                    <Button
                        onClick={handleSearch}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2"
                        variant="outline"
                    >
                        Google Search
                    </Button>
                    <Button
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2"
                        variant="outline"
                    >
                        I'm Feeling Lucky
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Homepage;