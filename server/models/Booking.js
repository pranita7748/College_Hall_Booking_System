const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      trim: true
    },
    organizer: {
      type: String,
      required: true,
      trim: true
    },
    bookingType: {
      type: String,
      enum: [
        'Club Event',
        'Guest Lecture',
        'Department Event',
        'Workshop',
        'Meeting',
        'Examination',
        'Other'
      ],
      default: 'Club Event'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true
    },
    startTime: {
      type: String, // Format: HH:mm (24hr)
      required: true
    },
    endTime: {
      type: String, // Format: HH:mm (24hr)
      required: true
    },
    expectedParticipants: {
      type: Number,
      default: 50,
      min: 1,
      max: 250
    },
    guestName: {
      type: String,
      default: '',
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
