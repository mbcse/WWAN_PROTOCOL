"use strict";
const { Router } = require("express");
const CustomError = require("../../Execution_Service/src/utils/validateError");
const CustomResponse = require("../../Execution_Service/src/utils/validateResponse");
const signatureValidator = require("./signature.validator");

const router = Router();

// Validate agent signature
router.post("/validate/signature", async (req, res) => {
  try {
    const { agentId, message, signature } = req.body;
    
    if (!agentId || !message || !signature) {
      return res.status(400).send(new CustomError("Missing required fields", {}));
    }
    
    const isValid = await signatureValidator.validateAgentSignature(agentId, message, signature);
    
    return res.status(200).send(new CustomResponse({ isValid }, 
      isValid ? "Signature is valid" : "Signature is invalid"));
  } catch (error) {
    console.error(error);
    return res.status(500).send(new CustomError("Something went wrong", { error: error.message }));
  }
});

// Validate task result
router.post("/validate/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { ipfsHash, agentId, signature } = req.body;
    
    if (!ipfsHash || !agentId || !signature) {
      return res.status(400).send(new CustomError("Missing required fields", {}));
    }
    
    const result = await signatureValidator.validateTaskResult(taskId, ipfsHash, agentId, signature);
    
    if (result.success) {
      return res.status(200).send(new CustomResponse(result, "Task result validated successfully"));
    } else {
      return res.status(400).send(new CustomError("Task validation failed", result));
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send(new CustomError("Something went wrong", { error: error.message }));
  }
});

// Verify EigenLayer proof
router.post("/verify/proof/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { proof } = req.body;
    
    if (!proof) {
      return res.status(400).send(new CustomError("Proof is required", {}));
    }
    
    const result = await signatureValidator.verifyEigenLayerProof(taskId, proof);
    
    if (result.success) {
      return res.status(200).send(new CustomResponse(result, "EigenLayer proof verified successfully"));
    } else {
      return res.status(400).send(new CustomError("Proof verification failed", result));
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send(new CustomError("Something went wrong", { error: error.message }));
  }
});

// Generate EigenLayer proof
router.post("/generate/proof/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { result } = req.body;
    
    if (!result) {
      return res.status(400).send(new CustomError("Result is required", {}));
    }
    
    const proofResult = await signatureValidator.generateEigenLayerProof(taskId, result);
    
    if (proofResult.success) {
      return res.status(200).send(new CustomResponse(proofResult, "EigenLayer proof generated successfully"));
    } else {
      return res.status(400).send(new CustomError("Proof generation failed", proofResult));
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send(new CustomError("Something went wrong", { error: error.message }));
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  return res.status(200).send(new CustomResponse({ status: "healthy" }, "Signature validation service is running"));
});

module.exports = router; 