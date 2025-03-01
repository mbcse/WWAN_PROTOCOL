require('dotenv').config();
const axios = require("axios");
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

let ipfsHost = '';
let ipfsApiHost = '';
let ipfsApiKey = '';

function init() {
  ipfsHost = process.env.IPFS_HOST;
  ipfsApiHost = process.env.IPFS_API_HOST || 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  ipfsApiKey = process.env.IPFS_API_KEY;
}

async function getIPfsTask(cid) {
  try {
    const { data } = await axios.get(ipfsHost + cid);
    
    // Handle different types of task data
    if (data.symbol && data.price) {
      return {
        symbol: data.symbol,
        price: parseFloat(data.price),
      };
    } else if (data.taskResult) {
      return data.taskResult;
    } else {
      return data;
    }
  } catch (error) {
    console.error(`Error fetching from IPFS: ${error.message}`);
    throw error;
  }
}

async function storeOnIPFS(data) {
  try {
    // If we have Pinata API key, use it
    if (ipfsApiKey) {
      const response = await axios.post(
        ipfsApiHost,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': ipfsApiKey,
            'pinata_secret_api_key': process.env.IPFS_API_SECRET
          }
        }
      );
      
      return response.data.IpfsHash;
    } else {
      // Fallback to local IPFS node if available
      const formData = new FormData();
      
      // Create a temporary file with the JSON data
      const tempFilePath = path.join(__dirname, `temp_${Date.now()}.json`);
      fs.writeFileSync(tempFilePath, JSON.stringify(data));
      
      // Add the file to the form data
      formData.append('file', fs.createReadStream(tempFilePath));
      
      // Post to IPFS
      const response = await axios.post(
        `${ipfsHost}/api/v0/add`,
        formData,
        {
          headers: formData.getHeaders()
        }
      );
      
      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
      
      return response.data.Hash;
    }
  } catch (error) {
    console.error(`Error storing on IPFS: ${error.message}`);
    
    // Fallback to simulated IPFS hash for development
    if (process.env.NODE_ENV !== 'production') {
      const randomHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      console.log(`[DEV] Simulated IPFS hash: ${randomHash}`);
      return randomHash;
    }
    
    throw error;
  }
}

module.exports = {
  init,
  getIPfsTask,
  storeOnIPFS
};