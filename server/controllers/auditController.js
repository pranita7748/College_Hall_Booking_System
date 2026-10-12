const AuditLog = require('../models/AuditLog');

// @desc Get audit logs (Admin & HOD)
const getAuditLogs = async (req, res) => {
  try {
    const { action, limit = 50 } = req.query;
    let query = {};

    if (action) {
      query.action = action;
    }

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .populate('bookingId', 'eventName organizer date startTime endTime status')
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs.',
      error: error.message
    });
  }
};

module.exports = {
  getAuditLogs
};
