const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users.',
      error: error.message
    });
  }
};

// @desc Create new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, club } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const validRoles = ['EVENT_COORDINATOR', 'CLUB_COORDINATOR', 'HOD', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role '${role}'. Allowed roles: ${validRoles.join(', ')}.`
      });
    }

    if (role === 'CLUB_COORDINATOR' && (!club || !club.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A club assignment is required for the Club Coordinator role.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      club: role === 'CLUB_COORDINATOR' ? club.trim() : null,
      isActive: true
    });

    await AuditLog.create({
      action: 'ADMIN_USER_CREATED',
      performedBy: req.user._id,
      details: `Created user '${user.name}' (${user.email}) with role ${user.role}`
    });

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: userObj
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create user.',
      error: error.message
    });
  }
};

// @desc Update user
const updateUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
    }

    const { name, email, role, club, isActive, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const isSelf = req.user._id.toString() === user._id.toString();

    // Check demotion of last remaining admin
    if (user.role === 'ADMIN' && role && role !== 'ADMIN') {
      const otherAdmins = await User.countDocuments({
        role: 'ADMIN',
        isActive: true,
        _id: { $ne: user._id }
      });
      if (otherAdmins === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the only active Administrator in the system.'
        });
      }
    }

    // Check self-deactivation
    if (isSelf && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.'
      });
    }

    // Check email uniqueness if email changed
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== user.email) {
        const duplicate = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: 'Email address is already in use by another account.'
          });
        }
        user.email = cleanEmail;
      }
    }

    if (name) user.name = name.trim();

    if (role) {
      const validRoles = ['EVENT_COORDINATOR', 'CLUB_COORDINATOR', 'HOD', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role '${role}'.`
        });
      }
      user.role = role;
    }

    if (club !== undefined) {
      user.club = user.role === 'CLUB_COORDINATOR' ? (club ? club.trim() : null) : null;
    }

    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
    }

    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.'
        });
      }
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    await user.save();

    await AuditLog.create({
      action: 'ADMIN_USER_UPDATED',
      performedBy: req.user._id,
      details: `Updated user account '${user.name}' (${user.email})`
    });

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: userObj
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user.',
      error: error.message
    });
  }
};

// @desc Deactivate/toggle user account
const toggleUserActive = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Prevent deactivating own account
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.'
      });
    }

    // Prevent deactivating the only active Admin
    if (user.role === 'ADMIN' && user.isActive) {
      const activeAdminCount = await User.countDocuments({ role: 'ADMIN', isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the sole active Administrator in the system.'
        });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.create({
      action: 'ADMIN_USER_DEACTIVATED',
      performedBy: req.user._id,
      details: `${user.isActive ? 'Activated' : 'Deactivated'} user '${user.name}' (${user.email})`
    });

    return res.status(200).json({
      success: true,
      message: `User successfully ${user.isActive ? 'activated' : 'deactivated'}.`,
      data: {
        id: user._id,
        name: user.name,
        isActive: user.isActive
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status.',
      error: error.message
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  toggleUserActive
};

