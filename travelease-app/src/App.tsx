import React, { useState, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import PastSummaries from "./pastsummaries";
import { useAuth } from "./AuthContext";
import { jwtDecode } from "jwt-decode";
import "./style.css";

function FirstPage() {
  const navigate = useNavigate();
  const [link, setLink] = useState<string>("");
  const { user, setUser } = useAuth();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );
        const userInfo = await userInfoResponse.json();
        setUser(userInfo);
        console.log("Login Success:", userInfo);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    },
    onError: () => {
      console.log("Login Failed");
    },
  });

  const handleHistoryClick = () => {
    if (!user) {
      login(); // 🚀 Automatically trigger Google OAuth login
    } else {
      navigate("/past-summaries"); // ✅ If logged in, navigate to history
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      login();
      return;
    }

    alert(`Link Submitted: ${link}`);

    try {
      const response = await fetch("http://127.0.0.1:5000/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ link }),
      });

      const data = await response.text();
      alert(`Response from server: ${data}`);
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send link.");
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="profile-section">
          {user && user.picture ? (
            <img src={user.picture} alt="Profile" className="profile-image" />
          ) : null}
        </div>

        {user ? (
          <div className="google-login-container">
            <button className="logout-button" onClick={() => setUser(null)}>
              Logout
            </button>
          </div>
        ) : (
          <div className="google-login-container">
            <div style={{ display: "none" }}>
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  const decoded: any = jwtDecode(
                    credentialResponse.credential as string
                  );
                  setUser(decoded);
                  console.log("Login Success:", decoded);
                }}
                onError={() => {
                  console.log("Login Failed");
                }}
              />
            </div>
            <div className="google-login-container">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  const decoded: any = jwtDecode(
                    credentialResponse.credential as string
                  );
                  setUser(decoded);
                  console.log("Login Success:", decoded);
                }}
                onError={() => {
                  console.log("Login Failed");
                }}
              />
            </div>
          </div>
        )}

        <div className="logo-section">
          <h1 className="logo-text">TravelEase</h1>
          <div className="divider"></div>
          <h2 className="tagline">Summarize Link</h2>
        </div>
        <div className="history-section">
          <button className="history-button" onClick={handleHistoryClick}>
            History <span className="arrow">›</span>
          </button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="link-form">
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Enter link..."
          className="link-input"
        />
        <button type="submit" className="submit-button">
          Submit
        </button>
      </form>
    </div>
  );
}

function MainApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/past-summaries" element={<PastSummaries />} />
      </Routes>
    </Router>
  );
}

export default MainApp;
