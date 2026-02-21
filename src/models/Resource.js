const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'DangerZone', required: false },
    name: { type: String, required: true }, // e.g. "Medical Kit", "Water Bottles", "Ambulance"
    type: { type: String, enum: ['medical', 'food', 'water', 'equipment', 'vehicle', 'shelter'], required: true },
    quantity: { type: Number, default: 1 },
    location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true }
    },
    status: { type: String, enum: ['available', 'reserved', 'depleted'], default: 'available' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

resourceSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Resource', resourceSchema);
