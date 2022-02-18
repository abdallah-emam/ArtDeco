const express = require('express');
// const contractorController = require('../controllers/contractorController');
const authController = require('../controllers/authContractorController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

module.exports = router;
