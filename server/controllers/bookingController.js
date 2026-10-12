const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const Hall = require('../models/Hall');
const { checkBookingConflicts, isValidTime, timeToMinutes } = require('../services/conflictService');

// Helper: validate YYYY-MM-DD format
const isValidDateFormat = (dateStr) => {
  if (typeof dateStr !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
};

// Helper: check if date is before today
const isPastDate = (dateStr) => {
  const today = new Date().toISOString().split('T')[0];
  return dateStr < today;
};

// @desc Get bookings based on user role and filters
const getBookings = async (req, res) => {
  try {
    const { status, date, club, myOnly } = req.query;
    const filterConditions = [];

    // Role-based visibility
    if (req.user.role === 'CLUB_COORDINATOR' || req.user.role === 'EVENT_COORDINATOR') {
      if (myOnly === 'true') {
        filterConditions.push({ requestedBy: req.user._id });
      } else {
        // Can see all event submissions and approved public bookings
        filterConditions.push({
          $or: [
            { requestedBy: req.user._id },
            { status: 'APPROVED' },
            { status: 'PENDING' }
          ]
        });
      }
    }

    if (status) {
      filterConditions.push({ status: status.toUpperCase() });
    }
    if (date) {
      filterConditions.push({ date });
    }
    if (club) {
      filterConditions.push({ organizer: club });
    }

    const query = filterConditions.length > 0 ? { $and: filterConditions } : {};

    const bookings = await Booking.find(query)
      .populate('requestedBy', 'name email club role')
      .populate('approvedBy', 'name email role')
      .sort({ date: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings.',
      error: error.message
    });
  }
};

// @desc Get single booking by ID
const getBookingById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.'
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('requestedBy', 'name email club role')
      .populate('approvedBy', 'name email role');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking.',
      error: error.message
    });
  }
};

