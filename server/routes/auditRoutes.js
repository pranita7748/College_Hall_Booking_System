const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('ADMIN', 'HOD'));

router.get('/', getAuditLogs);

module.exports = router;
