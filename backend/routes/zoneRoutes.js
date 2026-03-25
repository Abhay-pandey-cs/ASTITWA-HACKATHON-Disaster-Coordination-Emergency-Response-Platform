const express = require('express');
const router = express.Router();
const { createZone, getZones } = require('../controllers/zoneController');
const auth = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.get('/', getZones);
router.post('/', auth, authorizeRoles('authority', 'admin'), createZone);

module.exports = router;
