import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",                 // Localhost
  // baseURL: "https://edureach-backend.onrender.com/api",    // Render

});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

export default API;