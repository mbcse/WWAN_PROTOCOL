require('dotenv').config();
const axios = require("axios");
const { ethers } = require("ethers");
const redisClient = require('../redis/redis.js');
const wwanConfig = require('../configs/WWAN.config.js');
const { getIpfsData, publishJSONToIpfs } = require('./dal.service.js');


// Initialize Ethereum provider and contract
const provider = new ethers.JsonRpcProvider(wwanConfig.RPC_URL);
const wwanContract = new ethers.Contract(wwanConfig.WWAN_ADDRESS, wwanConfig.WWAN_ABI, provider);
const attestationCenterContract = new ethers.Contract(
  wwanConfig.ATTESTATION_CENTER_ADDRESS,
  wwanConfig.ATTESTATION_CENTER_ABI,
  provider
);

// Initialize event listeners
async function initEventListeners() {
  console.log("Initializing WWAN event listeners...");
  
  // Listen for agent registration events
  wwanContract.on("AgentRegistered", async (agentAddress, metadata, event) => {
    console.log(`New agent registered: ${agentAddress}`);
    try {
      // Fetch metadata from IPFS
      const metadataContent = await fetchFromIPFS(metadata);
      
      // Store agent in Redis
      await indexAgentInRedis(agentAddress, metadataContent);
      
      console.log(`Agent ${agentAddress} indexed successfully`);
    } catch (error) {
      console.error(`Error processing agent registration: ${error.message}`);
    }
  });
  
  // Listen for task events
  wwanContract.on("TaskCreated", async (taskId, creator, taskType, event) => {
    console.log(`New task created: ${taskId.toString()}`);
    try {
      const task = await wwanContract.tasks(taskId);
      await redisClient.pushStringToRedisWithKey(
        `task:${taskId.toString()}`, 
        JSON.stringify({
          id: taskId.toString(),
          creator: task.creator,
          taskType: ethers.utils.parseBytes32String(taskType),
          taskData: task.taskData,
          payment: task.payment.toString(),
          status: task.status
        })
      );
    } catch (error) {
      console.error(`Error processing task creation: ${error.message}`);
    }
  });
  
  // Listen for task assignment events
  wwanContract.on("TaskAssigned", async (taskId, agent, event) => {
    console.log(`Task ${taskId.toString()} assigned to ${agent}`);
    try {
      const taskJson = await redisClient.getStringKey(`task:${taskId.toString()}`);
      if (taskJson) {
        const task = JSON.parse(taskJson);
        task.assignedAgent = agent;
        task.status = 1; // Assigned status
        await redisClient.pushStringToRedisWithKey(`task:${taskId.toString()}`, JSON.stringify(task));
      }
    } catch (error) {
      console.error(`Error processing task assignment: ${error.message}`);
    }
  });
  
  // Listen for task completion events
  wwanContract.on("TaskCompleted", async (taskId, signature, event) => {
    console.log(`Task ${taskId.toString()} completed`);
    try {
      const taskJson = await redisClient.getStringKey(`task:${taskId.toString()}`);
      if (taskJson) {
        const task = JSON.parse(taskJson);
        task.status = 2; // Completed status
        task.signature = signature;
        await redisClient.pushStringToRedisWithKey(`task:${taskId.toString()}`, JSON.stringify(task));
      }
    } catch (error) {
      console.error(`Error processing task completion: ${error.message}`);
    }
  });
  
  console.log("WWAN event listeners initialized successfully");
}

// Helper function to fetch data from IPFS
async function fetchFromIPFS(ipfsHash) {
  console.log("ipfsHash", ipfsHash)
  try {
    const content = await getIpfsData(ipfsHash);
    return content;
  } catch (error) {
    console.log(error)
    console.error(`Error fetching from IPFS: ${error.message}`);
    throw error;
  }
}

// Helper function to store data on IPFS
async function storeOnIPFS(data) {
  try {
    const ipfsHash = await publishJSONToIpfs(data);
    return ipfsHash;
  } catch (error) {
    console.error(`Error storing on IPFS: ${error.message}`);
    throw error;
  }
}

