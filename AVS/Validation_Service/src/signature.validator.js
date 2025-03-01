require('dotenv').config();
const { ethers } = require("ethers");
const dalService = require("./dal.service");
const wwanConfig = require('../../Execution_Service/configs/WWAN.config.js');
const redisClient = require('../../Execution_Service/redis/redis.js');

// Initialize Ethereum provider and contract
const provider = new ethers.JsonRpcProvider(wwanConfig.RPC_URL);
const attestationCenterContract = new ethers.Contract(
  wwanConfig.ATTESTATION_CENTER_ADDRESS,
  wwanConfig.ATTESTATION_CENTER_ABI,
  provider
);

/**
 * Validates a signature from an agent
 * @param {string} agentId - The agent's address
 * @param {string} message - The original message
 * @param {string} signature - The signature to validate
 * @returns {Promise<boolean>} - Whether the signature is valid
 */
async function validateAgentSignature(agentId, message, signature) {
  try {
    console.log(`Validating signature from agent ${agentId}`);
    
    // Get agent from Redis
    const agentJson = await redisClient.getStringKey(`agent:${agentId}`);
    if (!agentJson) {
      console.error(`Agent ${agentId} not found`);
      return false;
    }
    
    const agent = JSON.parse(agentJson);
    
    // Recover the signer from the signature
    const messageHash = ethers.hashMessage(
      typeof message === 'string' ? message : JSON.stringify(message)
    );
    
    const recoveredAddress = ethers.recoverAddress(messageHash, signature);
    
    // Check if the recovered address matches the agent's address
    const isValid = recoveredAddress.toLowerCase() === agentId.toLowerCase();
    
    console.log(`Signature validation result for agent ${agentId}: ${isValid}`);
    return isValid;
  } catch (error) {
    console.error(`Error validating agent signature: ${error.message}`);
    return false;
  }
}

/**
 * Validates a task result from IPFS and creates an attestation
 * @param {string} taskId - The task ID
 * @param {string} ipfsHash - The IPFS hash of the task result
 * @param {string} agentId - The agent's address
 * @param {string} signature - The agent's signature
 * @returns {Promise<Object>} - The validation result and attestation
 */
async function validateTaskResult(taskId, ipfsHash, agentId, signature) {
  try {
    console.log(`Validating task result for task ${taskId} from agent ${agentId}`);
    
    // Get task from Redis
    const taskJson = await redisClient.getStringKey(`task:${taskId}`);
    if (!taskJson) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const task = JSON.parse(taskJson);
    
    // Fetch task result from IPFS
    const taskResult = await dalService.getIPfsTask(ipfsHash);
    
    // Validate the signature
    const isSignatureValid = await validateAgentSignature(
      agentId, 
      { taskId, result: taskResult }, 
      signature
    );
    
    if (!isSignatureValid) {
      throw new Error("Invalid agent signature");
    }
    
    // Create attestation for EigenLayer AVS
    const wallet = new ethers.Wallet(wwanConfig.PRIVATE_KEY_PERFORMER, provider);
    const attestationWithSigner = attestationCenterContract.connect(wallet);
    
    // Create attestation data
    const attestationData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "address", "string", "string"],
      [taskId, agentId, ipfsHash, JSON.stringify(taskResult)]
    );
    
    // Submit attestation to the contract
    console.log(`Submitting attestation for task ${taskId}`);
    const tx = await attestationWithSigner.submitAttestation(
      taskId,
      agentId,
      attestationData,
      { gasLimit: 500000 }
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log(`Attestation submitted: ${tx.hash}`);
    
    // Update task status in Redis
    task.status = 'validated';
    task.validationResult = {
      isValid: true,
      attestationTx: tx.hash,
      attestationBlock: receipt.blockNumber,
      timestamp: Date.now()
    };
    
    await redisClient.pushStringToRedisWithKey(`task:${taskId}`, JSON.stringify(task));
    
    return {
      success: true,
      taskId: taskId,
      isValid: true,
      attestationTx: tx.hash,
      attestationBlock: receipt.blockNumber
    };
  } catch (error) {
    console.error(`Error validating task result: ${error.message}`);
    
    // Update task status in Redis if task exists
    try {
      const taskJson = await redisClient.getStringKey(`task:${taskId}`);
      if (taskJson) {
        const task = JSON.parse(taskJson);
        task.status = 'validation_failed';
        task.validationResult = {
          isValid: false,
          error: error.message,
          timestamp: Date.now()
        };
        
        await redisClient.pushStringToRedisWithKey(`task:${taskId}`, JSON.stringify(task));
      }
    } catch (redisError) {
      console.error(`Error updating task status: ${redisError.message}`);
    }
    
    return {
      success: false,
      taskId: taskId,
      isValid: false,
      error: error.message
    };
  }
}

