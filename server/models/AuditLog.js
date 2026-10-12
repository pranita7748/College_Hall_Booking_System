const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'BOOKING_CREATED',
      'BOOKING_UPDATED',
      'BOOKING_CANCELLED',
      'BOOKING_APPROVED',
      'BOOKING_REJECTED',
      'ADMIN_USER_CREATED',
      'ADMIN_USER_UPDATED',
      'ADMIN_USER_DEACTIVATED',
      'ADMIN_CLUB_CREATED',
      'ADMIN_HALL_UPDATED'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  details: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
