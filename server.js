import "dotenv/config";
import http from "http";
import { Server } from "socket.io";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { initSocket } from "./src/socket/index.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  // MongoDB ulanish
  await connectDB();

  // HTTP server (Express + Socket.io shu serverda ishlaydi)
  const server = http.createServer(app);

  // Socket.io
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });
  initSocket(io);

  server.listen(PORT, () => {
    console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
  });
};

start();

// Kutilmagan xatolarni ushlash
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
});
