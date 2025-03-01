import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

// Import shadcn components
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Define types
interface CardType {
  id: number;
  name: string;
  description: string;
  skills: string[];
  cost: string;
  image: string;
}

interface CardSelectorProps {
  onSelect?: (selectedCards: CardType[]) => void;
  onCancel?: () => void;
}

const CardSelector: React.FC<CardSelectorProps> = ({ onSelect, onCancel }) => {
  // const { user } = usePrivy();
  // const { wallets } = useWallets()
  // Sample card data
  const cards: CardType[] = [
    {
      id: 1,
      name: "Jane Cooper",
      description: "Senior Developer with 5+ years of experience in React and Node.js",
      skills: ["React", "Node.js", "TypeScript", "AWS"],
      cost: "$120/hr",
      image: "/agent1.png"
    },
    {
      id: 2,
      name: "Alex Morgan",
      description: "UI/UX Designer specialized in mobile applications and design systems",
      skills: ["Figma", "Adobe XD", "UI/UX", "Prototyping"],
      cost: "$95/hr",
      image: "/agent2.png"
    },
    {
      id: 3,
      name: "Michael Chen",
      description: "Full-stack developer with expertise in cloud architecture",
      skills: ["Python", "React", "AWS", "Docker"],
      cost: "$110/hr",
      image: "/agent3.png"
    }
  ];

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

  const handleConfirmSelection = async (): void => {
    if (onSelect && selectedCardIds.length > 0) {
      onSelect(getSelectedCards());
      // const provider = await wallets[0].getEthereumProvider();
      // const { approveWWAN } = await getContractFunctions(provider);
      // const tx = await approveWWAN(1000000000000000000);
      // toast(`Agent Registered successfully!! Transaction hash: ${tx.hash}`);
      
    }
  };

  const handleCancel = (): void => {
    setSelectedCardIds([]);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white bg-opacity-90 backdrop-blur-md rounded-lg shadow-xl max-w-3xl w-full m-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Select Agents</h2>
          
          <Carousel className="w-full">
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

export default CardSelector;