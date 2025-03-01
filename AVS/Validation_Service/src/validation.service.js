const { ethers } = require('ethers');
const axios = require('axios');
const dalService = require('./dal.service');
const signatureValidator = require('./signature.validator');

// Initialize Ethereum provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Validate task execution
async function validateTask(taskId, result, signature, agentAddress) {
  try {
    console.log(`Validating task ${taskId} from agent ${agentAddress}`);
    
    // 1. Verify the signature
    const resultString = JSON.stringify(result);
    const resultHash = ethers.hashMessage(resultString);
    const recoveredAddress = ethers.recoverAddress(resultHash, signature);
    
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
    
    // 3. Store result on IPFS
    const ipfsHash = await dalService.storeOnIPFS({
      taskId: taskId,
      result: result,
      signature: signature,
      agentAddress: agentAddress,
      timestamp: Date.now()
    });
    
    // 4. Generate EigenLayer proof
    const proofResult = await signatureValidator.generateEigenLayerProof(taskId, result);
    
    if (!proofResult.success) {
      throw new Error(`Failed to generate proof: ${proofResult.error}`);
    }
    
    console.log(`Task ${taskId} validated successfully`);
    
    return {
      success: true,
      taskId: taskId,
      validationId: proofResult.ipfsHash,
      status: 'validated',
      proof: proofResult.proof
    };
  } catch (error) {
    console.error(`Error validating task: ${error.message}`);
    
    // Submit failed validation by storing the error on IPFS
    try {
      const errorIpfsHash = await dalService.storeOnIPFS({
        taskId: taskId,
        error: error.message,
        agentAddress: agentAddress,
        timestamp: Date.now(),
        status: 'failed'
      });
      
      // Record the failed validation
      await signatureValidator.recordFailedValidation(taskId, error.message);
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
    
    // 3. Store validation result on IPFS
    const validationData = {
      agentAddress: agentAddress,
      metadata: metadata,
      isContract: isContract,
      validator: process.env.VALIDATOR_ADDRESS,
      timestamp: Date.now(),
      isValid: true
    };
    
    const ipfsHash = await dalService.storeOnIPFS(validationData);
    
    // 4. Create attestation for the agent
    const wallet = new ethers.Wallet(process.env.VALIDATOR_PRIVATE_KEY, provider);
    const attestationData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "string", "bool"],
      [agentAddress, JSON.stringify(metadata), true]
    );
    
    // Sign the attestation
    const attestationHash = ethers.hashMessage(attestationData);
    const signature = await wallet.signMessage(attestationHash);
    
    console.log(`Agent ${agentAddress} validated successfully`);
    
    return {
      success: true,
      agentAddress: agentAddress,
      validationId: ipfsHash,
      status: 'validated',
      signature: signature,
      attestationData: attestationData
    };
  } catch (error) {
    console.error(`Error validating agent: ${error.message}`);
    
    // Submit failed validation
    try {
      await dalService.storeOnIPFS({
        agentAddress: agentAddress,
        error: error.message,
        validator: process.env.VALIDATOR_ADDRESS,
        timestamp: Date.now(),
        isValid: false
      });
    } catch (submitError) {
      console.error(`Error submitting failed agent validation: ${submitError.message}`);
    }
    
    throw error;
  }
}

// Add a new function to record failed validations
async function recordFailedValidation(taskId, errorMessage) {
  try {
    // Create a wallet for signing
    const wallet = new ethers.Wallet(process.env.VALIDATOR_PRIVATE_KEY, provider);
    
    // Create the validation data
    const validationData = {
      taskId: taskId,
      isValid: false,
      error: errorMessage,
      validator: wallet.address,
      timestamp: Date.now()
    };
    
    // Sign the validation data
    const validationHash = ethers.hashMessage(JSON.stringify(validationData));
    const signature = await wallet.signMessage(validationHash);
    
    // Store the validation result in IPFS
    const ipfsHash = await dalService.storeOnIPFS({
      ...validationData,
      signature: signature
    });
    
    return {
      success: true,
      taskId: taskId,
      ipfsHash: ipfsHash
    };
  } catch (error) {
    console.error(`Error recording failed validation: ${error.message}`);
    return {
      success: false,
      taskId: taskId,
      error: error.message
    };
  }
}

module.exports = {
  validateTask,
  validateAgentRegistration,
  recordFailedValidation
}; 