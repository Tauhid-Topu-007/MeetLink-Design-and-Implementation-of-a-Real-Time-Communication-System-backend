const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../utils/auth');

router.post('/register', (req, res) => userController.register(req, res));
router.post('/login', (req, res) => userController.login(req, res));
router.get('/profile', auth, (req, res) => userController.getProfile(req, res));
router.put('/profile', auth, (req, res) => userController.updateProfile(req, res));

module.exports = router;