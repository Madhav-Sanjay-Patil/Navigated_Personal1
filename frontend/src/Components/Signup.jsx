// The Signup component handles user registration, validating inputs and passwords, and sending data to an API. 
// Upon successful signup, it stores user details in local storage, sets the login state, and redirects to the homepage.
import React, { useEffect, useState } from "react";
import "./Auth.css";
import { getResponsePost } from "../lib/utils";
import { useNavigate } from "react-router-dom";

function Signup({ setIsLoggedIn }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [email, setEmail] = useState("");
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const storageUsername = localStorage.getItem("username");
    if (storageUsername) {
      setIsLoggedIn(true);
      navigate("/"); // Redirect if already logged in
    }
  }, [setIsLoggedIn, navigate]);

  const handleSubmit = async () => {
    console.log("Signup attempt:", { name, email, password });

    if (password !== retypePassword) {
      alert("Passwords do not match");
      return;
    }

    let data = { name, username: email, password };

    try {
      const response = await getResponsePost("/signup", data);
      console.log("API Response:", response);

      const responseData = response?.data;
      if (!responseData) {
        alert("Signup failed. Please check your input.");
        return;
      }

      console.log("Signup successful:", responseData);

      // Store user data
      localStorage.setItem("id", responseData.id);
      localStorage.setItem("name", responseData.name);
      localStorage.setItem("username", responseData.username);
      localStorage.setItem("teacher_id", responseData.teacher_id ?? false);
      localStorage.setItem("learner_id", responseData.learner_id ?? false);
      localStorage.setItem("ta_id", responseData.ta_id ?? false);

      setIsLoggedIn(true);

      console.log("Navigating to homepage...");
      setTimeout(() => navigate("/"), 100); 

    } catch (error) {
      console.error("Signup error:", error);
      alert("An error occurred during signup. Please try again.");
    }
  };

  return (
    <div className="auth-form">
      <h2>Sign Up</h2>
      <div>
        <input
          type="text"
          placeholder="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          required
          value={retypePassword}
          onChange={(e) => setRetypePassword(e.target.value)}
        />
        <button type="submit" onClick={handleSubmit}>
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default Signup;
