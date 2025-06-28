import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import {io , userSocketMap} from "../server.js"


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
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      }); // filters all message and find the message for which sender was user._id and receiver was userId and seen status is false
      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });
    await Promise.all(promises);
    res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};



// Get all message for selected user
export const getMessages = async(req , res)=>{
  try{
    const { id : selectedUserId} = req.params; // need to send the selectedUserId in req
    const myId = req.user._id; // It's me through middleware

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
    res.json({ success: false, message: error.message });    
  }
}


// api to mark messages as seen using message id
export const markMessageAsSeen = async(req , res)=>{
  try{
    const {id} = req.params;
    await Message.findByIdAndUpdate(id , {seen : true})
    res.json({success: true})
  }catch(error){
    console.log(error.message);
    res.json({success: false , message: error.message})
  }
}


// Send message to selected user
export const sendMessage = async(req,res)=>{
  try{
    const {text , image} = req.body;

    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl ;
    if(image){
      const uploadResponse = await cloudinary.uploader.upload(image)
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl
    })

    //Emit the new message to the receiver's socket
    // Now the receiver will see the message immediately
    const receiverSocketId = userSocketMap[receiverId];
    if(receiverSocketId){
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }



    res.json({success: true, newMessage}); // ?? but we want this message to be instantly into the receiver chat


  }catch(error){
    console.log(error.message);
    res.json({success: false , message: error.message}) 
  }
}