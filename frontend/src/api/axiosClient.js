import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  withCredentials: true, // Crucial for HTTPOnly cookies to be sent along!
  headers: {
    'Content-Type': 'application/json',
  },
});

// Notice we no longer need an interceptor to manually attach headers, 
// because `withCredentials: true` tells the browser to automatically include 
// the `jwt` cookie we created on the backend!

export default axiosClient;
