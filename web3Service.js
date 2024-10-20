// web3Service.js
const { create } = require('ipfs-http-client');

// Create an IPFS client
const ipfs = create({
  host: 'ipfs.infura.io',   // You can use a public IPFS gateway (like Infura)
  port: 5001,
  protocol: 'https',
});

// Function to upload file to IPFS
async function uploadToIPFS(file) {
  try {
    const added = await ipfs.add(file);
    const ipfsHash = added.path;
    return ipfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

// Function to retrieve file from IPFS
async function getFileFromIPFS(ipfsHash) {
  try {
    const file = await ipfs.cat(ipfsHash);
    return file;
  } catch (error) {
    console.error('Error retrieving file from IPFS:', error);
    throw error;
  }
}

module.exports = {
  uploadToIPFS,
  getFileFromIPFS,
};
