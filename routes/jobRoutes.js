const express = require('express');

const jobController = require('../controllers/jobController');
const authContractorController = require('../controllers/authContractorController');
const authUserController = require('../controllers/authUserController');

const router = express.Router();

router
  .route('/')
  .get(jobController.getAllJob)
  .post(authUserController.protect, jobController.createJob);

router
  .route('/:id')
  .patch(authContractorController.protect, jobController.updateJob)
  .delete(authContractorController.protect, jobController.deleteJob);

router
  .route('/:id/proposal')
  .post(authContractorController.protect, jobController.findjobAndAddProposal);

router
  .route('/:jobId/proposal/:contId')
  .patch(
    authUserController.protect,
    jobController.findJobAndAcceptProposalByUser
  );

module.exports = router;
