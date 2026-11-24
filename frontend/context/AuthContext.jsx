import axios from "axios";
import { createContext, useEffect, useState } from "react";
import toast from "react-hot-toast"
import {io} from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl; // using axios to give default url like localhost..

// Prefer the server's message (sent with 4xx/5xx responses) over axios' generic one
export const getErrorMessage = (error) =>
  error?.response?.data?.message || error.message;

export const AuthContext = createContext();

export const AuthProvider = ({children})=>{

  const [token , setToken] = useState(localStorage.getItem('token'));
  const [authUser , setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket , setSocket] = useState(null);

  const clearSession = ()=>{
    localStorage.removeItem('token');
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    delete axios.defaults.headers.common['token'];
    if(socket){
      socket.disconnect();
      setSocket(null);
    }
  }

  // Check if user is authenticated and if so, set the user data and connect the socket
  const checkAuth = async (savedToken)=>{
    try{
      const {data} = await axios.get('/api/auth/check')
      if(data.success){
        setAuthUser(data.user)
        connectSocket(savedToken);
      }
    }catch(error){
      if(error?.response?.status === 401){
        clearSession(); // token expired or invalid
      }else{
        toast.error(getErrorMessage(error));
      }
    }
  }

  // Login function to handle user authentication and socket connection
  const login = async(state , credentials)=>{
    try{
      const {data} = await axios.post(`/api/auth/${state}`, credentials);
      if(data.success){
        setAuthUser(data.userData);
        axios.defaults.headers.common['token'] = data.token;
        setToken(data.token);
        localStorage.setItem("token" , data.token);
        connectSocket(data.token);
        toast.success(data.message)
      }else{
        toast.error(data.message)
      }
    }catch(error){
      console.log(error.message);
      toast.error(getErrorMessage(error))
    }
  }

  // Logout function to handle user logout and socket disconnection
  const logout = async()=>{
    clearSession();
    toast.success('Logged out successfully');
  }


  // Update profile function to handle user profile updates
  // returns true when the update succeeded
  const updateProfile = async(body)=>{
    try{
      const {data}= await axios.put('/api/auth/update-profile' , body);
      if(data.success){
        setAuthUser(data.user);
        toast.success('Profile updated successfully')
        return true;
      }
      toast.error(data.message);
    }catch(error){
      toast.error(getErrorMessage(error));
    }
    return false;
  }


  // Connect socket function to handle socket connection and online users updates
  // The server identifies the user from the JWT, not from a client-supplied id
  const connectSocket = (authToken)=>{
    if(!authToken || socket?.connected) return ;
    const newSocket = io(backendUrl , {
      auth:{
        token: authToken,
      }
    });
    setSocket(newSocket);
    newSocket.on('getOnlineUsers' , (userIds)=>{
      setOnlineUsers(userIds);
    })
  }


  useEffect(()=>{
    if(token){
      axios.defaults.headers.common['token'] = token;
      checkAuth(token);
    }
  },[])

  const value = {
    axios, // providing axios to every component
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile
  }
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
