const User = require('../models/User');
const Assignment = require('../models/Assignment');

exports.assignNearestVolunteer = async (report, io) => {
    try {
        // Phase 6 - Find nearest volunteer
        const volunteers = await User.find({
            role: 'volunteer',
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: report.location.coordinates
                    },
                    $maxDistance: 10000 // 10km radius
                }
            }
        }).limit(1);

        if (volunteers.length > 0) {
            const volunteer = volunteers[0];
            const assignment = new Assignment({
                reportId: report._id,
                volunteerId: volunteer._id
            });
            await assignment.save();

            // Emit assignment notification
            if (io) {
                io.emit("newAssignment", { report, volunteer, assignment });
            }
            return assignment;
        }
        return null; // No volunteer found nearby
    } catch (err) {
        console.error("Error in assignNearestVolunteer:", err);
    }
};
