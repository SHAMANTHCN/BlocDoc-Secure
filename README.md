# BlocDoc Secure

BlocDoc Secure is a secure document management system that allows users to upload, manage, and verify sensitive documents. By using blockchain technology for document verification, BlocDoc Secure ensures data integrity and tamper-proof document storage.

## Features
- User Authentication (JWT-based)
- Secure Document Upload, Download, and Management
- Document Verification through Ethereum Blockchain
- Decentralized Document Storage (IPFS)
- User-Friendly Dashboard for easy document access

## Technology Stack
- **Frontend**: React
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Blockchain**: Ethereum Smart Contracts
- **Storage**: IPFS (InterPlanetary File System)

---

## Setup Instructions

Follow these steps to set up BlocDoc Secure on your local machine.

### Prerequisites
- Node.js and npm installed
- MongoDB installed and running
- Metamask or other Ethereum wallet for blockchain testing
- IPFS Desktop (or a local IPFS node) installed and running

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/blocdoc-secure.git
   cd blocdoc-secure
   
2.Install Backend Dependencies
cd server
npm install

3.Install Frontend Dependencies
cd ../client
npm install

4.Dependencies
Here’s a list of dependencies required to run BlocDoc Secure.

5.Server Dependencies
express: Web framework for Node.js.
mongoose: MongoDB object modeling tool.
jsonwebtoken: For handling JWT authentication.
bcryptjs: For password hashing.
ipfs-http-client: IPFS client for Node.js to interact with IPFS.
web3: Ethereum JavaScript API for blockchain interaction.
Install these dependencies:
"npm install express mongoose jsonwebtoken bcryptjs ipfs-http-client web3"

6.Client Dependencies
react: Frontend library for building user interfaces.
axios: For making HTTP requests from the frontend to the backend.
web3: Ethereum JavaScript API for interacting with blockchain.
Install these dependencies:
"npm install react axios web3"

7.Environment Variables
Create a .env file in the server directory and add the following variables:
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret-key>
INFURA_PROJECT_ID=<your-infura-project-id>
INFURA_PROJECT_SECRET=<your-infura-project-secret>
(Make sure to replace <your-mongodb-connection-string>, <your-jwt-secret-key>, <your-infura-project-id>, and <your-infura-project-secret> with your actual credentials.)

Running the Project
Start the MongoDB server (if not already running).

Start the Backend Server


cd server
npm start
Start the Frontend


cd ../client
npm start
Open your browser and navigate to http://localhost:3000 to access BlocDoc Secure.

Blockchain and IPFS Setup
Ethereum Smart Contract: Deploy the smart contract on Ethereum (or a test network like Rinkeby). Update your client with the deployed contract address.
IPFS: Ensure your IPFS node is running (either locally or using IPFS Desktop).
Future Enhancements
Multi-Factor Authentication (MFA)
Advanced Search and Document Tagging
AI-driven Document Classification and Suggestions
License
This project is licensed under the MIT License.



### Notes
- Replace placeholder values (like `your-username`, `your-mongodb-connection-string`) with actual values specific to your setup.
- Ensure all dependencies are listed to avoid issues when running the project. 

