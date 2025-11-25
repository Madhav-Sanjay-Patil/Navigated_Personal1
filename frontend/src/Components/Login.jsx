// The Login component manages the user authentication process. It provides input fields for the username and password, then handles user login via a POST 
// request to the /login endpoint. Upon a successful login, the response data (including user details) is stored in localStorage, and the setIsLoggedIn 
// state is updated to true. If either the username or password is missing, an alert prompts the user to enter credentials. Additionally, if the 
// login is unsuccessful or if there's an error during the request, the user is alerted with an appropriate message.
import React, { useEffect, useState } from "react";
import "./Auth.css";
import { getResponsePost } from "../lib/utils";

function Login({ setIsLoggedIn }) {
    console.log("is logged in?");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const handleForgotPassword = () => {
        // Handle forgot password logic here
        console.log("Forgot Password clicked");
    };
    let storageUsername = localStorage.getItem("username");
    useEffect(() => {
        if (storageUsername) {
            setIsLoggedIn(true);
        }
    }, []);
    const handleLogin = async () => {
        console.log("Login clicked", username, password);

        if (username.length === 0 || password.length === 0) {
            alert("Enter Credentials");
            return;
        }

        try {
            const response = await getResponsePost("/login", {
                username: username,
                password: password,
            });
            console.log("API Response:", response); // Log the entire response
            const loggedin = response?.data;

            if (loggedin) {
                localStorage.setItem("id", loggedin.id);
                localStorage.setItem("name", loggedin.name);
                localStorage.setItem("username", username);
                localStorage.setItem("teacher_id", loggedin.teacher_id ?? false);
                localStorage.setItem("learner_id", loggedin.learner_id ?? false);
                localStorage.setItem("ta_id", loggedin.ta_id ?? false);
                setIsLoggedIn(true);
            } else {
                alert("Please enter valid Credentials");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("An error occurred while logging in. Please try again.");
        }
    };

    return (
        <div className="auth-form">
            <h2>Sign In</h2>
            <div>
                <input
                    type="text"
                    placeholder="Email"
                    required
                    onChange={(e) => {
                        setUsername(e.target.value);
                    }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    required
                    onChange={(e) => {
                        setPassword(e.target.value);
                    }}
                />
                <button type="submit" onClick={handleLogin}>
                    Sign In
                </button>
                <label onClick={handleForgotPassword}>Forgot Password</label>
            </div>
        </div>
    );
}

export default Login;
