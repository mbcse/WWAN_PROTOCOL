const { artifacts, ethers } = require('hardhat')
const getNamedSigners = require('./getNamedSigners')
const saveToConfig = require('./saveToConfig')
const readFromConfig = require('./readFromConfig')
const { getChain } = require('./chainsHelper')

const deployContract = async (hre, chainId, contractName, deployer, constructorParams) => {
    const chainInfo = getChain(chainId)
    const Contract = await ethers.getContractFactory(contractName)
    Contract.connect(deployer)

    const contractABI = (await artifacts.readArtifact(contractName)).abi
    await saveToConfig(contractName, 'ABI', contractABI, chainId)

    console.log(`Deployig contract ${contractName} to ${chainInfo.name} using deployer address ${deployer.address}`)
    const contractInstance = await Contract.deploy(...constructorParams)
    let tx = await contractInstance.deployed()
    await saveToConfig(contractName, 'ADDRESS', contractInstance.address, chainId)

console.log(`!-------Deploy Info----------!
Contract Name: ${contractName}
Chain: ${chainInfo.name}
ChainId: ${chainId}
Deployment Transaction hash : ${tx.deployTransaction.hash}
Deployed Contract Address: ${contractInstance.address}
!----------------------------!`)

    return contractInstance.address
}

module.exports = deployContract