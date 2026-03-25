const mongoose = require('mongoose');

const trackerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true }
    },
    status: { type: String, enum: ['active', 'idle', 'offline'], default: 'active' },
    lastActive: { type: Date, default: Date.now }
});

trackerSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('VolunteerLocation', trackerSchema);
