import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import {io , userSocketMap} from "../server.js"

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);


// Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    ); // $ne used to pick those users whose id(_id) is not userId

    // count number of messages not seen
    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const count = await Message.countDocuments({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      }); // counts messages where sender was user._id, receiver was userId and seen status is false
      if (count > 0) {
        unseenMessages[user._id] = count;
      }
    });
    await Promise.all(promises);
    res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Could not load users" });
  }
};



// Get all message for selected user
export const getMessages = async(req , res)=>{
  try{
    const { id : selectedUserId} = req.params; // need to send the selectedUserId in req
    const myId = req.user._id; // It's me through middleware

    if(!isValidId(selectedUserId)){
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const messages = await Message.find({
      $or:[
        {senderId: myId , receiverId: selectedUserId},
        {senderId: selectedUserId , receiverId : myId},
      ]
    })
    await Message.updateMany({senderId: selectedUserId , receiverId : myId} , {seen: true}); // marked those messages seen

    res.json({success: true , messages})

  }catch(error){
    console.log(error.message);
    res.status(500).json({ success: false, message: "Could not load messages" });
  }
}


// api to mark messages as seen using message id
export const markMessageAsSeen = async(req , res)=>{
  try{
    const {id} = req.params;
    if(!isValidId(id)){
      return res.status(400).json({ success: false, message: "Invalid message id" });
    }
    // only the receiver of a message can mark it as seen
    const message = await Message.findOneAndUpdate(
      { _id: id, receiverId: req.user._id },
      { seen: true }
    );
    if(!message){
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    res.json({success: true})
  }catch(error){
    console.log(error.message);
    res.status(500).json({success: false , message: "Could not update message"})
  }
}


// Send message to selected user
export const sendMessage = async(req,res)=>{
  try{
    const {text , image} = req.body;

    const receiverId = req.params.id;
    const senderId = req.user._id;

    if(!isValidId(receiverId) || !(await User.exists({ _id: receiverId }))){
      return res.status(404).json({success: false , message: "Receiver not found"});
    }
    const trimmedText = typeof text === "string" ? text.trim() : "";
    if(!trimmedText && !image){
      return res.status(400).json({success: false , message: "Message cannot be empty"});
    }
    if(image && (typeof image !== "string" || !image.startsWith("data:image/"))){
      return res.status(400).json({success: false , message: "Invalid image"});
    }

    let imageUrl ;
    if(image){
      const uploadResponse = await cloudinary.uploader.upload(image)
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: trimmedText || undefined,
      image: imageUrl
    })

    //Emit the new message to the receiver's socket
    // Now the receiver will see the message immediately
    const receiverSocketId = userSocketMap[receiverId];
    if(receiverSocketId){
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json({success: true, newMessage});

  }catch(error){
    console.log(error.message);
    res.status(500).json({success: false , message: "Could not send message"})
  }
}
