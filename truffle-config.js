const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

const privateKey = '0x032eb32464f639048b76c7bc68019be9541424cdfbb4a6922cc7bd27d078c5dd';
const ganacheUrl = 'http://127.0.0.1:8545'; // Default Ganache GUI URL

const mnemonic = process.env.MNEMONIC;
const alchemyApiKey = process.env.ALCHEMY_API_KEY;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      from: "0x3933fE09231Ac560afD9Add0c878995Ff271B42D",
      gas: 6721975,
      gasPrice: 20000000000
    },
    goerli: {
      provider: () => {
        if (!mnemonic) {
          throw new Error('Please set your MNEMONIC in a .env file');
        }
        if (!alchemyApiKey) {
          throw new Error('Please set your ALCHEMY_API_KEY in a .env file');
        }
        const providerUrl = `https://eth-goerli.alchemyapi.io/v2/${alchemyApiKey}`;
        console.log('Connecting to Goerli testnet via:', providerUrl);
        return new HDWalletProvider(mnemonic, providerUrl);
      },
      network_id: 5,       // Goerli's id
      confirmations: 2,    // # of confirmations to wait between deployments
      timeoutBlocks: 200,  // # of blocks before a deployment times out
      skipDryRun: true,    // Skip dry run before migrations
      networkCheckTimeout: 10000, // Increase from the default of 5000
    },
  },

  compilers: {
    solc: {
      version: "0.8.21",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
};
