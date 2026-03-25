const VolunteerLocation = require('../models/VolunteerLocation');
const Resource = require('../models/Resource');

// Volunteer Tracking Route
exports.updateLocation = async (req, res) => {
    try {
        const { coordinates } = req.body; // [lng, lat]
        const userId = req.user.id;

        // Ensure user is volunteer
        if (req.user.role !== 'volunteer') {
            return res.status(403).json({ message: "Only volunteers can broadcast location." });
        }

        let loc = await VolunteerLocation.findOneAndUpdate(
            { userId },
            {
                location: { type: "Point", coordinates },
                lastActive: Date.now()
            },
            { upsert: true, new: true }
        ).populate('userId', 'name trustScore');

        // Broadcast active volunteer to web sockets
        if (req.app.get('io')) {
            req.app.get('io').emit("volunteerMoved", loc);
        }

        res.json(loc);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getVolunteers = async (req, res) => {
    try {
        // Find volunteers active in the last 15 minutes
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const volunteers = await VolunteerLocation.find({ lastActive: { $gte: fifteenMinsAgo } })
            .populate('userId', 'name');

        res.json(volunteers);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Resources Route
exports.addResource = async (req, res) => {
    try {
        const { name, type, quantity, coordinates } = req.body;
        const resource = new Resource({
            name, type, quantity,
            location: { type: 'Point', coordinates },
            addedBy: req.user.id
        });
        await resource.save();

        if (req.app.get('io')) {
            req.app.get('io').emit("newResource", resource);
        }
        res.status(201).json(resource);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.getResources = async (req, res) => {
    try {
        const resources = await Resource.find({ status: 'available' });
        res.json(resources);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};
