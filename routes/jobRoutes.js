const express = require('express');

const jobController = require('../controllers/jobController');
const authContractorController = require('../controllers/authContractorController');
const authUserController = require('../controllers/authUserController');

const router = express.Router();

//only users can create job
router
  .route('/')
  .get(jobController.getAllJob)
  .post(authUserController.protect, jobController.createJob);

//only users could delete and update theri own jobs
router
  .route('/:id')
  .get(authUserController.protect, jobController.getJob)
  .patch(authUserController.protect, jobController.updateJob)
  .delete(authUserController.protect, jobController.deleteJob);

//get job by contractor
router
  .route('/contractor/:id')
  .get(authContractorController.protect, jobController.getJob);

//adding proposal
router
  .route('/:id/proposal')
  .post(authContractorController.protect, jobController.findjobAndAddProposal);

//choose proposal by client
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
