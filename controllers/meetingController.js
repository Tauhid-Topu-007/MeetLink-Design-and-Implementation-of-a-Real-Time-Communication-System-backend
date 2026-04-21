const Meeting = require('../models/Meeting');

class MeetingController {
  async createMeeting(req, res) {
    try {
      const { meetingId, meetingName, password, createdBy, userId } = req.body;
      
      if (!meetingId || !meetingName || !createdBy) {
        return res.status(400).json({ 
          success: false, 
          message: 'Meeting ID, meeting name, and creator name are required' 
        });
      }
      
      // Validate meeting ID format
      const meetingIdRegex = /^[A-Z0-9]{6,12}$/i;
      if (!meetingIdRegex.test(meetingId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Meeting ID must be 6-12 alphanumeric characters' 
        });
      }
      
      // Check if meeting ID already exists
      const existingMeeting = await Meeting.findOne({ meetingId: meetingId.toUpperCase() });
      if (existingMeeting) {
        return res.status(409).json({ 
          success: false, 
          message: 'Meeting ID already exists. Please choose a different one.' 
        });
      }
      
      const meeting = new Meeting({
        meetingId: meetingId.toUpperCase(),
        meetingName,
        password: password || null,
        createdBy,
        createdByUserId: userId || null,
        participants: [{
          userId: userId || `temp_${Date.now()}`,
          name: createdBy,
          joinedAt: new Date(),
          isActive: true
        }]
      });
      
      await meeting.save();
      
      res.status(201).json({
        success: true,
        message: 'Meeting created successfully',
        data: { 
          meetingId: meeting.meetingId, 
          meetingName: meeting.meetingName, 
          createdAt: meeting.createdAt, 
          isCreator: true 
        }
      });
    } catch (error) {
      console.error('Error creating meeting:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create meeting', 
        error: error.message 
      });
    }
  }
  
  async joinMeeting(req, res) {
    try {
      const { meetingId, password, participantName, userId } = req.body;
      
      if (!meetingId || !participantName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Meeting ID and participant name are required' 
        });
      }
      
      const meeting = await Meeting.findOne({ 
        meetingId: meetingId.toUpperCase(), 
        isActive: true 
      });
      
      if (!meeting) {
        return res.status(404).json({ 
          success: false, 
          message: 'Meeting not found. Please check the meeting ID.' 
        });
      }
      
      if (meeting.password && meeting.password !== password) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid meeting password' 
        });
      }
      
      // No participant limit check - allow infinite participants
      const participantUserId = userId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const existingParticipant = meeting.participants.find(p => p.userId === participantUserId && p.isActive);
      if (!existingParticipant) {
        meeting.participants.push({
          userId: participantUserId,
          name: participantName,
          joinedAt: new Date(),
          isActive: true
        });
        await meeting.save();
      }
      
      res.json({
        success: true,
        message: 'Joined meeting successfully',
        data: { 
          meetingId: meeting.meetingId, 
          meetingName: meeting.meetingName, 
          settings: meeting.settings 
        }
      });
    } catch (error) {
      console.error('Error joining meeting:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to join meeting', 
        error: error.message 
      });
    }
  }
  
  // Rest of the controller methods remain the same...
  async getMeetingDetails(req, res) {
    try {
      const { meetingId } = req.params;
      const meeting = await Meeting.findOne({ meetingId: meetingId.toUpperCase() });
      
      if (!meeting) {
        return res.status(404).json({ 
          success: false, 
          message: 'Meeting not found' 
        });
      }
      
      const activeParticipants = meeting.participants.filter(p => p.isActive);
      
      res.json({
        success: true,
        data: {
          meetingId: meeting.meetingId,
          meetingName: meeting.meetingName,
          createdBy: meeting.createdBy,
          createdAt: meeting.createdAt,
          isActive: meeting.isActive,
          activeParticipants: activeParticipants.length,
          totalParticipants: meeting.participants.length,
          participants: activeParticipants.map(p => ({ 
            name: p.name, 
            joinedAt: p.joinedAt 
          })),
          settings: meeting.settings
        }
      });
    } catch (error) {
      console.error('Error getting meeting details:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get meeting details' 
      });
    }
  }
  
  async endMeeting(req, res) {
    try {
      const { meetingId } = req.params;
      const meeting = await Meeting.findOne({ meetingId: meetingId.toUpperCase() });
      
      if (!meeting) {
        return res.status(404).json({ 
          success: false, 
          message: 'Meeting not found' 
        });
      }
      
      meeting.isActive = false;
      meeting.endTime = new Date();
      meeting.duration = Math.floor((meeting.endTime - meeting.startTime) / 60000);
      meeting.participants.forEach(p => { 
        p.isActive = false; 
        p.leftAt = new Date(); 
      });
      await meeting.save();
      
      res.json({ 
        success: true, 
        message: 'Meeting ended successfully', 
        data: { meetingId, duration: meeting.duration } 
      });
    } catch (error) {
      console.error('Error ending meeting:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to end meeting' 
      });
    }
  }
  
  async verifyMeeting(req, res) {
    try {
      const { meetingId } = req.params;
      const meeting = await Meeting.findOne({ 
        meetingId: meetingId.toUpperCase(), 
        isActive: true 
      });
      
      if (!meeting) {
        return res.status(404).json({ 
          success: false, 
          message: 'Meeting not found or has ended' 
        });
      }
      
      res.json({ 
        success: true, 
        data: { 
          meetingId: meeting.meetingId, 
          meetingName: meeting.meetingName, 
          isValid: true 
        } 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to verify meeting' 
      });
    }
  }
  
  async getMeetingHistory(req, res) {
    try {
      const meetings = await Meeting.find({ isActive: false })
        .sort({ createdAt: -1 })
        .limit(50);
      
      res.json({ 
        success: true, 
        data: meetings.map(m => ({ 
          meetingId: m.meetingId, 
          meetingName: m.meetingName, 
          createdBy: m.createdBy, 
          createdAt: m.createdAt, 
          duration: m.duration,
          participantsCount: m.participants.length
        })) 
      });
    } catch (error) {
      console.error('Error getting meeting history:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get meeting history' 
      });
    }
  }
  
  async getActiveMeetings(req, res) {
    try {
      const meetings = await Meeting.find({ isActive: true });
      
      res.json({ 
        success: true, 
        data: meetings.map(m => ({ 
          meetingId: m.meetingId, 
          meetingName: m.meetingName, 
          createdBy: m.createdBy, 
          createdAt: m.createdAt,
          activeParticipants: m.participants.filter(p => p.isActive).length 
        })) 
      });
    } catch (error) {
      console.error('Error getting active meetings:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get active meetings' 
      });
    }
  }
}

module.exports = new MeetingController();