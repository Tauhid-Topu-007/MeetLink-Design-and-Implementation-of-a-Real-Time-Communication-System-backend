const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const auth = require('../utils/auth');

router.post('/create', (req, res) => meetingController.createMeeting(req, res));
router.post('/join', (req, res) => meetingController.joinMeeting(req, res));
router.get('/verify/:meetingId', (req, res) => meetingController.verifyMeeting(req, res));
router.get('/active', (req, res) => meetingController.getActiveMeetings(req, res));
router.get('/history', (req, res) => meetingController.getMeetingHistory(req, res));
router.get('/:meetingId', (req, res) => meetingController.getMeetingDetails(req, res));
router.post('/:meetingId/end', auth, (req, res) => meetingController.endMeeting(req, res));

module.exports = router;