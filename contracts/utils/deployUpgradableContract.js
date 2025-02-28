const { artifacts, ethers, upgrades } = require('hardhat')
const getNamedSigners = require('./getNamedSigners')
const saveToConfig = require('./saveToConfig')
const readFromConfig = require('./readFromConfig')
const { getChain } = require('./chainsHelper')

const deployUpgradableContract = async (hre, chainId, contractName, deployer, initializerParams) => {
    const chainInfo = getChain(chainId)
    const Contract = await ethers.getContractFactory(contractName)
    Contract.connect(deployer)

    const contractABI = (await artifacts.readArtifact(contractName)).abi
    await saveToConfig(contractName, 'ABI', contractABI, chainId)

    console.log(`Deployig contract ${contractName} to ${chainInfo.name} using deployer address ${deployer.address}`)
    const contractInstance = await upgrades.deployProxy(Contract, initializerParams, { initializer: 'initialize', kind: 'uups' })
    let tx = await contractInstance.deployed()

    await saveToConfig(contractName, 'ADDRESS', contractInstance.address, chainId)

    let implementationAddress = await upgrades.erc1967.getImplementationAddress(contractInstance.address)

console.log(`!-------Deploy Info----------!
Contract Name: ${contractName}
Chain: ${chainInfo.name}
ChainId: ${chainId}
Deployment Transaction hash : ${tx.deployTransaction.hash}
Deployed Proxy Contract Address: ${contractInstance.address}
Deployed Implementation Contract Address: ${implementationAddress}
!----------------------------!`)
}

module.exports = deployUpgradableContract