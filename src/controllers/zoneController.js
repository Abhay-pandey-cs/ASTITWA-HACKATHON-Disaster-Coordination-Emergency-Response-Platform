const DangerZone = require('../models/DangerZone');

exports.createZone = async (req, res) => {
    try {
        const { name, description, severity, coordinates } = req.body;

        const newZone = new DangerZone({
            name,
            description,
            severity,
            area: {
                type: 'Polygon',
                coordinates
            },
            createdBy: req.user.id
        });

        await newZone.save();

        if (req.app.get('io')) {
            req.app.get('io').emit("newDangerZone", newZone);
        }

        res.status(201).json(newZone);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getZones = async (req, res) => {
    try {
        const zones = await DangerZone.find();
        res.json(zones);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};
