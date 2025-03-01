require('dotenv').config();
const dalService = require("./dal.service");
const oracleService = require("./oracle.service");
const signatureValidator = require("./signature.validator");
const redisClient = require('../../Execution_Service/redis/redis.js');

async function validate(proofOfTask) {
  try {
    const taskResult = await dalService.getIPfsTask(proofOfTask);
    var data = await oracleService.getPrice("ETHUSDT");
    const upperBound = data.price * 1.05;
    const lowerBound = data.price * 0.95;
    let isApproved = true;
    if (taskResult.price > upperBound || taskResult.price < lowerBound) {
      isApproved = false;
    }
    return isApproved;
  } catch (err) {
    console.error(err?.message);
    return false;
  }
}

/**
 * Validates a task and its result, then generates an EigenLayer proof
 * @param {string} taskId - The task ID
 * @param {string} ipfsHash - The IPFS hash of the task result
 * @param {string} agentId - The agent's address
 * @param {string} signature - The agent's signature
 * @returns {Promise<Object>} - The validation result and proof
 */
async function validateTaskAndGenerateProof(taskId, ipfsHash, agentId, signature) {
  try {
    console.log(`Validating task ${taskId} and generating proof`);
    
    // First validate the task result
    const validationResult = await signatureValidator.validateTaskResult(
      taskId, ipfsHash, agentId, signature
    );
    
    if (!validationResult.success || !validationResult.isValid) {
      throw new Error("Task validation failed");
    }
    
    // Fetch the task result from IPFS
    const taskResult = await dalService.getIPfsTask(ipfsHash);
    
    // Perform additional validation if needed
    // For example, if it's a price task, validate against oracle
    let additionalValidation = true;
    if (taskResult.symbol && taskResult.price) {
      const oracleData = await oracleService.getPrice(taskResult.symbol);
      const upperBound = oracleData.price * 1.05;
      const lowerBound = oracleData.price * 0.95;
      
      if (taskResult.price > upperBound || taskResult.price < lowerBound) {
        additionalValidation = false;
      }
    }
    
    if (!additionalValidation) {
      throw new Error("Additional validation failed");
    }
    
    // Generate EigenLayer proof
    const proofResult = await signatureValidator.generateEigenLayerProof(taskId, taskResult);
    
    if (!proofResult.success) {
      throw new Error("Failed to generate proof");
    }
    
    // Update task status in Redis
    const taskJson = await redisClient.getStringKey(`task:${taskId}`);
    if (taskJson) {
      const task = JSON.parse(taskJson);
      task.status = 'validated_with_proof';
      task.validation = {
        isValid: true,
        additionalValidation: additionalValidation,
        proof: proofResult.proof,
        ipfsHash: proofResult.ipfsHash,
        timestamp: Date.now()
      };
      
      await redisClient.pushStringToRedisWithKey(`task:${taskId}`, JSON.stringify(task));
    }
    
    return {
      success: true,
      taskId: taskId,
      validationResult: validationResult,
      proofResult: proofResult,
      additionalValidation: additionalValidation
    };
  } catch (error) {
    console.error(`Error validating task and generating proof: ${error.message}`);
    
    // Update task status in Redis if task exists
    try {
      const taskJson = await redisClient.getStringKey(`task:${taskId}`);
      if (taskJson) {
        const task = JSON.parse(taskJson);
        task.status = 'validation_failed';
        task.validation = {
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
      error: error.message
    };
  }
}

module.exports = {
  validate,
  validateTaskAndGenerateProof
};