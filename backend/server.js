// changed the type to module in package.json to allow module import
import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import jwt from "jsonwebtoken";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import {Server} from "socket.io";

// Fail fast if required secrets are missing
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set");
  process.exit(1);
}

// Only allow requests from the frontend (comma separated list in CLIENT_URL)
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

// Creat express app and http server
const app = express();
// server due the fact that socket.io support this server
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server , {
  cors: {origin: allowedOrigins}
})

// Store online users
export const userSocketMap = {}; // {userId: socketId}

// Authenticate every socket with the JWT instead of trusting a userId from the client
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error("Not authorized"));
  }
});

// Socket.io connection handler
io.on("connection" , (socket)=>{
  const userId = socket.userId;
  console.log("User Connected" , userId);

  userSocketMap[userId] = socket.id

  // Emit online users to all connected clients
  io.emit("getOnlineUsers" , Object.keys(userSocketMap));

  socket.on('disconnect' , ()=>{
    console.log("User Disconnected" , userId);
    // only remove the entry if it still belongs to this socket (user may have reconnected)
    if (userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers" , Object.keys(userSocketMap))
  })
})

// MiddleWare setup
app.use(express.json({ limit: "4mb" })); // maximum upload size
app.use(cors({ origin: allowedOrigins })); // only allow the frontend to connect with backend

// setting up user Routes
app.get("/api/status", (req, res) => res.send("Server is Live")); // helps check if my server is running
app.use("/api/auth", userRouter);

app.use('/api/messages' , messageRouter);


// Connect MONGODB
await connectDB();


const PORT = process.env.PORT || 5000; // if available in env. variables else it will start the server at port 5000
server.listen(PORT, () => console.log(`Server is running on PORT :` + PORT));
