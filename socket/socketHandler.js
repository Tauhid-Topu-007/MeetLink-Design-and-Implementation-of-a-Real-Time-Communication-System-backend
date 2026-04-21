const rooms = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    socket.on('join-room', ({ roomId, userName, userId }) => {
      // Check if user already in room to prevent duplicate
      if (rooms.has(roomId) && rooms.get(roomId).has(socket.id)) {
        console.log(`User ${socket.id} already in room, skipping`);
        return;
      }
      
      socket.join(roomId);
      
      if (!rooms.has(roomId)) rooms.set(roomId, new Map());
      
      const room = rooms.get(roomId);
      const userInfo = { 
        id: socket.id,
        userId: userId || socket.id, 
        name: userName, 
        isMicOn: true, 
        isVideoOn: true, 
        isCreator: room.size === 0,
        isActive: true
      };
      room.set(socket.id, userInfo);
      
      // Send current participants to the new user (excluding self)
      const participantsList = Array.from(room.values()).map(p => ({
        userId: p.userId,
        name: p.name,
        isMicOn: p.isMicOn,
        isVideoOn: p.isVideoOn,
        isCreator: p.isCreator,
        isActive: p.isActive
      }));
      
      // Filter out self when sending to the new user
      const otherParticipants = participantsList.filter(p => p.userId !== (userId || socket.id));
      
      socket.emit('room-joined', { 
        roomId, 
        participants: otherParticipants,
        isCreator: userInfo.isCreator 
      });
      
      // Broadcast updated participants list to everyone in the room (including self for others)
      io.to(roomId).emit('participants-update', participantsList);
      
      // Notify others about new user (not self)
      socket.to(roomId).emit('user-joined', { 
        userId: userInfo.userId, 
        userName: userInfo.name 
      });
      
      console.log(`👤 ${userName} joined room: ${roomId} (Total: ${room.size})`);
    });
    
    socket.on('send-signal', ({ signal, userId, roomId }) => {
      // Don't send signal to self
      if (userId === socket.id) return;
      io.to(userId).emit('receive-signal', { 
        signal, 
        userId: socket.id, 
        userName: rooms.get(roomId)?.get(socket.id)?.name 
      });
    });
    
    socket.on('send-message', (message) => {
      socket.to(message.roomId).emit('chat-message', message);
    });
    
    socket.on('send-file', (fileMessage) => {
      socket.to(fileMessage.roomId).emit('file-message', fileMessage);
    });
    
    socket.on('toggle-mic', ({ roomId, isOn }) => {
      const room = rooms.get(roomId);
      if (room?.has(socket.id)) {
        const user = room.get(socket.id);
        user.isMicOn = isOn;
        room.set(socket.id, user);
        
        const participantsList = Array.from(room.values()).map(p => ({
          userId: p.userId,
          name: p.name,
          isMicOn: p.isMicOn,
          isVideoOn: p.isVideoOn,
          isCreator: p.isCreator,
          isActive: p.isActive
        }));
        io.to(roomId).emit('participants-update', participantsList);
      }
    });
    
    socket.on('toggle-video', ({ roomId, isOn }) => {
      const room = rooms.get(roomId);
      if (room?.has(socket.id)) {
        const user = room.get(socket.id);
        user.isVideoOn = isOn;
        room.set(socket.id, user);
        
        const participantsList = Array.from(room.values()).map(p => ({
          userId: p.userId,
          name: p.name,
          isMicOn: p.isMicOn,
          isVideoOn: p.isVideoOn,
          isCreator: p.isCreator,
          isActive: p.isActive
        }));
        io.to(roomId).emit('participants-update', participantsList);
      }
    });
    
    socket.on('leave-room', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room?.has(socket.id)) {
        room.delete(socket.id);
        
        if (room.size === 0) {
          rooms.delete(roomId);
        } else {
          const participantsList = Array.from(room.values()).map(p => ({
            userId: p.userId,
            name: p.name,
            isMicOn: p.isMicOn,
            isVideoOn: p.isVideoOn,
            isCreator: p.isCreator,
            isActive: p.isActive
          }));
          io.to(roomId).emit('participants-update', participantsList);
          socket.to(roomId).emit('user-left', { userId: socket.id });
        }
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      
      for (const [roomId, room] of rooms.entries()) {
        if (room.has(socket.id)) {
          room.delete(socket.id);
          
          if (room.size === 0) {
            rooms.delete(roomId);
          } else {
            const participantsList = Array.from(room.values()).map(p => ({
              userId: p.userId,
              name: p.name,
              isMicOn: p.isMicOn,
              isVideoOn: p.isVideoOn,
              isCreator: p.isCreator,
              isActive: p.isActive
            }));
            io.to(roomId).emit('participants-update', participantsList);
            socket.to(roomId).emit('user-left', { userId: socket.id });
          }
          break;
        }
      }
    });
  });
};