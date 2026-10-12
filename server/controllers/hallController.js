const Hall = require('../models/Hall');
const AuditLog = require('../models/AuditLog');

// @desc Get JVN Hall configuration
const getHall = async (req, res) => {
  try {
    let hall = await Hall.findOne();
    if (!hall) {
      hall = await Hall.create({
        name: 'JVN Hall',
        capacity: 250,
        location: 'Main Campus Block, Ground Floor',
        isActive: true
      });
    }
    return res.status(200).json({
      success: true,
      data: hall
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve hall configuration.',
      error: error.message
    });
  }
};

// @desc Update Hall configuration (Admin only)
const updateHall = async (req, res) => {
  try {
    const { name, capacity, location, isActive } = req.body;
    let hall = await Hall.findOne();

    if (!hall) {
      hall = new Hall();
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Hall name cannot be empty.'
        });
      }
      hall.name = name.trim();
    }

    if (capacity !== undefined) {
      const capNum = Number(capacity);
      if (isNaN(capNum) || capNum < 10 || capNum > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Capacity must be a valid number between 10 and 1000 seats.'
        });
      }
      hall.capacity = capNum;
    }

    if (location !== undefined) {
      hall.location = location.trim();
    }

    if (isActive !== undefined) {
      hall.isActive = Boolean(isActive);
    }

    await hall.save();

    await AuditLog.create({
      action: 'ADMIN_HALL_UPDATED',
      performedBy: req.user._id,
      details: `Updated hall configuration: Capacity=${hall.capacity}, Active=${hall.isActive}`
    });

    return res.status(200).json({
      success: true,
      message: 'Hall configuration updated successfully.',
      data: hall
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update hall configuration.',
      error: error.message
    });
  }
};

module.exports = {
  getHall,
  updateHall
};
