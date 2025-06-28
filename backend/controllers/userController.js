// create user , authenticates the user , update the user profile

import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js"

// Signup a new user

export const signup = async(req , res)=>{
  const {fullName , email , password , bio} = req.body;

  try{
    if(!fullName || !email || !password || !bio){
      return res.json({success : false, message : "Missing Details"})
    }
    const user = await User.findOne({email}) // if user exits with this email
    if(user){
      return res.json({success : false , message : "Account already exits"})
    }

    const salt = await bcrypt.genSalt(10); // 10 denotes how many times the becrypt runs makes it more secure
    // hashing using salt , 
    const hashedPassword = await bcrypt.hash(password , salt);
    const newUser = await User.create({fullName , email , password: hashedPassword , bio}); // storing the hashed password

    const token = generateToken(newUser._id) ; // generate new token based on id with the help of jwt_secret key which we have

    res.json({success : true , userData : newUser , token , message:"Account created successfully"} );

  }catch(error){
    console.log(error.message);
    res.json({success: false , message : error.message});
  }
}


// Login for User

export const login = async(req , res)=>{
  try{
    const {email , password} = req.body;
    const userData = await User.findOne({email})

    const isPasswordCorrect = await bcrypt.compare(password , userData.password) // compare hashed password with password 
    if(!isPasswordCorrect){
      return res.json({success : false , message : "Invalid credentials"})
    }
    const token = generateToken(userData._id); 
    res.json({success: true , userData , token , message:"Login successful"});
  }
  catch(error){
    console.log(error.message);
    res.json({success: false , message : error.message});
  }
}

// Controller to check if user is authenticated
export const checkAuth = (req , res)=>{
  res.json({success : true , user : req.user });
}

// Controller function for user profile update including profile image using cloudinary
export const updateProfile = async(req , res)=>{
  try{
    const {profilePic , bio , fullName} = req.body;
    const userId = req.user._id;
    let updatedUser ;
    if(!profilePic){ // if profile pic is provided
      updatedUser = await User.findByIdAndUpdate(userId , {bio , fullName} , {new: true})
    }
    else{
      const upload = await cloudinary.uploader.upload(profilePic); // upload image to cloudinary
      updatedUser = await User.findByIdAndUpdate(userId , {profilePic: upload.secure_url , bio , fullName} , {new:true}) // updates profile url to that by uploading
      
    }
    res.json({success : true , user: updatedUser})
  }
  catch(error){
    console.log(error.message);
    res.json({success: false , message: error.message})
  }
}
