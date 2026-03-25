const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['danger', 'safe'], default: 'danger' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'high' },
    area: {
        type: {
            type: String,
            enum: ['Polygon'],
            required: true
        },
        coordinates: {
            type: [[[Number]]], // Array of arrays of arrays of numbers for Polygon
            required: true
        }
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

zoneSchema.index({ area: "2dsphere" });

module.exports = mongoose.model('DangerZone', zoneSchema);
