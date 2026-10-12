const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'JVN Hall',
      trim: true
    },
    capacity: {
      type: Number,
      required: true,
      default: 250
    },
    location: {
      type: String,
      default: 'Main Campus Block, Ground Floor',
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hall', hallSchema);
