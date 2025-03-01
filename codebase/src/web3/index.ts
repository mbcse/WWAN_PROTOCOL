/* eslint-disable @typescript-eslint/no-explicit-any */
import { ContractRunner, ethers } from 'ethers';
import { WWANPROTOCOL as abi } from './abi/contractABIData.json';
import addresses from './abi/contractAddresses.json';

const contractAddress = addresses["84532"]["WWANPROTOCOL"];

// A single function to get all contract functions
export const getContractFunctions = async (provider: any) => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    
    return {
      // View Functions
      async getAgent(agentAddress: string) {
        return await contract.agents(agentAddress);
      },
      async getTask(taskId: number) {
        return await contract.tasks(taskId);
      },
      async getTaskCounter() {
        return await contract.taskCounter();
      },
      async getPaymentToken() {
        return await contract.paymentToken();
      },
      async getOwner() {
        return await contract.owner();
      },
      // Write Functions
      async registerAgent(metadata: string, supportedTaskTypes: string[]) {
        const tx = await contract.registerAgent(metadata, supportedTaskTypes);
        await tx.wait();
        console.log("Agent registered successfully");
        return tx;
      },
      async registerAgentForUser(agentAddress: string, paymentAllowance: ethers.BigNumberish) {
        const tx = await contract.registerAgentForUser(agentAddress, paymentAllowance);
        await tx.wait();
        return tx;
      },
      async registerAgentForOtherUser(
        user: string,
        agentAddress: string,
        paymentAllowance: ethers.BigNumberish
      ) {
        const tx = await contract.registerAgentForOtherUser(user, agentAddress, paymentAllowance);
        await tx.wait();
        return tx;
      },
      async createTask(
        taskType: string,
        taskData: string,
        payment: ethers.BigNumberish,
        collaboratingAgents: string[]
      ) {
        const tx = await contract.createTask(taskType, taskData, payment, collaboratingAgents);
        await tx.wait();
        return tx;
      },
      async executeAgentTask(
        agentAddress: string,
        taskType: string,
        taskData: string,
        payment: ethers.BigNumberish
      ) {
        const tx = await contract.executeAgentTask(agentAddress, taskType, taskData, payment);
        await tx.wait();
        return tx;
      },
      async assignTask(taskId: number) {
        const tx = await contract.assignTask(taskId);
        await tx.wait();
        return tx;
      },
      async completeTask(taskId: number, signature: string) {
        const tx = await contract.completeTask(taskId, signature);
        await tx.wait();
        return tx;
      },
      async requestCollaboration(taskId: number, collaboratorAgent: string) {
        const tx = await contract.requestCollaboration(taskId, collaboratorAgent);
        await tx.wait();
        return tx;
      },
      // Admin Functions
      async initialize(paymentToken: string) {
        const tx = await contract.initialize(paymentToken);
        await tx.wait();
        return tx;
      },
      async upgradeTo(newImplementation: string) {
        const tx = await contract.upgradeTo(newImplementation);
        await tx.wait();
        return tx;
      },
      async upgradeToAndCall(newImplementation: string, data: string) {
        const tx = await contract.upgradeToAndCall(newImplementation, data);
        await tx.wait();
        return tx;
      },
      // Utility to format string as bytes32
      encodeBytes32String(text: string) {
        return ethers.encodeBytes32String(text);
      }
    };
  } catch (error) {
    console.error("Error initializing contract functions:", error);
    throw error;
  }
};