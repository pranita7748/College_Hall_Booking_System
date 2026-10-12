const express = require('express');
const router = express.Router();
const { getClubs, createClub, updateClub, deleteClub } = require('../controllers/clubController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', getClubs);
router.post('/', roleMiddleware('ADMIN'), createClub);
router.put('/:id', roleMiddleware('ADMIN'), updateClub);
router.delete('/:id', roleMiddleware('ADMIN'), deleteClub);

module.exports = router;

