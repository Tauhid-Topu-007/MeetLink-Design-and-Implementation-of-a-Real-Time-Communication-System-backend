const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
  displayName: { type: String, required: true },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  preferences: {
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'dark' },
    notifications: { type: Boolean, default: true }
  },
  meetings: [{
    meetingId: String,
    meetingName: String,
    role: { type: String, enum: ['host', 'participant'], default: 'participant' },
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date,
    duration: { type: Number, default: 0 }
  }],
  totalMeetingTime: { type: Number, default: 0 },
  totalMeetings: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);