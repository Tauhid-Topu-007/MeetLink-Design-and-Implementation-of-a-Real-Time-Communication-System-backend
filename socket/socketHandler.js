const rooms = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);
    
    socket.on('join-room', ({ roomId, userName }) => {
      // Create room if doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      
      const room = rooms.get(roomId);
      
      // Remove any existing connection with same name
      let existingSocketId = null;
      for (const [sid, user] of room.entries()) {
        if (user.name === userName) {
          existingSocketId = sid;
          break;
        }
      }
      
      if (existingSocketId) {
        console.log(`⚠️ Removing existing connection for ${userName}`);
        room.delete(existingSocketId);
        io.to(roomId).emit('user-disconnected', { userId: existingSocketId });
      }
      
      // Add new user
      room.set(socket.id, {
        id: socket.id,
        name: userName,
        roomId: roomId
      });
      
      socket.join(roomId);
      
      console.log(`📢 ${userName} (${socket.id}) joined room ${roomId}`);
      console.log(`👥 Room ${roomId} has ${room.size} participants`);
      
      // Get all participants in room
      const participants = Array.from(room.values()).map(p => ({
        userId: p.id,
        name: p.name
      }));
      
      // Send participant list to all
      io.to(roomId).emit('participants-list', participants);
      
      // Send existing participants to new user
      const otherParticipants = participants.filter(p => p.userId !== socket.id);
      if (otherParticipants.length > 0) {
        console.log(`📋 Sending existing users to ${userName}:`, otherParticipants);
        socket.emit('existing-participants', { participants: otherParticipants });
      }
      
      // Notify others about new user
      socket.broadcast.to(roomId).emit('user-joined', {
        userId: socket.id,
        userName: userName
      });
    });
    
    // Handle WebRTC signaling
    socket.on('webrtc-signal', ({ userId, signal }) => {
      console.log(`📡 WebRTC signal from ${socket.id} to ${userId}`);
      io.to(userId).emit('webrtc-signal', {
        userId: socket.id,
        signal: signal
      });
    });
    
    // Handle chat messages
    socket.on('send-message', (message) => {
      io.to(message.roomId).emit('chat-message', message);
    });
    
    // Handle file messages
    socket.on('send-file', (fileMessage) => {
      io.to(fileMessage.roomId).emit('file-message', fileMessage);
    });
    
    // Handle media toggles
    socket.on('toggle-mic', ({ roomId, isOn, userName }) => {
      const room = rooms.get(roomId);
      if (room) {
        const participants = Array.from(room.values()).map(p => ({
          userId: p.id,
          name: p.name,
          isMicOn: p.id === socket.id ? isOn : (p.isMicOn !== false),
          isVideoOn: p.isVideoOn !== false
        }));
        io.to(roomId).emit('participants-list', participants);
      }
    });
    
    socket.on('toggle-video', ({ roomId, isOn, userName }) => {
      const room = rooms.get(roomId);
      if (room) {
        const participants = Array.from(room.values()).map(p => ({
          userId: p.id,
          name: p.name,
          isMicOn: p.isMicOn !== false,
          isVideoOn: p.id === socket.id ? isOn : (p.isVideoOn !== false)
        }));
        io.to(roomId).emit('participants-list', participants);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      
      for (const [roomId, room] of rooms.entries()) {
        if (room.has(socket.id)) {
          const user = room.get(socket.id);
          room.delete(socket.id);
          
          console.log(`👋 ${user.name} left room ${roomId}`);
          
          // Get updated participants
          const participants = Array.from(room.values()).map(p => ({
            userId: p.id,
            name: p.name
          }));
          
          // Notify others
          io.to(roomId).emit('participants-list', participants);
          io.to(roomId).emit('user-disconnected', { userId: socket.id });
          
          if (room.size === 0) {
            rooms.delete(roomId);
            console.log(`🗑️ Room ${roomId} deleted`);
          }
          break;
        }
      }
    });
  });
};