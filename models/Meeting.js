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
  meetingId: { type: String, required: true, unique: true, index: true },
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
  maxParticipants: { type: Number, default: 100 },
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
  const maxAttempts = 5;
  
  while (!isUnique && attempts < maxAttempts) {
    meetingId = uuidv4().substr(0, 9).toUpperCase();
    const existing = await this.findOne({ meetingId }).catch(() => null);
    if (!existing) isUnique = true;
    attempts++;
  }
  
  return meetingId;
};

const Meeting = mongoose.model('Meeting', meetingSchema);
module.exports = Meeting;