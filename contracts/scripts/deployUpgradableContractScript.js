const { artifacts, ethers, upgrades } = require('hardhat')
const getNamedSigners = require('../utils/getNamedSigners')
const saveToConfig = require('../utils/saveToConfig')
const readFromConfig = require('../utils/readFromConfig')
const deploySettings = require('./deploySettings')
const deployContract = require('../utils/deployContract')
const { getChain } = require('../utils/chainsHelper')
const deployUpgradableContract = require('../utils/deployUpgradableContract')


const getDeployHelpers = async () => {
  const chainId = await hre.getChainId()
  const CHAIN_NAME = getChain(chainId).name
  const {payDeployer} =  await getNamedSigners();
  return {chainId, CHAIN_NAME, payDeployer}
}

async function main () {

  const deployHelpers = await getDeployHelpers();

  await deployUpgradableContract(hre, deployHelpers.chainId, "WWANProtocol", deployHelpers.payDeployer, ["0x3C2929a096a2fB83Ab09984a7349a02Ea4B52dE1"])
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