/**
 * Verifies a proof submitted to the EigenLayer AVS
 * @param {string} taskId - The task ID
 * @param {string} proof - The proof data
 * @returns {Promise<Object>} - The verification result
 */
async function verifyEigenLayerProof(taskId, proof) {
  try {
    console.log(`Verifying EigenLayer proof for task ${taskId}`);
    
    // Get task from Redis
    const taskJson = await redisClient.getStringKey(`task:${taskId}`);
    if (!taskJson) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const task = JSON.parse(taskJson);
    
    // Verify the proof with the EigenLayer AVS
    // This would typically involve calling the EigenLayer AVS verification contract
    // For now, we'll simulate this with a simple check
    
    // Check if the proof format is valid
    if (!proof || !proof.signature || !proof.taskData || !proof.operatorId) {
      throw new Error("Invalid proof format");
    }
    
    // Verify the operator signature
    // This would be replaced with actual EigenLayer verification logic
    const isProofValid = true; // Simulated validation
    
    if (!isProofValid) {
      throw new Error("Invalid EigenLayer proof");
    }
    
    // Update task status in Redis
    task.status = 'proof_verified';
    task.proofVerification = {
      isValid: true,
      proof: proof,
      timestamp: Date.now()
    };
    
    await redisClient.pushStringToRedisWithKey(`task:${taskId}`, JSON.stringify(task));
    
    return {
      success: true,
      taskId: taskId,
      isValid: true,
      message: "EigenLayer proof verified successfully"
    };
  } catch (error) {
    console.error(`Error verifying EigenLayer proof: ${error.message}`);
    
    // Update task status in Redis if task exists
    try {
      const taskJson = await redisClient.getStringKey(`task:${taskId}`);
      if (taskJson) {
        const task = JSON.parse(taskJson);
        task.status = 'proof_verification_failed';
        task.proofVerification = {
          isValid: false,
          error: error.message,
          timestamp: Date.now()
        };
        
        await redisClient.pushStringToRedisWithKey(`task:${taskId}`, JSON.stringify(task));
      }
    } catch (redisError) {
      console.error(`Error updating task status: ${redisError.message}`);
    }
    
    return {
      success: false,
      taskId: taskId,
      isValid: false,
      error: error.message
    };
  }
}

/**
 * Generates a proof for the EigenLayer AVS
 * @param {string} taskId - The task ID
 * @param {string} result - The task result
 * @returns {Promise<Object>} - The generated proof
 */
async function generateEigenLayerProof(taskId, result) {
  try {
    console.log(`Generating EigenLayer proof for task ${taskId}`);
    
    // Get task from Redis
    const taskJson = await redisClient.getStringKey(`task:${taskId}`);
    if (!taskJson) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const task = JSON.parse(taskJson);
    
    // Create a wallet for signing
    const wallet = new ethers.Wallet(wwanConfig.PRIVATE_KEY_PERFORMER, provider);
    
    // Create the proof data
    const proofData = {
      taskId: taskId,
      taskType: task.taskType,
      taskData: task.taskData,
      result: result,
      timestamp: Date.now(),
      operatorId: wallet.address
    };
    
    // Sign the proof data
    const proofDataHash = ethers.hashMessage(JSON.stringify(proofData));
    const signature = await wallet.signMessage(proofDataHash);
    
    // Construct the complete proof
    const proof = {
      ...proofData,
      signature: signature
    };
    
    // Store the proof in IPFS
    const ipfsHash = await storeOnIPFS(proof);
    
    // Update task status in Redis
    task.status = 'proof_generated';
    task.proof = {
      ipfsHash: ipfsHash,
      proof: proof,
      timestamp: Date.now()
    };
    
    await redisClient.pushStringToRedisWithKey(`task:${taskId}`, JSON.stringify(task));
    
    return {
      success: true,
      taskId: taskId,
      proof: proof,
      ipfsHash: ipfsHash
    };
  } catch (error) {
    console.error(`Error generating EigenLayer proof: ${error.message}`);
    return {
      success: false,
      taskId: taskId,
      error: error.message
    };
  }
}

// Helper function to store data on IPFS
async function storeOnIPFS(data) {
  try {
    // This would be replaced with actual IPFS storage logic
    // For now, we'll simulate it with a random hash
    const randomHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    console.log(`Stored data on IPFS with hash: ${randomHash}`);
    return randomHash;
  } catch (error) {
    console.error(`Error storing on IPFS: ${error.message}`);
    throw error;
  }
}

module.exports = {
  validateAgentSignature,
  validateTaskResult,
  verifyEigenLayerProof,
  generateEigenLayerProof
}; 