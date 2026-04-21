const User = require('../models/User');
const jwt = require('jsonwebtoken');

class UserController {
  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  }
  
  async register(req, res) {
    try {
      const { username, email, password, displayName } = req.body;
      
      if (!username || !email || !password || !displayName) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }
      
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ success: false, message: existingUser.username === username ? 'Username already taken' : 'Email already registered' });
      }
      
      const user = new User({ username, email, password, displayName, lastLogin: new Date() });
      await user.save();
      
      const token = this.generateToken(user._id);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { token, user: { id: user._id, username: user.username, email: user.email, displayName: user.displayName } }
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ success: false, message: 'Failed to register user', error: error.message });
    }
  }
  
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
      }
      
      const user = await User.findOne({ $or: [{ username }, { email: username }] }).select('+password');
      
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      user.lastLogin = new Date();
      await user.save();
      
      const token = this.generateToken(user._id);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: { token, user: { id: user._id, username: user.username, email: user.email, displayName: user.displayName } }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ success: false, message: 'Failed to login', error: error.message });
    }
  }
  
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      
      res.json({
        success: true,
        data: { user: { id: user._id, username: user.username, email: user.email, displayName: user.displayName, createdAt: user.createdAt, lastLogin: user.lastLogin } }
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(500).json({ success: false, message: 'Failed to get profile' });
    }
  }
  
  async updateProfile(req, res) {
    try {
      const { displayName, avatar, preferences } = req.body;
      const updateData = {};
      if (displayName) updateData.displayName = displayName;
      if (avatar) updateData.avatar = avatar;
      if (preferences) updateData.preferences = preferences;
      
      const user = await User.findByIdAndUpdate(req.userId, { $set: updateData }, { new: true });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      
      res.json({ success: true, message: 'Profile updated successfully', data: { user } });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  }
}

module.exports = new UserController();