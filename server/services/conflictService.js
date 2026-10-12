const mongoose = require('mongoose');
const Booking = require('../models/Booking');
require('../models/User'); // Ensure User schema is registered for populate

/**
 * Validates that time string is in strict "HH:mm" 24-hr format (00:00 - 23:59).
 * @param {string} timeStr
 * @returns {boolean}
 */
const isValidTime = (timeStr) => {
  if (typeof timeStr !== 'string') return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr.trim());
};

/**
 * Converts a "HH:mm" 24-hr time string to total minutes from midnight.
 * @param {string} timeStr - "HH:mm"
 * @returns {number}
 */
const timeToMinutes = (timeStr) => {
  if (!isValidTime(timeStr)) {
    throw new Error(`Invalid time format '${timeStr}'. Expected HH:mm in 24-hour format.`);
  }
  const [hours, minutes] = timeStr.trim().split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Checks if two time intervals overlap.
 * Section 12 rule: Existing Start < Requested End AND Existing End > Requested Start
 * Boundary condition: 10:00-12:00 and 12:00-14:00 do NOT overlap.
 */
const isOverlap = (startA, endA, startB, endB) => {
  const minStartA = timeToMinutes(startA);
  const minEndA = timeToMinutes(endA);
  const minStartB = timeToMinutes(startB);
  const minEndB = timeToMinutes(endB);

  return minStartA < minEndB && minEndA > minStartB;
};

/**
 * Checks for conflicts against confirmed (APPROVED) bookings and detects competing PENDING requests.
 * @param {string} date - "YYYY-MM-DD"
 * @param {string} startTime - "HH:mm"
 * @param {string} endTime - "HH:mm"
 * @param {string|null} excludeBookingId - optional ID to exclude when updating an existing booking
 */
const checkBookingConflicts = async (date, startTime, endTime, excludeBookingId = null) => {
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    throw new Error('Invalid time format. Start time and end time must be in HH:mm (24-hour) format.');
  }

  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    throw new Error('End time must be strictly after start time.');
  }

  const query = {
    date,
    status: { $in: ['APPROVED', 'PENDING'] }
  };

  // Safely check and cast excludeBookingId only if valid MongoDB ObjectId
  if (excludeBookingId && mongoose.Types.ObjectId.isValid(String(excludeBookingId).trim())) {
    query._id = { $ne: new mongoose.Types.ObjectId(String(excludeBookingId).trim()) };
  }

  const potentialBookings = await Booking.find(query).populate('requestedBy', 'name email club');

  const conflictingApproved = [];
  const competingPending = [];

  for (const b of potentialBookings) {
    if (!b.startTime || !b.endTime) continue;
    try {
      if (isOverlap(b.startTime, b.endTime, startTime, endTime)) {
        if (b.status === 'APPROVED') {
          conflictingApproved.push(b);
        } else if (b.status === 'PENDING') {
          competingPending.push(b);
        }
      }
    } catch {
      // Ignore corrupted booking entry in overlap calculation
    }
  }

  return {
    hasConflict: conflictingApproved.length > 0,
    conflicts: conflictingApproved,
    hasCompetingPending: competingPending.length > 0,
    competingRequests: competingPending
  };
};

module.exports = {
  isValidTime,
  isOverlap,
  timeToMinutes,
  checkBookingConflicts
};
