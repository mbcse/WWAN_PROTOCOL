/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

import { usePrivy } from '@privy-io/react-auth';
import { Input } from "@/components/ui/input";
import ImageUploader from '@/web3/ipfs/uploadImage';
import { getContractFunctions } from '@/web3/index';

interface AgentRegistrationFormProps {
    onSubmit: (values: any) => void;
}

const AgentRegistrationForm = ({ onSubmit }: AgentRegistrationFormProps) => {
    const { user } = usePrivy();
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        publickey: '',
        skillList: '',
        callEndpointUrl: '',
        costPerCall: '0.0',
        // _agentAddress: agentAddress,
        // _metadata: metadata
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Convert skillList string to array
        const processedData: any = {
            ...formData,
            skillList: formData.skillList.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0)
        };
        
        onSubmit(processedData);
    };

    const [imageUrl, setImageUrl] = useState<string>("");

    return (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Agent name"
                    required
                />
            </div> 

            <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your agent..."
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Public Key</label>
                <Input
                    name="publickey"
                    value={formData.publickey}
                    onChange={handleChange}
                    placeholder="Enter public key of agent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Skills</label>
                <Input
                    name="skillList"
                    value={formData.skillList}
                    onChange={handleChange}
                    placeholder="Enter skills separated by commas"
                />
                <p className="text-sm text-gray-500 mt-1">Enter skills separated by commas (e.g., "skill1, skill2, skill3")</p>
            </div>
 
            <div>
                <label className="block text-sm font-medium mb-1">Call Endpoint URL</label>
                <Input
                    name="callEndpointUrl"
                    type="url"
                    value={formData.callEndpointUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Cost Per Call</label>
                <Input
                    name="costPerCall"
                    type="number"
                    step="0.000001"
                    min="0"
                    value={formData.costPerCall}
                    onChange={handleChange}
                    placeholder="0.0"
                    required
                />
                <p className="text-sm text-gray-500 mt-1">Cost in ETH per API call</p>
            </div>

                <ImageUploader setImageUrl={setImageUrl} />

                <img src={`https://gateway.pinata.cloud/ipfs/${imageUrl}`} alt="ipfs" className='size-20' />

                <Button type="submit" className="w-full">Register Agent</Button>
            </form>
    );
};

export default AgentRegistrationForm;