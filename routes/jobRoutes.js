const express = require('express');

const jobController = require('../controllers/jobController');
const authController = require('../controllers/authUserController');

const router = express.Router();

router
  .route('/')
  .get(jobController.getAllJob)
  .post(authController.protect, jobController.createJob);

router
  .route('/:id')
  .patch(authController.protect, jobController.updateJob)
  .delete(authController.protect, jobController.deleteJob);

module.exports = router;
