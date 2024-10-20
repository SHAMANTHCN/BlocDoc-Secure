const Web3 = require('web3');
const { Network, Alchemy } = require("alchemy-sdk");
require('dotenv').config();

// Alchemy SDK setup
const settings = {
  apiKey: "XYVbpIz5Q6GX-yPeENJeKL1688oAARDM",
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(settings);

// Function to get the latest block number
async function getLatestBlockNumber() {
  try {
    const latestBlock = await alchemy.core.getBlockNumber();
    console.log('Latest block number:', latestBlock);
    return latestBlock;
  } catch (error) {
    console.error('Error fetching latest block number:', error);
    throw error;
  }
}

// Function to verify a document on the blockchain
async function verifyDocument(contractAddress, contractABI, documentHash) {
  try {
    // Create a new instance of the contract
    const contract = await alchemy.core.getContract(contractAddress, contractABI);
    
    // Get the signer (you'll need to implement a way to get the signer's address)
    const signer = await alchemy.core.getSigners()[0];
    
    // Call the verifyDocument function on the contract
    const result = await contract.connect(signer).verifyDocument(documentHash);
    
    console.log('Document verified on blockchain:', result);
    return result;
  } catch (error) {
    console.error('Error verifying document on blockchain:', error);
    throw error;
  }
}

// Function to check if a document is verified
async function isDocumentVerified(contractAddress, contractABI, documentHash) {
  try {
    // Create a new instance of the contract
    const contract = await alchemy.core.getContract(contractAddress, contractABI);
    
    // Call the isDocumentVerified function on the contract
    const result = await contract.isDocumentVerified(documentHash);
    
    console.log('Is document verified:', result);
    return result;
  } catch (error) {
    console.error('Error checking document verification:', error);
    throw error;
  }
}

// Function to get the current gas price
async function getEthereumPrice() {
  try {
    const gasPrice = await alchemy.core.getGasPrice();
    const gasPriceGwei = alchemy.utils.formatUnits(gasPrice, 'gwei');
    console.log('Current gas price:', gasPriceGwei, 'Gwei');
    return gasPriceGwei;
  } catch (error) {
    console.error('Error fetching Ethereum gas price:', error);
    throw error;
  }
}

// Export functions for use in other parts of the application
module.exports = {
  getLatestBlockNumber,
  verifyDocument,
  isDocumentVerified,
  getEthereumPrice
};
