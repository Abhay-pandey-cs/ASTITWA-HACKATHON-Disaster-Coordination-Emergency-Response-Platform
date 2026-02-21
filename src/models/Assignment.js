const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['assigned', 'en-route', 'completed'], default: 'assigned' },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
