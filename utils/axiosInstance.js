import axios from "axios";

export const configureAxios = (setUser) => {
  // Axios instance with default configuration
  const axiosInstance = axios.create({
    baseURL: "/api",
  });

  // Add a request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      // Get the JWT token from the cookie with a SameSite of Strict
      const token = sessionStorage.getItem("token");

      // If a token exists, attach it to the Authorization header
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      // Do something with request error
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        sessionStorage.clear();
        setUser(null);
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

// export default axiosInstance;