// Index agent in Redis
async function indexAgentInRedis(agentAddress, metadata) {
  try {
    const agentData = {
      address: agentAddress,
      metadata: metadata,
      isActive: true,
      reputation: await wwanContract.agents(agentAddress).reputation || 100,
      registeredAt: Date.now()
    };
    
    await redisClient.pushStringToRedisWithKey(`agent:${agentAddress}`, JSON.stringify(agentData));
    
    // Also maintain a list of all agents
    const agentsList = await redisClient.getStringKey('agents:list') || '[]';
    const agents = JSON.parse(agentsList);
    if (!agents.includes(agentAddress)) {
      agents.push(agentAddress);
      await redisClient.pushStringToRedisWithKey('agents:list', JSON.stringify(agents));
    }
  } catch (error) {
    console.error(`Error indexing agent in Redis: ${error.message}`);
    throw error;
  }
}

// Get all agents
async function getAgents() {
  try {
    const agentsList = await redisClient.getStringKey('agents:list') || '[]';
    const agentAddresses = JSON.parse(agentsList);
    
    const agents = [];
    for (const address of agentAddresses) {
      const agentJson = await redisClient.getStringKey(`agent:${address}`);
      if (agentJson) {
        agents.push(JSON.parse(agentJson));
      }
    }
    
    return agents;
  } catch (error) {
    console.error(`Error getting agents: ${error.message}`);
    throw error;
  }
}

// Get agent by ID (address)
async function getAgent(agentId) {
  try {
    const agentJson = await redisClient.getStringKey(`agent:${agentId}`);
    if (!agentJson) {
      throw new Error(`Agent ${agentId} not found`);
    }
    return JSON.parse(agentJson);
  } catch (error) {
    console.error(`Error getting agent: ${error.message}`);
    throw error;
  }
}

// Remove agent
async function removeAgent(agentId) {
  try {
    // Check if agent exists
    const agentJson = await redisClient.getStringKey(`agent:${agentId}`);
    if (!agentJson) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Remove agent from Redis
    const client = await redisClient.getRedisClient();
    await client.del(`agent:${agentId}`);
    
    // Remove from agents list
    const agentsList = await redisClient.getStringKey('agents:list') || '[]';
    const agents = JSON.parse(agentsList);
    const updatedAgents = agents.filter(address => address !== agentId);
    await redisClient.pushStringToRedisWithKey('agents:list', JSON.stringify(updatedAgents));
    
    await client.quit();
    return { success: true, message: `Agent ${agentId} removed successfully` };
  } catch (error) {
    console.error(`Error removing agent: ${error.message}`);
    throw error;
  }
}

// Get all tasks
async function getTasks() {
  try {
    // We need to get all task IDs from the contract events
    // For simplicity, we'll use a Redis key to track all tasks
    const tasksList = await redisClient.getStringKey('tasks:list') || '[]';
    const taskIds = JSON.parse(tasksList);
    
    const tasks = [];
    for (const taskId of taskIds) {
      const taskJson = await redisClient.getStringKey(`task:${taskId}`);
      if (taskJson) {
        tasks.push(JSON.parse(taskJson));
      }
    }
    
    return tasks;
  } catch (error) {
    console.error(`Error getting tasks: ${error.message}`);
    throw error;
  }
}

// Get task by ID
async function getTask(taskId) {
  try {
    const taskJson = await redisClient.getStringKey(`task:${taskId}`);
    if (!taskJson) {
      throw new Error(`Task ${taskId} not found`);
    }
    return JSON.parse(taskJson);
  } catch (error) {
    console.error(`Error getting task: ${error.message}`);
    throw error;
  }
}

// Get agent's inbox
async function getAgentInbox(agentId) {
  try {
    // Check if agent exists
    const agentJson = await redisClient.getStringKey(`agent:${agentId}`);
    if (!agentJson) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Get inbox messages
    const inboxKey = `inbox:${agentId}`;
    const inbox = JSON.parse(await redisClient.getStringKey(inboxKey) || '[]');
    
    const messages = [];
    for (const messageId of inbox) {
      const messageJson = await redisClient.getStringKey(messageId);
      if (messageJson) {
        const message = JSON.parse(messageJson);
        
        // If message has IPFS hash, fetch content
        if (message.ipfsHash) {
          try {
            const content = await fetchFromIPFS(message.ipfsHash);
            message.content = content;
          } catch (error) {
            console.warn(`Could not fetch message content from IPFS: ${error.message}`);
            message.content = { error: "Content not available" };
          }
        }
        
        messages.push(message);
      }
    }
    
    return messages;
  } catch (error) {
    console.error(`Error getting agent inbox: ${error.message}`);
    throw error;
  }
}

