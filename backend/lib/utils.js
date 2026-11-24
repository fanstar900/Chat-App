import jwt from "jsonwebtoken"

// Function to generate token (expires after 7 days)
export const generateToken = (userId)=>{
  const token = jwt.sign({userId}, process.env.JWT_SECRET, { expiresIn: "7d" });
  return token;
}

// Remove the password hash before sending a user to the client
export const sanitizeUser = (user)=>{
  if(!user) return user;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}
