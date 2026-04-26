import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  console.log("TOKEN FROM STORAGE:", token);

  if (!config.headers) {
    config.headers = {};
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("TOKEN ATTACHED");
  } else {
    console.log("NO TOKEN FOUND");
  }

  return config;
});

export default api;