// Send message to agent
async function sendMessage(agentId, message, senderSignature) {
  try {
    // Verify agent exists
    const agentJson = await redisClient.getStringKey(`agent:${agentId}`);
    if (!agentJson) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Store message on IPFS
    const messageWithTimestamp = {
      ...message,
      timestamp: Date.now(),
      recipient: agentId
    };
    
    const ipfsHash = await storeOnIPFS(messageWithTimestamp);
    
    // Store in Redis for quick lookup
    const messageId = `message:${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    await redisClient.pushStringToRedisWithKey(messageId, JSON.stringify({
      ipfsHash,
      sender: message.sender,
      recipient: agentId,
      timestamp: messageWithTimestamp.timestamp,
      status: 'delivered'
    }));
    
    // Get agent data
    const agentData = JSON.parse(agentJson);
    
    // Create a task on the WWAN contract
    const wallet = new ethers.Wallet(wwanConfig.PRIVATE_KEY_PERFORMER, provider);
    const contractWithSigner = wwanContract.connect(wallet);
    
    // Convert message type to bytes32
    const taskType = ethers.utils.formatBytes32String(message.type || "message");
    
    // Create task on the contract
    console.log(`Creating task on WWAN contract for agent ${agentId}`);
    const tx = await contractWithSigner.createTask(
      taskType,
      ipfsHash,
      ethers.utils.parseEther("0.01"), // Small payment amount
      [] // No collaborating agents for now
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log(`Task created on chain: ${tx.hash}`);
    
    // Get the task ID from events
    const taskCreatedEvent = receipt.events.find(e => e.event === "TaskCreated");
    const taskId = taskCreatedEvent.args.taskId.toString();
    
    // Call the agent's endpoint if available
    let agentResponse = null;
    if (agentData.metadata.callEndpointUrl) {
      try {
        const response = await fetch(agentData.metadata.callEndpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messageWithTimestamp)
        });

        agentResponse = await response.json();
        console.log(`Agent response:`, agentResponse);
      } catch (error) {
        console.error(`Error calling agent endpoint: ${error.message}`);
      }
    }

    return {
      success: true,
      messageId: messageId,
      ipfsHash: ipfsHash,
      taskId: taskId,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      agentResponse: agentResponse
    };
  } catch (error) {
    console.error(`Error sending message: ${error.message}`);
    throw error;
  }
}

// Register agent for user
async function registerAgentForUser(userId, agentId, allowance) {
  try {
    // Check if agent exists
    const agentJson = await redisClient.getStringKey(`agent:${agentId}`);
    if (!agentJson) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // This would typically be done via the contract, but we'll track it in Redis too
    const userAgentsKey = `user:${userId}:agents`;
    const userAgents = JSON.parse(await redisClient.getStringKey(userAgentsKey) || '[]');
    
    if (!userAgents.includes(agentId)) {
      userAgents.push(agentId);
      await redisClient.pushStringToRedisWithKey(userAgentsKey, JSON.stringify(userAgents));
    }
    
    // Store allowance information
    await redisClient.pushStringToRedisWithKey(
      `user:${userId}:agent:${agentId}:allowance`, 
      allowance.toString()
    );
    
    return {
      success: true,
      message: `Agent ${agentId} registered for user ${userId} with allowance ${allowance}`
    };
  } catch (error) {
    console.error(`Error registering agent for user: ${error.message}`);
    throw error;
  }
}

// Get user's registered agents
async function getUserAgents(userId) {
  try {
    const userAgentsKey = `user:${userId}:agents`;
    const userAgents = JSON.parse(await redisClient.getStringKey(userAgentsKey) || '[]');
    
    const agents = [];
    for (const agentId of userAgents) {
      const agentJson = await redisClient.getStringKey(`agent:${agentId}`);
      if (agentJson) {
        const agent = JSON.parse(agentJson);
        
        // Get allowance
        const allowance = await redisClient.getStringKey(`user:${userId}:agent:${agentId}:allowance`) || '0';
        
        agents.push({
          ...agent,
          allowance: allowance
        });
      }
    }
    
    return agents;
  } catch (error) {
    console.error(`Error getting user agents: ${error.message}`);
    throw error;
  }
}

// Execute task via agent
async function executeAgentTask(userId, agentId, taskType, taskData) {
  try {
    // Check if agent is registered for user
    const userAgentsKey = `user:${userId}:agents`;
    const userAgents = JSON.parse(await redisClient.getStringKey(userAgentsKey) || '[]');
    
    if (!userAgents.includes(agentId)) {
      throw new Error(`Agent ${agentId} not registered for user ${userId}`);
    }
    
    // Get agent details
    const agentJson = await redisClient.getStringKey(`agent:${agentId}`);
    if (!agentJson) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    const agent = JSON.parse(agentJson);
    
    // Store task data on IPFS if it's a complex object
    let taskDataIpfsHash = taskData;
    if (typeof taskData === 'object') {
      taskDataIpfsHash = await storeOnIPFS(taskData);
    }
    
    // Create a unique task ID
    const taskId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Submit to EigenLayer AVS via Othentic
    const avsResponse = await othentic.submitTask({
      taskId: taskId,
      taskType: taskType,
      recipient: agentId,
      data: typeof taskData === 'object' ? JSON.stringify(taskData) : taskData,
      callbackUrl: `${process.env.AVS_CALLBACK_URL}/api/wwan/tasks/${taskId}/status`
    });
    
    // Store task in Redis
    const task = {
      id: taskId,
      creator: userId,
      assignedAgent: agentId,
      taskType: taskType,
      taskData: taskDataIpfsHash,
      status: 'submitted',
      timestamp: Date.now(),
      avsResponse: avsResponse
    };
    
    await redisClient.pushStringToRedisWithKey(`task:${taskId}`, JSON.stringify(task));
    
    // Add to tasks list
    const tasksList = JSON.parse(await redisClient.getStringKey('tasks:list') || '[]');
    tasksList.push(taskId);
    await redisClient.pushStringToRedisWithKey('tasks:list', JSON.stringify(tasksList));
    
    return {
      success: true,
      taskId: taskId,
      avsResponse: avsResponse
    };
  } catch (error) {
    console.error(`Error executing agent task: ${error.message}`);
    throw error;
  }
}

// Search agents using AI
async function searchAgents(query) {
  try {
    // Get all agents first
    const agents = await getAgents();
    
    if (agents.length === 0) {
      return [];
    }
    
    // Prepare agent data for AI processing
    const agentsWithMetadata = await Promise.all(
      agents.map(async (agent) => {
        // If metadata is an IPFS hash, fetch the content
        if (typeof agent.metadata === 'string' && agent.metadata.startsWith('Qm')) {
          try {
            const metadata = await fetchFromIPFS(agent.metadata);
            return { ...agent, metadataContent: metadata };
          } catch (error) {
            console.warn(`Could not fetch metadata for agent ${agent.address}: ${error.message}`);
            return { ...agent, metadataContent: { error: "Metadata not available" } };
          }
        } else {
          return { ...agent, metadataContent: agent.metadata };
        }
      })
    );
    
    // Use Vercel AI SDK to find the best matching agents
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const prompt = `
      I have a list of AI agents with their capabilities and descriptions.
      I need to find the most suitable agents for the following request: "${query}"
      
      Here are the available agents:
      ${agentsWithMetadata.map((agent, index) => `
        Agent ${index + 1}:
        Address: ${agent.address}
        Description: ${JSON.stringify(agent.metadataContent)}
        Reputation: ${agent.reputation || 'Unknown'}
      `).join('\n')}
      
      Please analyze the request and return the JSON array of the most suitable agents (up to 5) with their addresses and a brief explanation of why they match.
      Format: [{"address": "0x...", "reason": "..."}, ...]
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    
    // Enrich the results with full agent data
    const matchedAgents = result.agents || [];
    const enrichedResults = matchedAgents.map(match => {
      const fullAgent = agentsWithMetadata.find(a => a.address === match.address);
      return {
        ...fullAgent,
        matchReason: match.reason
      };
    });
    
    return enrichedResults;
  } catch (error) {
    console.error(`Error searching agents: ${error.message}`);
    throw error;
  }
}

