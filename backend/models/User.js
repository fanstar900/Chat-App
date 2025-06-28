import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email : {type : String , required : true , unique : true},
  fullName : {type : String , required : true},
  password : {type : String , required : true , minlength : 6},
  profilePic : {type : String , default : ""},
  bio : {type : String} , 


 // two objects one is proper schema and other is timestamp
} , {timestamps : true});

const User = mongoose.model("User" , userSchema); // Name of model is "User" and schema is userSchema 
// Now we'll export the User Model
export default User;