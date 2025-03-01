/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { WWANPROTOCOL as abi } from './abi/contractABIData.json';
import addresses from './abi/contractAddresses.json';
import { prepareWriteContract, readContract, writeContract } from '@wagmi/core';
import { Address, Hash } from 'viem';

// Define types for the contract responses
export interface AgentData {
  metadata: string;
  supportedTaskTypes: string[];
  owner: Address;
  status: number;
}

export interface TaskData {
  id: number;
  taskType: string;
  taskData: string;
  creator: Address;
  agent: Address;
  status: number;
  payment: bigint;
  collaboratingAgents: Address[];
}

export interface ContractFunctions {
  // Read functions
  getAgent: (agentAddress: Address) => Promise<AgentData>;
  getTask: (taskId: number) => Promise<TaskData>;
  getTaskCounter: () => Promise<number>;
  getPaymentToken: () => Promise<Address>;
  getOwner: () => Promise<Address>;
  
  // Write functions
  registerAgent: (metadata: string, supportedTaskTypes: string[]) => Promise<Hash>;
  registerAgentForUser: (agentAddress: Address, paymentAllowance: bigint) => Promise<Hash>;
  registerAgentForOtherUser: (user: Address, agentAddress: Address, paymentAllowance: bigint) => Promise<Hash>;
  createTask: (taskType: string, taskData: string, payment: bigint, collaboratingAgents: Address[]) => Promise<Hash>;
  executeAgentTask: (agentAddress: Address, taskType: string, taskData: string, payment: bigint) => Promise<Hash>;
  assignTask: (taskId: number) => Promise<Hash>;
  completeTask: (taskId: number, signature: string) => Promise<Hash>;
  requestCollaboration: (taskId: number, collaboratorAgent: Address) => Promise<Hash>;
  
  // Admin functions
  initialize: (paymentToken: Address) => Promise<Hash>;
  upgradeTo: (newImplementation: Address) => Promise<Hash>;
  upgradeToAndCall: (newImplementation: Address, data: string) => Promise<Hash>;
  
  // Utility
  encodeBytes32String: (text: string) => string;
}

// Use a hook to get contract functions
export const useContractFunctions = (): ContractFunctions => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  
  // Get the contract address based on the current chain
  const contractAddress = addresses[chainId.toString()]?.["WWANPROTOCOL"] || addresses["84532"]["WWANPROTOCOL"] as Address;

  // Read functions
  const getAgent = async (agentAddress: Address): Promise<AgentData> => {
    return await readContract({
      address: contractAddress,
      abi,
      functionName: 'agents',
      args: [agentAddress]
    }) as unknown as AgentData;
  };

  const getTask = async (taskId: number): Promise<TaskData> => {
    return await readContract({
      address: contractAddress,
      abi,
      functionName: 'tasks',
      args: [taskId]
    }) as unknown as TaskData;
  };

  const getTaskCounter = async (): Promise<number> => {
    const result = await readContract({
      address: contractAddress,
      abi,
      functionName: 'taskCounter'
    });
    return Number(result);
  };

  const getPaymentToken = async (): Promise<Address> => {
    return await readContract({
      address: contractAddress,
      abi,
      functionName: 'paymentToken'
    }) as Address;
  };

  const getOwner = async (): Promise<Address> => {
    return await readContract({
      address: contractAddress,
      abi,
      functionName: 'owner'
    }) as Address;
  };

  // Write functions
  const registerAgent = async (metadata: string, supportedTaskTypes: string[]): Promise<Hash> => {
    const config = await prepareWriteContract({
      address: contractAddress,
      abi,
      functionName: 'registerAgent',
      args: [metadata, supportedTaskTypes]
    });
    
    const { hash } = await writeContract(config);
    return hash;
  };

  const registerAgentForUser = async (agentAddress: Address, paymentAllowance: bigint): Promise<Hash> => {
    const config = await prepareWriteContract({
      address: contractAddress,
      abi,
      functionName: 'registerAgentForUser',
      args: [agentAddress, paymentAllowance]
    });
    
    const { hash } = await writeContract(config);
    return hash;
  };

  const registerAgentForOtherUser = async (
    user: Address,
    agentAddress: Address,
    paymentAllowance: bigint
  ): Promise<Hash> => {
    const config = await prepareWriteContract({
      address: contractAddress,
      abi,
      functionName: 'registerAgentForOtherUser',
      args: [user, agentAddress, paymentAllowance]
    });
    
    const { hash } = await writeContract(config);
    return hash;
  };

  const createTask = async (
    taskType: string,
    taskData: string,
    payment: bigint,
    collaboratingAgents: Address[]
  ): Promise<Hash> => {
    const config = await prepareWriteContract({
      address: contractAddress,
      abi,
      functionName: 'createTask',
      args: [taskType, taskData, payment, collaboratingAgents]
    });
    
    const { hash } = await writeContract(config);
    return hash;
  };

  const executeAgentTask = async (
    agentAddress: Address,
    taskType: string,
    taskData: string,
    payment: bigint
  ): Promise<Hash> => {
    const config = await prepareWriteContract({
      address: contractAddress,
      abi,
      functionName: 'executeAgentTask',
      args: [agentAddress, taskType, taskData, payment]
    });
    
    const { hash } = await writeContract(config);
    return hash;
  };

  const assignTask = async (taskId: number): Promise<Hash> => {
    const config = await prepareWriteContract({
      address: contractAddress,
      abi,
      functionName: 'assignTask',
      args: [taskId]
    });
    
    const { hash } = await writeContract(config);
    return hash;
  };

  const completeTask = async (taskId: number, signature: string): Promise<Hash> => {
    const config = await prepareWriteContract({
      address: contractAddress,
      abi,
      functionName: 'completeTask',
      args: [taskId, signature]
    });
    
    const { hash } = await writeContract(config);
    return hash;
  };

  const requestCollaboration = async (taskId: number, collaboratorAgent: Address): Promise<Hash> => {
    const config = await prepareWriteContract({
      address: contractAddress,
      abi,
      functionName: 'requestCollaboration',
      args: [taskId, collaboratorAgent]
    });
    
    const { hash } = await writeContract(config);
    return hash;
  };

  // Admin functions
  const initialize = async (paymentToken: Address): Promise<Hash> => {
    const config = await prepareWriteContract({
      address: contractAddress,
      abi,
      functionName: 'initialize',
      args: [paymentToken]
    });
    
    const { hash } = await writeContract(config);
    return hash;
  };

  const upgradeTo = async (newImplementation: Address): Promise<Hash> => {
    const config = await prepareWriteContract({
      address: contractAddress,
      abi,
      functionName: 'upgradeTo',
      args: [newImplementation]
    });
    
    const { hash } = await writeContract(config);
    return hash;
  };

  const upgradeToAndCall = async (newImplementation: Address, data: string): Promise<Hash> => {
    const config = await prepareWriteContract({
      address: contractAddress,
      abi,
      functionName: 'upgradeToAndCall',
      args: [newImplementation, data]
    });
    
    const { hash } = await writeContract(config);
    return hash;
  };

  // Utility
  const encodeBytes32String = (text: string): string => {
    return text; // viem will handle this conversion
  };

  return {
    getAgent,
    getTask,
    getTaskCounter,
    getPaymentToken,
    getOwner,
    registerAgent,
    registerAgentForUser,
    registerAgentForOtherUser,
    createTask,
    executeAgentTask,
    assignTask,
    completeTask,
    requestCollaboration,
    initialize,
    upgradeTo,
    upgradeToAndCall,
    encodeBytes32String
  };
};