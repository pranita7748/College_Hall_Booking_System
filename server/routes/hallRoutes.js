const express = require('express');
const router = express.Router();
const { getHall, updateHall } = require('../controllers/hallController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', getHall);
router.put('/', roleMiddleware('ADMIN'), updateHall);

module.exports = router;
