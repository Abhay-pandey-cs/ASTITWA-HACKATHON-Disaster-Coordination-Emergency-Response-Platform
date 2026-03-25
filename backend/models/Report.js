const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'flood', 'earthquake'
    category: { type: String, enum: ['incident', 'help_request'], default: 'incident' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['pending', 'verified', 'resolved'], default: 'pending' },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    imageUrl: { type: String },
    duplicateCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, { timestamps: true });

reportSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Report', reportSchema);
