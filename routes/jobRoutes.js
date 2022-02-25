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

//choose proposal
router
  .route('/:jobId/proposal/:contId')
  .patch(
    authUserController.protect,
    jobController.findJobAndAcceptProposalByUser
  );
//end job by user, receive money by contractor
router
  .route('/:jobId/endJob/:contId')
  .patch(authUserController.protect, jobController.endJob);

module.exports = router;
