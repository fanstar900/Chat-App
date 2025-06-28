// changed the type to module in package.json to allow module import
import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import {Server} from "socket.io";

// Creat express app and http server
const app = express();
// server due the fact that socket.io support this server
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server , {
  cors: {origin: "*"}
})

// Store online users
export const userSocketMap = {}; // {userId: socketId}

// Socket.io connection handler
io.on("connection" , (socket)=>{
  const userId = socket.handshake.query.userId;
  console.log("User Connected" , userId);

  if(userId){
    userSocketMap[userId] = socket.id
  }

  // Emit online users to all connected clients
  io.emit("getOnlineUsers" , Object.keys(userSocketMap));

  socket.on('disconnect' , ()=>{
    console.log("User Disconnected" , userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers" , Object.keys(userSocketMap))
  })
})

// MiddleWare setup
app.use(express.json({ limit: "4mb" })); // maximum upload size
app.use(cors()); // allow all the url's to connect with backend

// setting up user Routes
app.use("/api/status", (req, res) => res.send("Server is Live")); // helps check if my server is running
app.use("/api/auth", userRouter);

app.use('/api/messages' , messageRouter);


// Connect MONGODB
await connectDB();


const PORT = process.env.PORT || 5000; // if available in env. variables else it will start the server at port 5000
server.listen(PORT, () => console.log(`Server is running on PORT :` + PORT));
