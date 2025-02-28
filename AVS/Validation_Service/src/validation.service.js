const { ethers } = require('ethers');
const { OthenticSDK } = require('@othentic/sdk');
const axios = require('axios');

// Initialize Ethereum provider
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

// Initialize Othentic SDK for EigenLayer AVS
const othentic = new OthenticSDK({
  apiKey: process.env.OTHENTIC_API_KEY,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'testnet'
});

// Validate task execution
async function validateTask(taskId, result, signature, agentAddress) {
  try {
    console.log(`Validating task ${taskId} from agent ${agentAddress}`);
    
    // 1. Verify the signature
    const resultString = JSON.stringify(result);
    const resultHash = ethers.utils.hashMessage(resultString);
    const recoveredAddress = ethers.utils.verifyMessage(resultHash, signature);
    
    if (recoveredAddress.toLowerCase() !== agentAddress.toLowerCase()) {
      throw new Error('Invalid signature');
    }
    
    // 2. Verify the transaction on-chain if applicable
    if (result.transactionHash) {
      const tx = await provider.getTransaction(result.transactionHash);
      if (!tx) {
        throw new Error('Transaction not found on-chain');
      }
      
      // Wait for confirmation
      const receipt = await provider.getTransactionReceipt(result.transactionHash);
      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed or not confirmed');
      }
    }
    
    // 3. Submit validation to EigenLayer AVS via Othentic
    const validationResult = await othentic.submitValidation({
      taskId: taskId,
      isValid: true,
      validationData: {
        signature: signature,
        result: result,
        validator: process.env.VALIDATOR_ADDRESS
      }
    });
    
    console.log(`Task ${taskId} validated successfully`);
    
    return {
      success: true,
      taskId: taskId,
      validationId: validationResult.validationId,
      status: 'validated'
    };
  } catch (error) {
    console.error(`Error validating task: ${error.message}`);
    
    // Submit failed validation
    try {
      await othentic.submitValidation({
        taskId: taskId,
        isValid: false,
        validationData: {
          error: error.message,
          validator: process.env.VALIDATOR_ADDRESS
        }
      });
    } catch (submitError) {
      console.error(`Error submitting failed validation: ${submitError.message}`);
    }
    
    throw error;
  }
}

// Validate agent registration
async function validateAgentRegistration(agentAddress, metadata) {
  try {
    console.log(`Validating agent registration for ${agentAddress}`);
    
    // 1. Verify the agent metadata
    if (!metadata || !metadata.name || !metadata.description || !metadata.taskTypes) {
      throw new Error('Invalid agent metadata');
    }
    
    // 2. Verify the agent has a valid wallet
    const code = await provider.getCode(agentAddress);
    const isContract = code !== '0x';
    
    // 3. Submit validation to EigenLayer AVS
    const validationResult = await othentic.submitAgentValidation({
      agentAddress: agentAddress,
      isValid: true,
      validationData: {
        metadata: metadata,
        isContract: isContract,
        validator: process.env.VALIDATOR_ADDRESS
      }
    });
    
    console.log(`Agent ${agentAddress} validated successfully`);
    
    return {
      success: true,
      agentAddress: agentAddress,
      validationId: validationResult.validationId,
      status: 'validated'
    };
  } catch (error) {
    console.error(`Error validating agent: ${error.message}`);
    
    // Submit failed validation
    try {
      await othentic.submitAgentValidation({
        agentAddress: agentAddress,
        isValid: false,
        validationData: {
          error: error.message,
          validator: process.env.VALIDATOR_ADDRESS
        }
      });
    } catch (submitError) {
      console.error(`Error submitting failed agent validation: ${submitError.message}`);
    }
    
    throw error;
  }
}

module.exports = {
  validateTask,
  validateAgentRegistration
}; 