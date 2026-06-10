// Socket.io boshqaruvi — real-time chat, notification, online status
let io = null;

// userId -> socketId xaritasi (kim onlayn)
const onlineUsers = new Map();

export const initSocket = (socketServer) => {
  io = socketServer;

  io.on("connection", (socket) => {
    console.log(`🔌 Socket ulandi: ${socket.id}`);

    // Foydalanuvchi kirgach o'zini ro'yxatdan o'tkazadi
    socket.on("setup", (userId) => {
      if (!userId) return;
      onlineUsers.set(userId.toString(), socket.id);
      socket.userId = userId.toString();
      socket.join(userId.toString()); // shaxsiy xona
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      console.log(`👤 Foydalanuvchi onlayn: ${userId}`);
    });

    // Suhbat xonasiga qo'shilish
    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
    });

    // "Yozmoqda..." indikatori
    socket.on("typing", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("typing", { conversationId, userId });
    });
    socket.on("stopTyping", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("stopTyping", { conversationId, userId });
    });

    // Uzilganda
    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
        console.log(`👋 Foydalanuvchi oflayn: ${socket.userId}`);
      }
    });
  });
};

// Controllerlardan foydalanuvchiga real-time event yuborish
export const emitToUser = (userId, event, data) => {
  if (!io || !userId) return;
  io.to(userId.toString()).emit(event, data);
};

// Suhbat xonasiga event yuborish
export const emitToConversation = (conversationId, event, data) => {
  if (!io || !conversationId) return;
  io.to(conversationId.toString()).emit(event, data);
};

export const isUserOnline = (userId) => onlineUsers.has(userId.toString());
