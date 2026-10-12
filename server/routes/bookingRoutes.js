const express = require('express');
const router = express.Router();
const {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  approveBooking,
  rejectBooking,
  checkConflicts,
  getCalendar
} = require('../controllers/bookingController');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All booking routes require authentication
router.use(authMiddleware);

// Calendar & Conflict Utilities
router.get('/calendar', getCalendar);
router.get('/conflicts', checkConflicts);

// Core Booking CRUD
router.get('/', getBookings);
router.post('/', createBooking);
router.get('/:id', getBookingById);
router.put('/:id', updateBooking);
router.delete('/:id', cancelBooking);

// HOD & Admin Approval Workflows
router.post('/:id/approve', roleMiddleware('HOD', 'ADMIN'), approveBooking);
router.post('/:id/reject', roleMiddleware('HOD', 'ADMIN'), rejectBooking);

module.exports = router;
