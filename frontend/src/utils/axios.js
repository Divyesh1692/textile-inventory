// src/utils/axios.js
import axios from "axios";
// import toast from "react-hot-toast";
// import { useAuth } from "../context/AuthContext";

// const { logout } = useAuth();

//

const instance = axios.create({
  // baseURL: "http://localhost:5050/api", // <-- correct port for your backend
  baseURL: "https://billtex.onrender.com/api", // <-- correct port for your backend
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401 && message == "Token expired") {
      //   toast.error("JWT expired. Logging out...");

      // Clear token and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Optional: clear any user state in your global store here

      // Redirect to login
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default instance;
