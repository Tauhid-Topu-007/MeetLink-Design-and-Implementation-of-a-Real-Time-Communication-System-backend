const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, default: null },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date, default: null },
  duration: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const meetingSchema = new mongoose.Schema({
  meetingId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    uppercase: true,
    match: /^[A-Z0-9]{6,12}$/
  },
  meetingName: { type: String, required: true },
  password: { type: String, default: null },
  createdBy: { type: String, required: true },
  createdByUserId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  participants: [participantSchema],
  isActive: { type: Boolean, default: true, index: true },
  duration: { type: Number, default: 0 },
  // Removed maxParticipants - allowing infinite participants
  settings: {
    allowScreenShare: { type: Boolean, default: true },
    allowChat: { type: Boolean, default: true },
    waitingRoom: { type: Boolean, default: false },
    muteOnEntry: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Generate unique meeting ID
meetingSchema.statics.generateUniqueMeetingId = async function() {
  const { v4: uuidv4 } = require('uuid');
  let meetingId, isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!isUnique && attempts < maxAttempts) {
    meetingId = uuidv4().substr(0, 9).toUpperCase();
    const existing = await this.findOne({ meetingId });
    if (!existing) isUnique = true;
    attempts++;
  }
  
  return meetingId;
};

// Add participant method - no limit check
meetingSchema.methods.addParticipant = function(userId, name, email = null) {
  const existingParticipant = this.participants.find(p => p.userId === userId && p.isActive);
  
  if (existingParticipant) {
    return existingParticipant;
  }
  
  const participant = {
    userId,
    name,
    email,
    joinedAt: new Date(),
    isActive: true
  };
  
  this.participants.push(participant);
  return participant;
};

// Remove participant method
meetingSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => p.userId === userId && p.isActive);
  
  if (participant) {
    participant.leftAt = new Date();
    participant.isActive = false;
    participant.duration = Math.floor((participant.leftAt - participant.joinedAt) / 60000);
    
    const activeParticipants = this.participants.filter(p => p.isActive);
    if (activeParticipants.length === 0) {
      this.endTime = new Date();
      this.isActive = false;
      this.duration = Math.floor((this.endTime - this.startTime) / 60000);
    }
  }
  
  return participant;
};

// Check if meeting is full - always returns false (never full)
meetingSchema.methods.isFull = function() {
  return false; // Infinite participants allowed
};

const Meeting = mongoose.model('Meeting', meetingSchema);
module.exports = Meeting;