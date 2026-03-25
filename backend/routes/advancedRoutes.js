const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { updateLocation, getVolunteers, addResource, getResources } = require('../controllers/advancedController');


// Volunteer Routes
router.post('/location', auth, updateLocation);
router.get('/volunteers', getVolunteers); // Dashboard can see active volunteers

// Resource Routes
router.post('/resource', auth, authorizeRoles('authority', 'admin'), addResource);
router.get('/resource', getResources);


module.exports = router;
