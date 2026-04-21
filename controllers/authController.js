const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthController {
  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'my-secret-key', { expiresIn: '7d' });
  }

  // Register with email/password
  async register(req, res) {
    try {
      const { username, email, password, displayName } = req.body;
      
      console.log('Registration attempt:', { username, email, displayName });
      
      if (!username || !email || !password || !displayName) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }
      
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: existingUser.username === username ? 'Username already taken' : 'Email already registered'
        });
      }
      
      const user = new User({ 
        username, 
        email, 
        password, 
        displayName,
        isVerified: true // Auto-verify for now
      });
      await user.save();
      
      const token = this.generateToken(user._id);
      
      console.log('User registered successfully:', user._id);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful!',
        data: { 
          token, 
          user: { 
            id: user._id, 
            username, 
            email, 
            displayName 
          } 
        }
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ success: false, message: 'Failed to register user', error: error.message });
    }
  }

  // Login with email/password
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      console.log('Login attempt:', { email });
      
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }
      
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
      
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
      
      user.lastLogin = new Date();
      await user.save();
      
      const token = this.generateToken(user._id);
      
      console.log('User logged in successfully:', user._id);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: { 
          token, 
          user: { 
            id: user._id, 
            username: user.username, 
            email: user.email, 
            displayName: user.displayName 
          } 
        }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ success: false, message: 'Failed to login', error: error.message });
    }
  }

  // Google Login
  async googleLogin(req, res) {
    try {
      const { email, displayName, avatar } = req.body;
      
      let user = await User.findOne({ email });
      
      if (!user) {
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
        user = new User({
          username,
          email,
          displayName,
          avatar,
          isVerified: true
        });
        await user.save();
      }
      
      const token = this.generateToken(user._id);
      
      res.json({
        success: true,
        message: 'Google login successful',
        data: { token, user: { id: user._id, username: user.username, email: user.email, displayName: user.displayName, avatar: user.avatar } }
      });
    } catch (error) {
      console.error('Error with Google login:', error);
      res.status(500).json({ success: false, message: 'Google login failed', error: error.message });
    }
  }

  // Forgot password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'No account found with this email' });
      }
      
      const resetToken = user.generateResetToken();
      await user.save();
      
      // For testing, return the token
      res.json({ success: true, message: 'Password reset token generated', resetToken });
    } catch (error) {
      console.error('Error sending reset email:', error);
      res.status(500).json({ success: false, message: 'Failed to send reset email', error: error.message });
    }
  }

  // Reset password
  async resetPassword(req, res) {
    try {
      const { email, token, newPassword } = req.body;
      
      const user = await User.findOne({ 
        email, 
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      }
      
      user.password = newPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      
      res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
    }
  }

  // Verify email
  async verifyEmail(req, res) {
    try {
      const { email, token } = req.body;
      
      const user = await User.findOne({ email, emailVerificationToken: token });
      
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid verification token' });
      }
      
      user.isVerified = true;
      user.emailVerificationToken = null;
      await user.save();
      
      res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(500).json({ success: false, message: 'Failed to verify email', error: error.message });
    }
  }
}

module.exports = new AuthController();