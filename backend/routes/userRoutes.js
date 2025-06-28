import express from "express";
import {checkAuth, login, signup, updateProfile} from "../controllers/userController.js"
import { protectRoute } from "../middleware/auth.js";




const userRouter = express.Router();
// using userRouter creating various routes

userRouter.post('/signup' , signup);
userRouter.post('/login' , login);
userRouter.put('/update-profile' , protectRoute , updateProfile ) //authenticate and then update details
userRouter.get('/check' , protectRoute , checkAuth ) //authenticate and then update details

export default userRouter;