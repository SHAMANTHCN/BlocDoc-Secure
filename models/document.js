const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    fileName: String,
    filePath: String,
    uploadDate: { type: Date, default: Date.now },
    shared: { type: Boolean, default: false },
    verified: { type: Boolean, default: false }
});

module.exports = mongoose.model('Document', documentSchema);
