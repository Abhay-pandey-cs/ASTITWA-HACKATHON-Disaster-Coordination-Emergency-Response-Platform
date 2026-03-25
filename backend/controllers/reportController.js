const Report = require('../models/Report');

exports.createReport = async (req, res) => {
    try {
        const { title, description, type, category, severity, coordinates, imageUrl } = req.body;

        // 3.3 - Duplicate Detection Logic
        const nearbyDuplicates = await Report.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: coordinates
                    },
                    $maxDistance: 200 // 200 meters
                }
            },
            type: type, // Same type to count as duplicate
            isDeleted: false
        });

        if (nearbyDuplicates.length > 0) {
            const duplicate = nearbyDuplicates[0];
            duplicate.duplicateCount += 1;
            await duplicate.save();
            return res.status(200).json({ message: 'Duplicate detected. Existing report updated.', report: duplicate });
        }

        const newReport = new Report({
            userId: req.user.id,
            title,
            description,
            type,
            category: category || 'incident',
            severity,
            location: {
                type: "Point",
                coordinates
            },
            imageUrl
        });

        await newReport.save();

        // 4.1 - Emit Event When Report Created
        const io = req.app.get('io');
        if (io) {
            io.emit("newReport", newReport);
        }

        // 6 - Intelligent routing (only if incident or auto-assign enabled)
        // If it's a help request, it typically waits in the queue unless explicitly routed
        if (newReport.category === 'incident') {
            const { assignNearestVolunteer } = require('../utils/assignmentUtil');
            await assignNearestVolunteer(newReport, io);
        }

        res.status(201).json(newReport);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getAllReports = async (req, res) => {
    try {
        const { category, status } = req.query;
        let query = { isDeleted: false };

        if (category) {
            query.category = category;
        }
        if (status) {
            query.status = status;
        }

        const reports = await Report.find(query).populate('userId', 'name role');
        res.json(reports);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.getNearbyReports = async (req, res) => {
    try {
        const { lng, lat, distance = 5000 } = req.query; // 5km default

        if (!lng || !lat) {
            return res.status(400).json({ message: 'Longitude and latitude are required' });
        }

        const reports = await Report.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(distance)
                }
            },
            isDeleted: false
        });
        res.json(reports);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        report.status = status;
        await report.save();

        // 4.2 - Emit Status Changes
        if (req.app.get('io')) {
            if (status === 'verified') req.app.get('io').emit("reportVerified", report);
            if (status === 'resolved') req.app.get('io').emit("reportResolved", report);
        }

        res.json(report);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Phase 8 - Soft Delete
exports.softDelete = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        report.isDeleted = true;
        report.deletedAt = new Date();
        await report.save();

        res.json({ message: 'Report safely removed (soft deleted)' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.assignUnit = async (req, res) => {
    try {
        const { volunteerId } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // We assume Assignment model is required. Let's require it at the top or here.
        const Assignment = require('../models/Assignment');

        const assignment = new Assignment({
            reportId: report._id,
            volunteerId: volunteerId,
            status: 'assigned'
        });

        await assignment.save();

        // Update report status if it's pending
        if (report.status === 'pending') {
            report.status = 'verified'; // Or some other appropriate intermediate status
            await report.save();
        }

        const io = req.app.get('io');
        if (io) {
            io.emit("newAssignment", { report, volunteerId, assignment });
        }

        res.status(201).json({ message: 'Unit assigned successfully', assignment });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ userId: req.user.id, isDeleted: false }).populate('userId', 'name role');
        res.json(reports);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};
