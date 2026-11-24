import mongoose from "mongoose";
// Function to connect to the mongodb database

export const connectDB = async () => {
  try {
    // try making connection
    mongoose.connection.on("connected", () => console.log("MongoDB Connected"));
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1); // don't start the server without a database
  }
};
