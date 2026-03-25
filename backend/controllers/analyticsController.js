const Report = require('../models/Report');

exports.getDashboardStats = async (req, res) => {
    try {
        const totalReports = await Report.countDocuments({ isDeleted: false });
        const activeIncidents = await Report.countDocuments({ category: 'incident', status: { $ne: 'resolved' }, isDeleted: false });
        const pendingRequests = await Report.countDocuments({ category: 'help_request', status: 'pending', isDeleted: false });

        const severityStats = await Report.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: "$severity", count: { $sum: 1 } } }
        ]);

        const typeStats = await Report.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: "$type", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            totalReports,
            activeIncidents,
            pendingRequests,
            severityStats,
            typeStats
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