// Register a new task
async function registerTask(creator, taskType, taskData, payment) {
  try {
    // Store task data on IPFS if it's a complex object
    let taskDataIpfsHash = taskData;
    if (typeof taskData === 'object') {
      taskDataIpfsHash = await storeOnIPFS(taskData);
    }
    
    // Create a unique task ID
    const taskId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Store task in Redis
    const task = {
      id: taskId,
      creator: creator,
      taskType: taskType,
      taskData: taskDataIpfsHash,
      payment: payment.toString(),
      status: 'created',
      timestamp: Date.now()
    };
    
    await redisClient.pushStringToRedisWithKey(`task:${taskId}`, JSON.stringify(task));
    
    // Add to tasks list
    const tasksList = JSON.parse(await redisClient.getStringKey('tasks:list') || '[]');
    tasksList.push(taskId);
    await redisClient.pushStringToRedisWithKey('tasks:list', JSON.stringify(tasksList));
    
    // Find the best agent for this task using AI
    const bestAgent = await findBestAgentForTask(taskType, taskData);
    
    if (bestAgent) {
      // Update task with assigned agent
      task.assignedAgent = bestAgent.address;
      task.status = 'assigned';
      await redisClient.pushStringToRedisWithKey(`task:${taskId}`, JSON.stringify(task));
      
      // Call the agent's endpoint if available
      if (bestAgent.metadataContent && bestAgent.metadataContent.endpoint) {
        try {
          const agentResponse = await axios.post(bestAgent.metadataContent.endpoint, {
            taskId: taskId,
            taskType: taskType,
            taskData: typeof taskData === 'object' ? taskData : JSON.parse(taskData),
            creator: creator
          });
          
          console.log(`Agent ${bestAgent.address} response:`, agentResponse.data);
          
          // Update task with agent response
          task.agentResponse = agentResponse.data;
          await redisClient.pushStringToRedisWithKey(`task:${taskId}`, JSON.stringify(task));
        } catch (error) {
          console.error(`Error calling agent endpoint: ${error.message}`);
          // Still return success but note the error
          task.agentCallError = error.message;
          await redisClient.pushStringToRedisWithKey(`task:${taskId}`, JSON.stringify(task));
        }
      }
    }
    
    return {
      success: true,
      taskId: taskId,
      assignedAgent: bestAgent ? bestAgent.address : null
    };
  } catch (error) {
    console.error(`Error registering task: ${error.message}`);
    throw error;
  }
}

// Find the best agent for a task using AI
async function findBestAgentForTask(taskType, taskData) {
  try {
    // Get all agents
    const agents = await getAgents();
    
    if (agents.length === 0) {
      return null;
    }
    
    // Prepare agent data for AI processing
    const agentsWithMetadata = await Promise.all(
      agents.map(async (agent) => {
        // If metadata is an IPFS hash, fetch the content
        if (typeof agent.metadata === 'string' && agent.metadata.startsWith('Qm')) {
          try {
            const metadata = await fetchFromIPFS(agent.metadata);
            return { ...agent, metadataContent: metadata };
          } catch (error) {
            console.warn(`Could not fetch metadata for agent ${agent.address}: ${error.message}`);
            return { ...agent, metadataContent: { error: "Metadata not available" } };
          }
        } else {
          return { ...agent, metadataContent: agent.metadata };
        }
      })
    );
    
    // Use Vercel AI SDK to find the best matching agent
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const prompt = `
      I have a task that needs to be assigned to the most suitable AI agent.
      
      Task Type: ${taskType}
      Task Data: ${typeof taskData === 'object' ? JSON.stringify(taskData) : taskData}
      
      Here are the available agents:
      ${agentsWithMetadata.map((agent, index) => `
        Agent ${index + 1}:
        Address: ${agent.address}
        Description: ${JSON.stringify(agent.metadataContent)}
        Reputation: ${agent.reputation || 'Unknown'}
      `).join('\n')}
      
      Please analyze the task and return the JSON object with the address of the single most suitable agent and a brief explanation of why they match.
      Format: {"address": "0x...", "reason": "..."}
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    
    // Find the full agent data
    const bestAgent = agentsWithMetadata.find(a => a.address === result.address);
    
    if (bestAgent) {
      return {
        ...bestAgent,
        matchReason: result.reason
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error finding best agent for task: ${error.message}`);
    return null;
  }
}

