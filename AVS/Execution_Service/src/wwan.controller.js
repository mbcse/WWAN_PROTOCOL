"use strict";
const { Router } = require("express");
const CustomError = require("./utils/validateError");
const CustomResponse = require("./utils/validateResponse");
const wwanService = require("./wwan.service");

const router = Router();

// Initialize WWAN service when the server starts
(async () => {
  try {
    await wwanService.initialize();
    console.log("WWAN service initialized successfully");
  } catch (error) {
    console.error(`Failed to initialize WWAN service: ${error.message}`);
  }
})();

// Get all agents
router.get("/agents", async (req, res) => {
  try {
    const agents = await wwanService.getAgents();
    return res.status(200).send(new CustomResponse(agents));
  } catch (error) {
    console.error(error);
    return res.status(500).send(new CustomError("Something went wrong", {}));
  }
});

// Register agent for user with blockchain transaction using operator key
router.post("/users/:userId/agents/onchain", async (req, res) => {
  try {
    const { userId } = req.params;
    const { agentId, allowance } = req.body;
    
    if (!agentId || allowance === undefined) {
      return res.status(400).send(new CustomError("Missing required fields", {}));
    }
    
    const result = await wwanService.registerAgentForUserOnChain(userId, agentId, allowance);
    return res.status(201).send(new CustomResponse(result));
  } catch (error) {
    console.error(error);
    if (error.message.includes("insufficient funds")) {
      return res.status(400).send(new CustomError("Insufficient funds for transaction", {}));
    }
    return res.status(500).send(new CustomError("Something went wrong", { error: error.message }));
  }
});

// Send message to agent
router.post("/agents/:agentId/message", async (req, res) => {
  const { agentId } = req.params;
  const { message, signature } = req.body;
  
  console.log(`Sending message to agent: ${agentId}`);
  
  if (!message || !signature) {
    return res.status(400).send(new CustomError("Message and signature are required", {}));
  }
  
  try {
    const result = await wwanService.sendMessage(agentId, message, signature);
    return res.status(200).send(new CustomResponse(result, "Message sent successfully"));
  } catch (error) {
    console.error(`Error sending message: ${error.message}`);
    if (error.message.includes("not found")) {
      return res.status(404).send(new CustomError("Agent not found", { agentId }));
    }
    if (error.message.includes("Invalid signature")) {
      return res.status(401).send(new CustomError("Invalid signature", {}));
    }
    return res.status(500).send(new CustomError("Failed to send message", { error: error.message }));
  }
});

// Get agent by ID
router.get("/agents/:id", async (req, res) => {
  try {
    const agent = await wwanService.getAgent(req.params.id);
    return res.status(200).send(new CustomResponse(agent));
  } catch (error) {
    console.error(error);
    if (error.message.includes("not found")) {
      return res.status(404).send(new CustomError(error.message, {}));
    }
    return res.status(500).send(new CustomError("Something went wrong", {}));
  }
});

// Search agents using AI
router.post("/agents/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).send(new CustomError("Query is required", {}));
    }
    
    const agents = await wwanService.searchAgents(query);
    return res.status(200).send(new CustomResponse(agents));
  } catch (error) {
    console.error(error);
    return res.status(500).send(new CustomError("Something went wrong", {}));
  }
});

// Register a new task
router.post("/tasks", async (req, res) => {
  try {
    const { creator, taskType, taskData, payment } = req.body;
    
    if (!creator || !taskType || !taskData || !payment) {
      return res.status(400).send(new CustomError("Missing required fields", {}));
    }
    
    const result = await wwanService.registerTask(creator, taskType, taskData, payment);
    return res.status(201).send(new CustomResponse(result));
  } catch (error) {
    console.error(error);
    return res.status(500).send(new CustomError("Something went wrong", {}));
  }
});

// Get all tasks
router.get("/tasks", async (req, res) => {
  try {
    const tasks = await wwanService.getTasks();
    return res.status(200).send(new CustomResponse(tasks));
  } catch (error) {
    console.error(error);
    return res.status(500).send(new CustomError("Something went wrong", {}));
  }
});

// Get task by ID
router.get("/tasks/:id", async (req, res) => {
  try {
    const task = await wwanService.getTask(req.params.id);
    return res.status(200).send(new CustomResponse(task));
  } catch (error) {
    console.error(error);
    if (error.message.includes("not found")) {
      return res.status(404).send(new CustomError(error.message, {}));
    }
    return res.status(500).send(new CustomError("Something went wrong", {}));
  }
});



// Get user's agents
router.get("/users/:userId/agents", async (req, res) => {
  try {
    const { userId } = req.params;
    const agents = await wwanService.getUserAgents(userId);
    return res.status(200).send(new CustomResponse(agents));
  } catch (error) {
    console.error(error);
    return res.status(500).send(new CustomError("Something went wrong", {}));
  }
});

// Execute task via agent
router.post("/users/:userId/agents/:agentId/execute", async (req, res) => {
  try {
    const { userId, agentId } = req.params;
    const { taskType, taskData } = req.body;
    
    if (!taskType || !taskData) {
      return res.status(400).send(new CustomError("Missing required fields", {}));
    }
    
    const result = await wwanService.executeAgentTask(userId, agentId, taskType, taskData);
    return res.status(201).send(new CustomResponse(result));
  } catch (error) {
    console.error(error);
    return res.status(500).send(new CustomError("Something went wrong", {}));
  }
});



// Get agent's inbox
router.get("/agents/:agentId/inbox", async (req, res) => {
  const { agentId } = req.params;
  console.log(`Getting inbox for agent: ${agentId}`);
  
  try {
    const inbox = await wwanService.getAgentInbox(agentId);
    return res.status(200).send(new CustomResponse(inbox, "Inbox retrieved successfully"));
  } catch (error) {
    console.error(`Error getting inbox: ${error.message}`);
    if (error.message.includes("not found")) {
      return res.status(404).send(new CustomError("Agent not found", { agentId }));
    }
    return res.status(500).send(new CustomError("Failed to retrieve inbox", { error: error.message }));
  }
});

// Callback endpoint for AVS task status updates
router.post("/tasks/:taskId/status", async (req, res) => {
  const { taskId } = req.params;
  const statusUpdate = req.body;
  
  console.log(`Received status update for task ${taskId}: ${JSON.stringify(statusUpdate)}`);
  
  try {
    // Update task status in Redis
    const taskJson = await wwanService.getTask(taskId);
    if (taskJson) {
      const task = JSON.parse(JSON.stringify(taskJson));
      task.status = statusUpdate.status;
      task.statusUpdate = statusUpdate;
      task.lastUpdated = Date.now();
      
      await redisClient.pushStringToRedisWithKey(`task:${taskId}`, JSON.stringify(task));
      
      return res.status(200).send(new CustomResponse({ success: true }, "Task status updated successfully"));
    } else {
      return res.status(404).send(new CustomError("Task not found", { taskId }));
    }
  } catch (error) {
    console.error(`Error updating task status: ${error.message}`);
    return res.status(500).send(new CustomError("Failed to update task status", { error: error.message }));
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  return res.status(200).send(new CustomResponse({ status: "healthy" }, "WWAN service is running"));
});

module.exports = router; 