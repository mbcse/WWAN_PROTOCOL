require('dotenv').config();
const dalService = require("./dal.service");
const oracleService = require("./oracle.service");
const signatureValidator = require("./signature.validator");
const redisClient = require('../../Execution_Service/redis/redis.js');
const wwanConfig = require('../../Execution_Service/configs/WWAN.config.js');
const { ethers } = require("ethers");

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

async function validateTaskAndGenerateProof(taskId, ipfsHash, agentId, signature) {
  try {
    console.log(`Validating task ${taskId} and generating proof for agent ${agentId}`);
    
    const validationResult = await signatureValidator.validateTaskResult(
      taskId, ipfsHash, agentId, signature
    );
    
    if (!validationResult.success || !validationResult.isValid) {
      throw new Error("Task validation failed");
    }
    
    const taskResult = await dalService.getIPfsTask(ipfsHash);
    
    let additionalValidation = true;
    
    if (taskResult.symbol && taskResult.price) {
      const oracleData = await oracleService.getPrice(taskResult.symbol);
      const upperBound = oracleData.price * 1.05;
      const lowerBound = oracleData.price * 0.95;
      
      if (taskResult.price > upperBound || taskResult.price < lowerBound) {
        additionalValidation = false;
      }
    }
    
    if (taskResult.agentId && taskResult.taskType) {
      const agentJson = await redisClient.getStringKey(`agent:${taskResult.agentId}`);
      if (agentJson) {
        const agent = JSON.parse(agentJson);
        
        if (!agent.isActive) {
          additionalValidation = false;
          throw new Error("Agent is not active");
        }
        
        if (agent.metadata && agent.metadata.supportedTaskTypes) {
          const supportedTypes = Array.isArray(agent.metadata.supportedTaskTypes) 
            ? agent.metadata.supportedTaskTypes 
            : [agent.metadata.supportedTaskTypes];
            
          if (!supportedTypes.includes(taskResult.taskType)) {
            additionalValidation = false;
            throw new Error(`Agent does not support task type: ${taskResult.taskType}`);
          }
        }
      } else {
        console.warn(`Agent ${taskResult.agentId} not found in Redis`);
      }
    }
    
    if (!additionalValidation) {
      throw new Error("Additional validation failed");
    }
    
    const proofResult = await signatureValidator.generateEigenLayerProof(taskId, taskResult);
    
    if (!proofResult.success) {
      throw new Error("Failed to generate proof");
    }
    
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
      
      if (task.assignedAgent && task.assignedAgent === agentId) {
        try {
          await updateWWANTaskStatus(taskId, proofResult.proof);
        } catch (contractError) {
          console.error(`Error updating WWAN contract: ${contractError.message}`);
        }
      }
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

async function updateWWANTaskStatus(taskId, proof) {
  try {
    const provider = new ethers.JsonRpcProvider(wwanConfig.RPC_URL);
    const wallet = new ethers.Wallet(wwanConfig.PRIVATE_KEY_PERFORMER, provider);
    const wwanContract = new ethers.Contract(wwanConfig.WWAN_ADDRESS, wwanConfig.WWAN_ABI, wallet);
    
    console.log(`Updating WWAN contract for task ${taskId} with proof`);
    
    const tx = await wwanContract.completeTask(taskId, proof);
    const receipt = await tx.wait();
    
    console.log(`WWAN contract updated successfully: ${tx.hash}`);
    
    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error(`Error updating WWAN contract: ${error.message}`);
    throw error;
  }
}

async function validateWWANAgentTask(taskId, agentId) {
  try {
    console.log(`Validating WWAN agent task ${taskId} for agent ${agentId}`);
    
    const taskJson = await redisClient.getStringKey(`task:${taskId}`);
    if (!taskJson) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const task = JSON.parse(taskJson);
    
    if (task.assignedAgent !== agentId) {
      throw new Error(`Agent ${agentId} is not assigned to task ${taskId}`);
    }
    
    const agentJson = await redisClient.getStringKey(`agent:${agentId}`);
    if (!agentJson) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    const agent = JSON.parse(agentJson);
    
    let validationResult = true;
    let validationDetails = {};
    
    if (task.taskType === 'price') {
      if (task.taskData && task.taskData.symbol) {
        const oracleData = await oracleService.getPrice(task.taskData.symbol);
        validationDetails.oraclePrice = oracleData.price;
        validationDetails.taskPrice = task.taskData.price;
        
        const upperBound = oracleData.price * 1.05;
        const lowerBound = oracleData.price * 0.95;
        
        validationResult = (task.taskData.price <= upperBound && task.taskData.price >= lowerBound);
      }
    } else if (task.taskType === 'message') {
      validationResult = true;
    } else {
      validationResult = true;
    }
    
    task.validation = {
      isValid: validationResult,
      details: validationDetails,
      timestamp: Date.now()
    };
    
    if (validationResult) {
      task.status = 'validated';
    } else {
      task.status = 'validation_failed';
    }
    
    await redisClient.pushStringToRedisWithKey(`task:${taskId}`, JSON.stringify(task));
    
    return {
      success: true,
      taskId: taskId,
      isValid: validationResult,
      details: validationDetails
    };
  } catch (error) {
    console.error(`Error validating WWAN agent task: ${error.message}`);
    return {
      success: false,
      taskId: taskId,
      error: error.message
    };
  }
}

module.exports = {
  validate,
  validateTaskAndGenerateProof,
  validateWWANAgentTask,
  updateWWANTaskStatus
};