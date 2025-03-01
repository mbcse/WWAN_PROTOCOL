/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Check, X, Volume2 } from 'lucide-react';

// Import shadcn components
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import speechService from '@/components/custom/TextToSpeech';

// Define types
interface CardType {
  id: number;
  name: string;
  description: string;
  skills: string[];
  cost: string;
  image: string;
  voiceName?: string;
}

interface CardSelectorProps {
  onSelect?: (selectedCards: CardType[]) => void;
  onCancel?: () => void;
  setShowAgents: (show: boolean) => void;
}

interface VoiceOption {
  gender: 'male' | 'female';
  index: number;
  name: string;
}

// Sample card data
const cards: CardType[] = [
  {
    id: 1,
    name: "TradeMax",
    description: "Advanced trading AI specialized in multi-chain cryptocurrency exchanges. Optimizes trade routes and timing for maximum returns.",
    skills: ["Cross-chain Trading", "Price Analysis", "Risk Management", "MEV Protection"],
    cost: "$0.05/trade",
    voiceName: "Samantha",
    image: "/agent1.png"
  },
  {
    id: 2,
    name: "SocialSense",
    description: "AI community manager that monitors social sentiment, engages with users, and provides real-time market insights from social media trends.",
    skills: ["Sentiment Analysis", "Community Management", "Trend Detection", "Crisis Management"],
    cost: "$0.02/interaction",
    voiceName: "Aaron",
    image: "/agent2.png"
  },
  {
    id: 3,
    name: "SwapSage",
    description: "Specialized in finding the most efficient token swap routes across DEXs. Monitors gas fees and slippage to ensure optimal exchanges.",
    skills: ["DEX Aggregation", "Gas Optimization", "Slippage Control", "Route Finding"],
    cost: "$0.03/swap",
    voiceName: "Maria",
    image: "/agent3.png"
  }
];

const AgentSelector: React.FC<CardSelectorProps> = ({ onSelect, onCancel, setShowAgents }) => {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [api, setApi] = useState<CarouselApi>()

  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);

  const toggleCardSelection = (id: number): void => {
    setSelectedCardIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(cardId => cardId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const isCardSelected = (id: number): boolean => {
    return selectedCardIds.includes(id);
  };

  const getSelectedCards = (): CardType[] => {
    return cards.filter(card => selectedCardIds.includes(card.id));
  };

  const removeSelectedCard = (id: number): void => {
    setSelectedCardIds(prev => prev.filter(cardId => cardId !== id));
  };

  const handleConfirmSelection = (): void => {
    setShowAgents(false);
    if (onSelect && selectedCardIds.length > 0) {
      onSelect(getSelectedCards());
      // const provider = await wallets[0].getEthereumProvider();
      // const { approveWWAN } = await getContractFunctions(provider);
      // const tx = await approveWWAN(1000000000000000000);
      // toast(`Agent Registered successfully!! Transaction hash: ${tx.hash}`);
      
    }
  };

  const handleCancel = (): void => {
    setShowAgents(false);
    setSelectedCardIds([]);
    if (onCancel) {
      onCancel();
    }
  };

  const playAudio = (card: any) => {
    speechService.speak(`Hi I am ${card.name}. ${card.description}`, {
      voiceName: card.voiceName
    })
  };

  const initSpeech = () => {
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
  };

  useEffect(() => {
    initSpeech();
  }, []);

  useEffect(() => {
    if (!api) {
      return
    }

    api.on("slidesInView", () => {
      // Do something on select.
      console.log(api.slidesInView())
    })
  }, [api])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white bg-opacity-90 backdrop-blur-md rounded-lg shadow-xl max-w-3xl w-full m-4 text-black">
        <div className="p-6">
          <h2 className="text-2xl text-black font-bold mb-6 text-center">Select Agents</h2>

          <Carousel className="w-full" setApi={setApi}>
            <CarouselContent>
              {cards.map((card) => (
                <CarouselItem key={card.id}>
                  <Card className="bg-white bg-opacity-70 backdrop-blur-sm border-0">
                    <CardContent className="flex p-4">
                      <div className="mr-4 flex-shrink-0">
                        <img
                          src={card.image}
                          alt={card.name}
                          className="size-96 object-cover rounded-lg"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-semibold">{card.name}</h3>
                          <Volume2 onClick={() => playAudio(card)} />
                          <span className="font-bold text-green-600">{card.cost}</span>
                        </div>

                        <p className="text-gray-600 my-2">{card.description}</p>

                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {card.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="bg-blue-100 bg-opacity-80 text-blue-800 hover:bg-blue-200">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4">
                          <Button
                            variant={isCardSelected(card.id) ? "destructive" : "default"}
                            className="flex items-center"
                            onClick={() => toggleCardSelection(card.id)}
                          >
                            {isCardSelected(card.id) ? (
                              <>
                                <X size={16} className="mr-1" />
                                Deselect
                              </>
                            ) : (
                              <>
                                <Check size={16} className="mr-1" />
                                Select
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex items-center justify-center mt-4">
              <CarouselPrevious className="static transform-none mx-2" />
              <div className="flex space-x-1">
                {cards.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
              <CarouselNext className="static transform-none mx-2" />
            </div>
          </Carousel>

          {/* Selected cards section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Selected Cards ({selectedCardIds.length})</h3>
            <div className="max-h-32 overflow-y-auto">
              {getSelectedCards().length > 0 ? (
                <div className="space-y-2">
                  {getSelectedCards().map(card => (
                    <div key={card.id} className="flex items-center bg-blue-50 bg-opacity-70 p-2 rounded-lg">
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-10 h-10 rounded mr-2 object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{card.name}</p>
                        <p className="text-sm text-gray-600">{card.cost}</p>
                      </div>
                      <button
                        className="p-1 rounded-full hover:bg-red-100"
                        onClick={() => removeSelectedCard(card.id)}
                      >
                        <X size={16} className="text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No cards selected</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-100 bg-opacity-70 backdrop-blur-sm px-6 py-4 rounded-b-lg">
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="mr-2"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              disabled={selectedCardIds.length === 0}
              onClick={handleConfirmSelection}
            >
              Confirm Selection ({selectedCardIds.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentSelector;