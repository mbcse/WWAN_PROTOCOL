const { task } = require("hardhat/config");
const { ethers } = require("ethers");

module.exports = task("generateAddress", "Generates a new Ethereum address with private key", async (taskArgs, hre) => {
// Create a new random wallet
const wallet = ethers.Wallet.createRandom();

console.log('New Ethereum Address Generated:');
console.log('----------------------------');
console.log(`Address:     ${wallet.address}`);
console.log(`Private Key: ${wallet.privateKey}`);
console.log(`Mnemonic:    ${wallet.mnemonic.phrase}`);
console.log('----------------------------');
console.log('IMPORTANT: Save this information securely!');
})