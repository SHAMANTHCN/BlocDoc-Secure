const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const { create } = require('ipfs-http-client');
const fetch = require('node-fetch');
const { Network, Alchemy } = require("alchemy-sdk");
const { getLatestBlockNumber, verifyDocument, isDocumentVerified, getEthereumPrice } = require('./blockchain.js');

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// IPFS setup
let ipfs;

// Alchemy SDK setup
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(settings);

const contractABI = []; // Add your contract ABI here
const contractAddress = ''; // Add your deployed contract address here

async function setupIpfs() {
  try {
    ipfs = create({ 
      host: '127.0.0.1',
      port: 5002,
      protocol: 'http',
      fetch: fetch
    });
    await checkIpfsConnection();
    console.log('Connected to local IPFS daemon successfully');
  } catch (error) {
    console.error('Failed to set up IPFS:', error);
    console.log('Continuing without IPFS. Some features may not work.');
  }
}

// IPFS connection check
async function checkIpfsConnection() {
  try {
    const version = await ipfs.version();
    console.log('Connected to IPFS version:', version.version);
  } catch (error) {
    console.error('Failed to connect to IPFS:', error);
    throw error;
  }
}

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.set('strictQuery', false); // Add this line to address the deprecation warning

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Document Schema
const documentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  ipfsHash: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileSize: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  shared: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  verified: { type: Boolean, default: false }
});

const Document = mongoose.model('Document', documentSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Document History Schema
const documentHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  type: { type: String, required: true },
  fileName: { type: String, required: true },
  ipfsHash: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const DocumentHistory = mongoose.model('DocumentHistory', documentHistorySchema);

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Authentication middleware
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// Helper function to create a notification
async function createNotification(userId, type, title, message) {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message
    });
    await notification.save();
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Helper function to create a document history entry
async function createDocumentHistoryEntry(userId, documentId, type, fileName, ipfsHash) {
  try {
    const historyEntry = new DocumentHistory({
      userId,
      documentId,
      type,
      fileName,
      ipfsHash
    });
    await historyEntry.save();
  } catch (error) {
    console.error('Error creating document history entry:', error);
  }
}

// Signup Route
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ email: newUser.email, id: newUser._id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ email: user.email, id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// File Upload Route
app.post('/api/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    console.log('Attempting to upload file to IPFS...');
    const fileBuffer = req.file.buffer;
    const result = await ipfs.add(fileBuffer);
    const ipfsHash = result.path;
    console.log('File uploaded to IPFS successfully. Hash:', ipfsHash);

    const newDocument = new Document({
      fileName: req.file.originalname,
      ipfsHash: ipfsHash,
      userId: req.userId,
      fileSize: req.file.size
    });

    await newDocument.save();
    console.log('Document saved to database:', newDocument);

    // Create a document history entry
    await createDocumentHistoryEntry(req.userId, newDocument._id, 'upload', newDocument.fileName, ipfsHash);

    // Create a notification for the upload
    await createNotification(
      req.userId,
      'upload',
      'File Uploaded',
      `Your file ${req.file.originalname} has been uploaded successfully. IPFS Hash: ${ipfsHash}`
    );

    res.status(200).json({ message: 'File uploaded and saved to IPFS.', file: newDocument });
  } catch (error) {
    console.error('Detailed error uploading to IPFS:', error);
    res.status(500).json({ error: 'Error uploading to IPFS.', details: error.message });
  }
});

// Get List of Files (with search functionality)
app.get('/api/documents', auth, async (req, res) => {
  try {
    const { q, type, date } = req.query;
    let query = { userId: req.userId };

    if (q) {
      query.fileName = { $regex: q, $options: 'i' };
    }

    if (type) {
      query.fileName = { $regex: `\\.${type}$`, $options: 'i' };
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.uploadDate = { $gte: startDate, $lt: endDate };
    }

    const documents = await Document.find(query).sort({ uploadDate: -1 });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching file list:', error);
    res.status(500).json({ error: 'Error fetching file list.' });
  }
});

// Delete File Route
app.delete('/api/documents/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!document) {
      return res.status(404).json({ error: 'File not found.' });
    }

    // Create a document history entry
    await createDocumentHistoryEntry(req.userId, document._id, 'delete', document.fileName, document.ipfsHash);

    // Create a notification for the deletion
    await createNotification(
      req.userId,
      'delete',
      'File Deleted',
      `Your file ${document.fileName} has been deleted.`
    );

    res.json({ message: 'File reference deleted successfully.' });
  } catch (error) {
    console.error('Error deleting file reference:', error);
    res.status(500).json({ error: 'Error deleting file reference.' });
  }
});

