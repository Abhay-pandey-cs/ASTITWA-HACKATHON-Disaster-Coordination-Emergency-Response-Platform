const express = require('express');
const router = express.Router();
const { createReport, getAllReports, getNearbyReports, updateStatus, softDelete, assignUnit, getMyReports } = require('../controllers/reportController');
const auth = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Public read routes
router.get('/', getAllReports);
router.get('/nearby', getNearbyReports);

// Protected routes
router.post('/', auth, createReport);
router.get('/me', auth, getMyReports);

// Role-based Access Control (Phase 5)
router.post('/:id/assign', auth, authorizeRoles('authority', 'admin'), assignUnit);
router.put('/:id/status', auth, authorizeRoles('authority', 'admin'), updateStatus);
router.delete('/:id', auth, authorizeRoles('authority', 'admin'), softDelete);

module.exports = router;
