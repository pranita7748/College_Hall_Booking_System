const mongoose = require('mongoose');
const Club = require('../models/Club');
const AuditLog = require('../models/AuditLog');

// @desc Get all clubs
const getClubs = async (req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    return res.status(200).json({
      success: true,
      count: clubs.length,
      data: clubs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve clubs.',
      error: error.message
    });
  }
};

// @desc Create club (Admin only)
const createClub = async (req, res) => {
  try {
    const { name, department } = req.body;

    if (!name || !department) {
      return res.status(400).json({
        success: false,
        message: 'Club name and department are required.'
      });
    }

    // Case-insensitive uniqueness check
    const existingClub = await Club.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existingClub) {
      return res.status(400).json({
        success: false,
        message: 'A club with this name already exists.'
      });
    }

    const club = await Club.create({
      name: name.trim(),
      department: department.trim(),
      isActive: true
    });

    await AuditLog.create({
      action: 'ADMIN_CLUB_CREATED',
      performedBy: req.user._id,
      details: `Created new club '${club.name}' under department '${club.department}'`
    });

    return res.status(201).json({
      success: true,
      message: 'Club registered successfully.',
      data: club
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create club.',
      error: error.message
    });
  }
};

// @desc Update club (Admin only)
const updateClub = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid club ID format.'
      });
    }

    const { name, department, isActive } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
    }

    if (name) {
      const cleanName = name.trim();
      const duplicate = await Club.findOne({
        name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
        _id: { $ne: club._id }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Another club with this name already exists.'
        });
      }
      club.name = cleanName;
    }

    if (department) club.department = department.trim();
    if (isActive !== undefined) club.isActive = Boolean(isActive);

    await club.save();

    return res.status(200).json({
      success: true,
      message: 'Club updated successfully.',
      data: club
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update club.',
      error: error.message
    });
  }
};

// @desc Delete / toggle club (Admin only)
const deleteClub = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid club ID format.'
      });
    }

    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
    }

    await Club.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: `Club '${club.name}' deleted successfully.`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete club.',
      error: error.message
    });
  }
};

module.exports = {
  getClubs,
  createClub,
  updateClub,
  deleteClub
};