// Share File Route
app.post('/api/share/:id', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const userToShare = await User.findOne({ email });
    if (!userToShare) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { 
        shared: true,
        $addToSet: { sharedWith: userToShare._id }
      },
      { new: true }
    );
    if (!document) {
      return res.status(404).json({ error: 'File not found.' });
    }

    // Create a document history entry
    await createDocumentHistoryEntry(req.userId, document._id, 'share', document.fileName, document.ipfsHash);

    // Create a notification for the user who received the shared document
    await createNotification(
      userToShare._id,
      'share',
      'New Document Shared',
      `A document has been shared with you: ${document.fileName}`
    );

    // Create a notification for the user who shared the document
    await createNotification(
      req.userId,
      'share',
      'Document Shared',
      `You have shared the document ${document.fileName} with ${email}.`
    );

    res.json({ message: 'File shared successfully.' });
  } catch (error) {
    console.error('Error sharing file:', error);
    res.status(500).json({ error: 'Error sharing file.' });
  }
});

// Verify File Route
app.post('/api/verify/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.userId });
    if (!document) {
      return res.status(404).json({ error: 'File not found.' });
    }

    // Verify document on the blockchain
    await verifyDocument(contractAddress, contractABI, document.ipfsHash);

    document.verified = true;
    await document.save();

    // Create a document history entry
    await createDocumentHistoryEntry(req.userId, document._id, 'verify', document.fileName, document.ipfsHash);

    // Create a notification for the verification
    await createNotification(
      req.userId,
      'verify',
      'Document Verified',
      `Your document ${document.fileName} has been verified on the blockchain. IPFS Hash: ${document.ipfsHash}`
    );

    res.json({ message: 'File verified successfully on the blockchain.' });
  } catch (error) {
    console.error('Error verifying file:', error);
    res.status(500).json({ error: 'Error verifying file.' });
  }
});

// Recent Activity Route
app.get('/api/recent-activity', auth, async (req, res) => {
  try {
    const activities = await DocumentHistory.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(5);
    
    const formattedActivities = activities.map(activity => ({
      type: activity.type,
      description: `${activity.fileName} was ${activity.type}d`,
      date: activity.date,
      ipfsHash: activity.ipfsHash
    }));

    res.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Error fetching recent activity.' });
  }
});

// Get Shared Documents
app.get('/api/shared-documents', auth, async (req, res) => {
  try {
    const sharedWithYou = await Document.find({ sharedWith: req.userId })
      .populate('userId', 'email')
      .sort({ uploadDate: -1 });

    const sharedByYou = await Document.find({ userId: req.userId, shared: true })
      .populate('sharedWith', 'email')
      .sort({ uploadDate: -1 });

    res.json({
      sharedWithYou: sharedWithYou.map(doc =>   ({
        _id: doc._id,
        fileName: doc.fileName,
        sharedBy: doc.userId.email,
        dateShared: doc.uploadDate,
        ipfsHash: doc.ipfsHash
      })),
      sharedByYou: sharedByYou.map(doc => ({
        _id: doc._id,
        fileName: doc.fileName,
        sharedWith: doc.sharedWith.map(user => user.email).join(', '),
        dateShared: doc.uploadDate,
        ipfsHash: doc.ipfsHash
      }))
    });
  } catch (error) {
    console.error('Error fetching shared documents:', error);
    res.status(500).json({ error: 'Error fetching shared documents.' });
  }
});

// View Document
app.get('/api/documents/:id/view', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      $or: [{ userId: req.userId }, { sharedWith: req.userId }]
    });

    if (!document) {
      return res.status(404).json({ error: 'File not found or you do not have permission to view it.' });
    }

    const chunks = [];
    for await (const chunk of ipfs.cat(document.ipfsHash)) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({ error: 'Error viewing document.' });
  }
});

// Download Document
app.get('/api/documents/:id/download', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      $or: [{ userId: req.userId }, { sharedWith: req.userId }]
    });

    if (!document) {
      return res.status(404).json({ error: 'File not found or you do not have permission to download it.' });
    }

    const chunks = [];
    for await (const chunk of ipfs.cat(document.ipfsHash)) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Error downloading document.' });
  }
});

// Fetch Notifications Route
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error fetching notifications.' });
  }
});

// Revoke Access
app.post('/api/documents/:id/revoke-access', auth, async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { 
        $set: { shared: false },
        $unset: { sharedWith: 1 }
      },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ error: 'File not found or you do not have permission to revoke access.' });
    }

    // Create a document history entry
    await createDocumentHistoryEntry(req.userId, document._id, 'revoke', document.fileName, document.ipfsHash);

    // Create a notification for revoking access
    await createNotification(
      req.userId,
      'revoke',
      'Access Revoked',
      `You have revoked access to the document ${document.fileName}.`
    );

    res.json({ message: 'Access revoked successfully.' });
  } catch (error) {
    console.error('Error revoking access:', error);
    res.status(500).json({ error: 'Error revoking access.' });
  }
});

// Get Document History
app.get('/api/document-history', auth, async (req, res) => {
  try {
    const history = await DocumentHistory.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(10);  // Limit to the last 10 entries

    res.json(history);
  } catch (error) {
    console.error('Error fetching document history:', error);
    res.status(500).json({ error: 'Error fetching document history.' });
  }
});

// Start the server
async function startServer() {
  try {
    await setupIpfs();
    await mongoose.connect('mongodb://localhost:27017/blocdoc');
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;