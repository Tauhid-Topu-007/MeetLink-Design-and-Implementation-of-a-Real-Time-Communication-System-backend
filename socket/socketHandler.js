const rooms = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    socket.on('join-room', ({ roomId, userName, userId }) => {
      socket.join(roomId);
      
      if (!rooms.has(roomId)) rooms.set(roomId, new Map());
      
      const room = rooms.get(roomId);
      const userInfo = { 
        socketId: socket.id, 
        userId: userId || socket.id, 
        name: userName, 
        isMicOn: true, 
        isVideoOn: true, 
        isCreator: room.size === 0 
      };
      room.set(socket.id, userInfo);
      
      io.to(roomId).emit('participants-update', Array.from(room.values()));
      socket.to(roomId).emit('user-joined', { userId: userInfo.userId, userName: userInfo.name });
      socket.emit('room-joined', { 
        roomId, 
        participants: Array.from(room.values()).filter(p => p.socketId !== socket.id), 
        isCreator: userInfo.isCreator 
      });
      
      console.log(`👤 ${userName} joined room: ${roomId}`);
    });
    
    socket.on('send-signal', ({ signal, userId, roomId }) => {
      io.to(userId).emit('receive-signal', { signal, userId: socket.id, userName: rooms.get(roomId)?.get(socket.id)?.name });
    });
    
    // Handle text messages with deduplication
    socket.on('send-message', (message) => {
      socket.to(message.roomId).emit('chat-message', message);
      // Don't broadcast back to sender
    });
    
    // Handle file messages
    socket.on('send-file', (fileMessage) => {
      socket.to(fileMessage.roomId).emit('file-message', fileMessage);
    });
    
    socket.on('toggle-mic', ({ roomId, isOn }) => {
      const room = rooms.get(roomId);
      if (room?.has(socket.id)) {
        room.get(socket.id).isMicOn = isOn;
        io.to(roomId).emit('participants-update', Array.from(room.values()));
      }
    });
    
    socket.on('toggle-video', ({ roomId, isOn }) => {
      const room = rooms.get(roomId);
      if (room?.has(socket.id)) {
        room.get(socket.id).isVideoOn = isOn;
        io.to(roomId).emit('participants-update', Array.from(room.values()));
      }
    });
    
    socket.on('disconnect', () => {
      for (const [roomId, room] of rooms.entries()) {
        if (room.has(socket.id)) {
          room.delete(socket.id);
          if (room.size === 0) rooms.delete(roomId);
          else io.to(roomId).emit('participants-update', Array.from(room.values()));
          break;
        }
      }
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};