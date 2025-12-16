// src/server.js
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app.js";

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: "*" },
});

// expose socket.io to controllers
app.locals.io = io;

io.on("connection", (socket) => {
  console.log("🔌 Socket.io connected:", socket.id);
});

const port = process.env.PORT || 4000;

server
  .listen(port)
  .on("listening", () =>
    console.log(`🚀 Server started on http://localhost:${port}`)
  )
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`⚠️ Port ${port} is busy. Trying ${port + 1}...`);
      server.listen(port + 1);
    } else {
      throw err;
    }
  });