// @desc Create new booking request
const createBooking = async (req, res) => {
  try {
    const {
      eventName,
      organizer,
      bookingType,
      priority,
      date,
      startTime,
      endTime,
      expectedParticipants,
      guestName,
      description
    } = req.body;

    // Required fields check
    if (!eventName || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Event name, date, start time, and end time are required.'
      });
    }

    // Format & sanity validation
    if (!isValidDateFormat(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.'
      });
    }

    if (isPastDate(date)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a booking for a past date.'
      });
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Start time and end time must be in valid HH:mm 24-hour format.'
      });
    }

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'End time must be strictly after start time.'
      });
    }

    // Check Hall existence and active status
    const hall = await Hall.findOne();
    if (!hall || !hall.isActive) {
      return res.status(400).json({
        success: false,
        message: 'JVN Hall is currently deactivated or under maintenance. Reservations are temporarily unavailable.'
      });
    }

    const maxCapacity = hall.capacity || 250;
    const participantsNum = Number(expectedParticipants) || 50;

    if (participantsNum < 1 || participantsNum > maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Expected participants must be between 1 and hall maximum capacity (${maxCapacity}).`
      });
    }

    // Run conflict detection against existing approved bookings
    const conflictResult = await checkBookingConflicts(date, startTime, endTime);

    if (conflictResult.hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'Time slot conflict detected with an existing confirmed booking.',
        conflicts: conflictResult.conflicts
      });
    }

    // Resolve organizer: coordinators cannot impersonate other clubs
    let effectiveOrganizer = organizer;
    if (req.user.role === 'CLUB_COORDINATOR' && req.user.club) {
      effectiveOrganizer = req.user.club;
    } else if (!effectiveOrganizer) {
      effectiveOrganizer = req.user.club || 'Campus Organization';
    }

    const allowedTypes = [
      'Club Event',
      'Guest Lecture',
      'Department Event',
      'Workshop',
      'Meeting',
      'Examination',
      'Other'
    ];
    const allowedPriorities = ['Low', 'Medium', 'High'];

    const booking = await Booking.create({
      eventName: eventName.trim(),
      organizer: effectiveOrganizer.trim(),
      bookingType: allowedTypes.includes(bookingType) ? bookingType : 'Club Event',
      priority: allowedPriorities.includes(priority) ? priority : 'Medium',
      date: date.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      expectedParticipants: participantsNum,
      guestName: guestName ? guestName.trim() : '',
      description: description ? description.trim() : '',
      status: 'PENDING',
      requestedBy: req.user._id
    });

    // Create Audit Log
    await AuditLog.create({
      action: 'BOOKING_CREATED',
      performedBy: req.user._id,
      bookingId: booking._id,
      details: `Created booking request '${eventName}' for ${date} (${startTime} - ${endTime})`
    });

    return res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully.',
      competingWarnings: conflictResult.competingRequests,
      data: booking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create booking.',
      error: error.message
    });
  }
};

// @desc Update booking request
const updateBooking = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.'
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // Check terminal states: CANCELLED or REJECTED bookings cannot be edited
    if (booking.status === 'CANCELLED' || booking.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: `Cannot modify a booking that is currently ${booking.status}. Please submit a new booking request.`
      });
    }

    // Check permissions: Only creator or Admin can edit, and coordinators can only edit PENDING
    const isOwner = booking.requestedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this booking request.'
      });
    }

    if (booking.status !== 'PENDING' && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be edited by coordinators.'
      });
    }

    const {
      eventName,
      organizer,
      bookingType,
      priority,
      date,
      startTime,
      endTime,
      expectedParticipants,
      guestName,
      description
    } = req.body;

    const newDate = date ? date.trim() : booking.date;
    const newStart = startTime ? startTime.trim() : booking.startTime;
    const newEnd = endTime ? endTime.trim() : booking.endTime;

    if (!isValidDateFormat(newDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.'
      });
    }

    if (isPastDate(newDate)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot move booking date to a past date.'
      });
    }

    if (!isValidTime(newStart) || !isValidTime(newEnd)) {
      return res.status(400).json({
        success: false,
        message: 'Start time and end time must be in valid HH:mm 24-hour format.'
      });
    }

    if (timeToMinutes(newStart) >= timeToMinutes(newEnd)) {
      return res.status(400).json({
        success: false,
        message: 'End time must be strictly after start time.'
      });
    }

    // Hall capacity validation on update
    const hall = await Hall.findOne();
    const maxCapacity = hall ? hall.capacity : 250;

    if (expectedParticipants !== undefined) {
      const partNum = Number(expectedParticipants);
      if (partNum < 1 || partNum > maxCapacity) {
        return res.status(400).json({
          success: false,
          message: `Expected participants must be between 1 and hall maximum capacity (${maxCapacity}).`
        });
      }
      booking.expectedParticipants = partNum;
    }

    // Re-check conflicts
    const conflictResult = await checkBookingConflicts(newDate, newStart, newEnd, booking._id);
    if (conflictResult.hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'Updated time slot conflicts with an existing confirmed booking.',
        conflicts: conflictResult.conflicts
      });
    }

    if (eventName) booking.eventName = eventName.trim();
    if (isAdmin && organizer) booking.organizer = organizer.trim();
    if (bookingType) booking.bookingType = bookingType;
    if (priority) booking.priority = priority;
    booking.date = newDate;
    booking.startTime = newStart;
    booking.endTime = newEnd;
    if (guestName !== undefined) booking.guestName = guestName.trim();
    if (description !== undefined) booking.description = description.trim();

    await booking.save();

    await AuditLog.create({
      action: 'BOOKING_UPDATED',
      performedBy: req.user._id,
      bookingId: booking._id,
      details: `Updated booking '${booking.eventName}'`
    });

    return res.status(200).json({
      success: true,
      message: 'Booking request updated successfully.',
      data: booking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update booking.',
      error: error.message
    });
  }
};

// @desc Cancel booking
const cancelBooking = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.'
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // Redundant cancellation prevention
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Booking has already been cancelled.'
      });
    }

    if (booking.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a booking that was already rejected.'
      });
    }

    const isOwner = booking.requestedBy.toString() === req.user._id.toString();
    const isHOD = req.user.role === 'HOD';
    const isAdmin = req.user.role === 'ADMIN';

    // Coordinator can only cancel their own pending booking
    if (req.user.role === 'CLUB_COORDINATOR' || req.user.role === 'EVENT_COORDINATOR') {
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Cannot cancel another user\'s booking request.'
        });
      }
      if (booking.status === 'APPROVED') {
        return res.status(403).json({
          success: false,
          message: 'Confirmed bookings cannot be cancelled by coordinator directly. Please contact HOD or Admin.'
        });
      }
    } else if (!isHOD && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized operation.'
      });
    }

    booking.status = 'CANCELLED';
    await booking.save();

    await AuditLog.create({
      action: 'BOOKING_CANCELLED',
      performedBy: req.user._id,
      bookingId: booking._id,
      details: `Cancelled booking '${booking.eventName}' on ${booking.date}`
    });

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: booking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel booking.',
      error: error.message
    });
  }
};

// @desc HOD Approves booking request
const approveBooking = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.'
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // State machine check: Only PENDING bookings can be approved
    if (booking.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already approved.'
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve a cancelled booking.'
      });
    }

    if (booking.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve a rejected booking. The applicant must submit a new request.'
      });
    }

    // Verify hall is active
    const hall = await Hall.findOne();
    if (!hall || !hall.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve booking: JVN Hall is currently closed for reservations/maintenance.'
      });
    }

    // Critical: Verify no race condition conflict with another approved booking
    const conflictResult = await checkBookingConflicts(
      booking.date,
      booking.startTime,
      booking.endTime,
      booking._id
    );

    if (conflictResult.hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'Cannot approve: this request overlaps with an already confirmed booking.',
        conflicts: conflictResult.conflicts
      });
    }

    // Perform atomic state update to prevent race conditions
    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'PENDING' },
      {
        status: 'APPROVED',
        approvedBy: req.user._id,
        rejectionReason: null
      },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(409).json({
        success: false,
        message: 'Booking status has already changed or was modified by another operation.'
      });
    }

    await AuditLog.create({
      action: 'BOOKING_APPROVED',
      performedBy: req.user._id,
      bookingId: updatedBooking._id,
      details: `Approved '${updatedBooking.eventName}' by ${updatedBooking.organizer} on ${updatedBooking.date} (${updatedBooking.startTime}-${updatedBooking.endTime})`
    });

    return res.status(200).json({
      success: true,
      message: 'Booking approved successfully and added to the official calendar.',
      data: updatedBooking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve booking.',
      error: error.message
    });
  }
};

// @desc HOD Rejects booking request with mandatory reason
const rejectBooking = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.'
      });
    }

    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required.'
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // State machine check: Only PENDING bookings can be rejected
    if (booking.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Booking has already been rejected.'
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject a booking that has been cancelled.'
      });
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: { $in: ['PENDING', 'APPROVED'] } },
      {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
        approvedBy: req.user._id
      },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(409).json({
        success: false,
        message: 'Booking status has already changed.'
      });
    }

    await AuditLog.create({
      action: 'BOOKING_REJECTED',
      performedBy: req.user._id,
      bookingId: updatedBooking._id,
      details: `Rejected '${updatedBooking.eventName}' with reason: "${rejectionReason.trim()}"`
    });

    return res.status(200).json({
      success: true,
      message: 'Booking request rejected.',
      data: updatedBooking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reject booking.',
      error: error.message
    });
  }
};

// @desc Check conflicts without saving
const checkConflicts = async (req, res) => {
  try {
    const { date, startTime, endTime, excludeBookingId } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Date, startTime, and endTime query parameters are required.'
      });
    }

    if (!isValidDateFormat(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.'
      });
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Start time and end time must be in valid HH:mm 24-hour format.'
      });
    }

    const result = await checkBookingConflicts(date, startTime, endTime, excludeBookingId);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to perform conflict check.',
      error: error.message
    });
  }
};

// @desc Get official calendar (only confirmed bookings)
const getCalendar = async (req, res) => {
  try {
    const { month, date, organizer } = req.query;
    const query = { status: 'APPROVED' };

    if (date) {
      query.date = date;
    } else if (month) {
      query.date = { $regex: `^${month}` };
    }

    if (organizer) {
      query.organizer = organizer;
    }

    const confirmedBookings = await Booking.find(query)
      .populate('requestedBy', 'name email club')
      .populate('approvedBy', 'name email role')
      .sort({ date: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      count: confirmedBookings.length,
      data: confirmedBookings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch official calendar.',
      error: error.message
    });
  }
};

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  approveBooking,
  rejectBooking,
  checkConflicts,
  getCalendar
};

