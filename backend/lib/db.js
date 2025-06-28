import mongoose from "mongoose";
// Function to connect to the mongodb database

export const connectDB = async () => {
  try {
    // try making connection
    mongoose.connection.on("connected", () => console.log("MongoDB Connected"));
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.log(error);
  }
};