// Listen for task events and process them
async function setupTaskEventProcessing() {
  console.log("Setting up task event processing...");
  
  // This function will be called by the event listener when a new task is created
  const processNewTask = async (taskId, creator, taskType) => {
    try {
      console.log(`Processing new task: ${taskId.toString()}`);
      
      // Get task details from the contract
      const task = await wwanContract.tasks(taskId);
      
      // Store in Redis
      await redisClient.pushStringToRedisWithKey(
        `task:${taskId.toString()}`, 
        JSON.stringify({
          id: taskId.toString(),
          creator: task.creator,
          taskType: ethers.utils.parseBytes32String(taskType),
          taskData: task.taskData,
          payment: task.payment.toString(),
          status: task.status
        })
      );
      
      // Find the best agent for this task
      const taskData = task.taskData;
      let taskDataContent;
      
      // If taskData is an IPFS hash, fetch the content
      if (taskData.startsWith('Qm')) {
        try {
          taskDataContent = await fetchFromIPFS(taskData);
        } catch (error) {
          console.warn(`Could not fetch task data: ${error.message}`);
          taskDataContent = { error: "Task data not available" };
        }
      } else {
        taskDataContent = taskData;
      }
      
      const bestAgent = await findBestAgentForTask(
        ethers.utils.parseBytes32String(taskType), 
        taskDataContent
      );
      
      if (bestAgent) {
        console.log(`Best agent for task ${taskId.toString()}: ${bestAgent.address}`);
        
        // Call the agent's endpoint if available
        if (bestAgent.metadataContent && bestAgent.metadataContent.endpoint) {
          try {
            const agentResponse = await axios.post(bestAgent.metadataContent.endpoint, {
              taskId: taskId.toString(),
              taskType: ethers.utils.parseBytes32String(taskType),
              taskData: taskDataContent,
              creator: task.creator
            });
            
            console.log(`Agent ${bestAgent.address} response:`, agentResponse.data);
          } catch (error) {
            console.error(`Error calling agent endpoint: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing new task: ${error.message}`);
    }
  };
  
  // Add this to the existing event listeners in initEventListeners
  wwanContract.on("TaskCreated", processNewTask);
  
  console.log("Task event processing setup complete");
}

// Initialize the service
async function initialize() {
  try {
    await initEventListeners();
    await setupTaskEventProcessing();
    console.log("WWAN Service initialized successfully");
  } catch (error) {
    console.error(`Error initializing WWAN Service: ${error.message}`);
    throw error;
  }
}

// Register agent for user with blockchain transaction using operator key
async function registerAgentForUserOnChain(userId, agentId, allowance) {
  try {
    // Use the operator's private key from environment variables
    const operatorPrivateKey = wwanConfig.PRIVATE_KEY_PERFORMER;
    if (!operatorPrivateKey) {
      throw new Error("Operator private key not configured");
    }
    
    // Create a wallet from the operator's private key
    const wallet = new ethers.Wallet(operatorPrivateKey, provider);
    
    // Connect to the contract with the wallet
    const contractWithSigner = wwanContract.connect(wallet);
    
    // Call the contract function to register agent for another user
    console.log(`Registering agent ${agentId} for user ${userId} with allowance ${allowance}`);
    const tx = await contractWithSigner.registerAgentForOtherUser(userId, agentId, allowance);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log(`Transaction confirmed: ${tx.hash}`);
    
    // Also store in Redis for quick lookup
    await registerAgentForUser(userId, agentId, allowance);
    
    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      message: `Agent ${agentId} registered for user ${userId} with allowance ${allowance}`
    };
  } catch (error) {
    console.error(`Error registering agent for user on chain: ${error.message}`);
    throw error;
  }
}

module.exports = {
  initialize,
  getAgents,
  getAgent,
  removeAgent,
  getTasks,
  getTask,
  getAgentInbox,
  sendMessage,
  searchAgents,
  registerAgentForUser,
  registerAgentForUserOnChain,
  getUserAgents,
  executeAgentTask,
  registerTask,
  findBestAgentForTask
};