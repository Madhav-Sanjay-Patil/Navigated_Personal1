// This Axios configuration sets up an API client with a base URL and default headers for JSON content and CORS. 
// It includes request and response interceptors. The request interceptor adds an authorization token from 
// local storage if present. The response interceptor handles 401 errors by redirecting the user to the login page, implying token expiration.
import axios from "axios";
export const SERVERIP = "localhost:5001";
export const baseURL = "http://" + SERVERIP;

const api = axios.create({
	baseURL: baseURL,
	headers: {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*", // Allow requests from any origin
	},
});

api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		// If the error status is 401, it means the token has expired and we need to redirect to login
		if (error.response.status === 401) {
			// Redirect to login
			console.log(
				"Redirecting to the login page - Access Token expired !!"
			);
			window.location.href = "/login";
			return;
		}
		return Promise.reject(error);
	}
);

export default api;
