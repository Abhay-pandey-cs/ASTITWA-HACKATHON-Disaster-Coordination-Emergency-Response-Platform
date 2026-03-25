const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ["citizen", "volunteer", "authority", "admin"],
        default: "citizen"
    },
    location: {
        type: { type: String, enum: ["Point"] },
        coordinates: { type: [Number] }
    },
    trustScore: { type: Number, default: 50 },
}, { timestamps: true })

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema)
