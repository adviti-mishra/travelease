import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient"; // Import Supabase client
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import PastSummaries from "./pastsummaries";
import "./style.css";
import { AuthProvider } from "./AuthContext";

function FirstPage() {
  const navigate = useNavigate();
  const [link, setLink] = useState<string>("");
  const [user, setUser] = useState<any>(null); // Store authenticated user

  useEffect(() => {
    // Check if user is already logged in
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Handle Google Login with Supabase
  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.error("Google Sign-In Failed:", error.message);
    } else {
      console.log("Google Sign-In Success:", data);
    }
  };

  const handleHistoryClick = () => {
    if (!user) {
      handleGoogleLogin();
    } else {
      navigate("/past-summaries");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      handleGoogleLogin();
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
          {user && user.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Profile" className="profile-image" />
          ) : null}
        </div>

        {user ? (
          <div className="google-login-container">
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="google-login-container">
            <button className="login-button" onClick={handleGoogleLogin}>
              Sign in with Google
            </button>
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
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<FirstPage />} />
          <Route path="/past-summaries" element={<PastSummaries />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default MainApp;
