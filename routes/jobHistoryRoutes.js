const express = require('express');

const jobHistoryController = require('../controllers/jobHistoryController');
// const authContractorController = require('../controllers/authContractorController');
// const authUserController = require('../controllers/authUserController');

const router = express.Router();

router
  .route('/:contId')
  .get(jobHistoryController.getALlWorlHistoryForContractor);

module.exports = router;
