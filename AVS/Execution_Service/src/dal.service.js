require('dotenv').config();
const pinataSDK = require("@pinata/sdk");
const { ethers, AbiCoder } = require('ethers');
const axios = require("axios");

var pinataApiKey='';
var pinataSecretApiKey='';
var rpcBaseAddress='';
var privateKey='';
var ipfsHost='';


function init() {
  pinataApiKey = process.env.PINATA_API_KEY;
  pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
  rpcBaseAddress = process.env.OTHENTIC_CLIENT_RPC_ADDRESS;
  privateKey = process.env.PRIVATE_KEY_PERFORMER;
  ipfsHost = process.env.IPFS_HOST;

}

async function sendTask(proofOfTask, data, taskDefinitionId) {

  var wallet = new ethers.Wallet(privateKey);
  var performerAddress = wallet.address;

  data = ethers.hexlify(ethers.toUtf8Bytes(data));
  const message = ethers.AbiCoder.defaultAbiCoder().encode(["string", "bytes", "address", "uint16"], [proofOfTask, data, performerAddress, taskDefinitionId]);
  const messageHash = ethers.keccak256(message);
  const sig = wallet.signingKey.sign(messageHash).serialized;

  const jsonRpcBody = {
    jsonrpc: "2.0",
    method: "sendTask",
    params: [
      proofOfTask,
      data,
      taskDefinitionId,
      performerAddress,
      sig,
    ]
  };
    try {
      const provider = new ethers.JsonRpcProvider(rpcBaseAddress);
      const response = await provider.send(jsonRpcBody.method, jsonRpcBody.params);
      console.log("API response:", response);
  } catch (error) {
      console.error("Error making API request:", error);
  }
}

// async function publishJSONToIpfs(data) {
//   var proofOfTask = '';
//   try {   
//     const pinata = new pinataSDK(pinataApiKey, pinataSecretApiKey);
//     const response = await pinata.pinJSONToIPFS(data);
//     proofOfTask = response.IpfsHash;
//     console.log(`proofOfTask: ${proofOfTask}`);
//   }
//   catch (error) {  
//     console.error("Error making API request to pinataSDK:", error);
//   }
//   return proofOfTask;
// }

async function publishJSONToIpfs(data) {
  var metadataHash = '';
  try {   
    const pinata = new pinataSDK(pinataApiKey, pinataSecretApiKey);
    const response = await pinata.pinJSONToIPFS(data);
    metadataHash = response.IpfsHash;
    console.log(`metadataHash: ${metadataHash}`);
  }
  catch (error) {  
    console.error("Error making API request to pinataSDK:", error);
  }
  return metadataHash;
}


async function getIpfsData(cid) {
  console.log("Getting IPFS data for cid:", cid);
  try{
    const { data } = await axios.get(ipfsHost + '/ipfs/' + cid);
    console.log("IPFS data:", data);
    return data;
  }catch(error) {
    console.error("Error fetching IPFS data:", error);
  }
  
}  
  

module.exports = {
  init,
  publishJSONToIpfs,
  sendTask,
  getIpfsData
}
