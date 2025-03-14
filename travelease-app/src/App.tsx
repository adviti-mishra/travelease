import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import PastSummaries from "./pastsummaries";
import "./style.css";
import { useAuth } from "./AuthContext";
import { jwtDecode } from "jwt-decode";
import { AuthProvider } from "./AuthContext";

function FirstPage() {
  const navigate = useNavigate();
  const [link, setLink] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<{ summary?: any; error?: string } | null>(null);
  // const { user, setUser } = useAuth();
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

    // Get the Supabase JWT token
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;


    if (!token) {
      console.error("No access token available.");
      return;
    }

    setIsLoading(true);
    setSummaryData(null);

    try {
      console.log("Sending request with link:", link);

      const response = await fetch("http://127.0.0.1:5000/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // ✅ Send token in headers
        },
        body: JSON.stringify({ link })
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error (${response.status}): ${errorText}`);
        throw new Error(`Server responded with status: ${response.status}. Details: ${errorText}`);
      }

      const data = await response.json();
      console.log("Parsed response data:", data);
      setSummaryData(data);
    } catch (error) {
      console.error("Error details:", error);
      setSummaryData({ error: `Failed to send link: ${error.message}` });
    } finally {
      setIsLoading(false);
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



        <div className="auth-section">
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
        </div>
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
          placeholder="Enter YouTube link..."
          className="link-input"
          disabled={isLoading}
        />
        <button type="submit" className="submit-button" disabled={isLoading || !link}>
          {isLoading ? (
            <span className="loading-spinner"></span>
          ) : (
            "Submit"
          )}
        </button>
      </form>

      {summaryData && (
        <div className="summary-container">
          <h2 className="summary-title">Travel Summary</h2>
          {summaryData.error ? (
            <div className="summary-error">
              Error: {summaryData.error}
            </div>
          ) : summaryData.summary ? (
            <div className="summary-content">
              {renderSummaryContent(summaryData.summary)}
            </div>
          ) : (
            <div className="summary-loading">
              Processing summary...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Function to render the JSON summary in a structured way
function renderSummaryContent(summaryContent: any): React.ReactNode {
  try {
    console.log("Raw summary content:", summaryContent);

    // Handle different types of content
    let summaryObj;

    if (typeof summaryContent === 'string') {
      // If it's a string, try to parse it as JSON
      try {
        summaryObj = JSON.parse(summaryContent);
        console.log("Parsed JSON from string:", summaryObj);
      } catch (e) {
        // If parsing fails, display the raw string
        console.error("Failed to parse summary as JSON:", e);
        return <pre>{summaryContent}</pre>;
      }
    } else {
      // If it's already an object, use it directly
      summaryObj = summaryContent;
    }

    // Ensure we have an object to work with
    if (!summaryObj || typeof summaryObj !== 'object') {
      console.error("Summary is not a valid object:", summaryObj);
      return <pre>{String(summaryContent)}</pre>;
    }

    return (
      <div className="summary-sections">
        {Object.entries(summaryObj).map(([section, content]: [string, any]) => (
          <div key={section} className="summary-section">
            <h3>{formatSectionTitle(section)}</h3>
            {renderSectionContent(content)}
          </div>
        ))}
      </div>
    );
  } catch (error) {
    console.error("Error rendering summary:", error);
    return <pre>{JSON.stringify(summaryContent, null, 2)}</pre>;
  }
}

// Helper function to render different types of section content
function renderSectionContent(content: any): React.ReactNode {
  // For null or undefined content
  if (content === null || content === undefined) {
    return null;
  }

  // For string content
  if (typeof content === 'string') {
    return <p>{content}</p>;
  }

  // For array content
  if (Array.isArray(content)) {
    return (
      <ul>
        {content.map((item: any, index: number) => (
          <li key={index}>
            {typeof item === 'object' && item !== null
              ? renderObjectItem(item)
              : item}
          </li>
        ))}
      </ul>
    );
  }

  // For object content with 'information' property
  if (typeof content === 'object' && content.information && Array.isArray(content.information)) {
    return (
      <ul>
        {content.information.map((item: string, index: number) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  }

  // For general object content
  if (typeof content === 'object') {
    return (
      <div className="nested-content">
        {Object.entries(content).map(([key, value]: [string, any], index) => (
          <div key={index} className="nested-item">
            <h4>{formatSectionTitle(key)}</h4>
            {renderSectionContent(value)}
          </div>
        ))}
      </div>
    );
  }

  // Fallback for other types
  return <p>{String(content)}</p>;
}

// Helper function to render object items in lists
function renderObjectItem(item: any): React.ReactNode {
  if (item.name) {
    return (
      <div>
        <strong>{item.name}</strong>
        {item.description && <p>{item.description}</p>}
        {item.recommendation && <p><em>Recommendation: </em>{item.recommendation}</p>}
        {item.note && <p><em>Note: </em>{item.note}</p>}
        {Object.entries(item)
          .filter(([key]) => !['name', 'description', 'recommendation', 'note'].includes(key))
          .map(([key, value]) => (
            <div key={key} className="sub-item">
              <strong>{formatSectionTitle(key)}: </strong>
              {typeof value === 'object'
                ? renderSectionContent(value)
                : String(value)}
            </div>
          ))}
      </div>
    );
  }

  return (
    <div>
      {Object.entries(item).map(([key, value]) => (
        <div key={key} className="sub-item">
          <strong>{formatSectionTitle(key)}: </strong>
          {typeof value === 'object'
            ? renderSectionContent(value)
            : String(value)}
        </div>
      ))}
    </div>
  );
}

// Helper function to format section titles
function formatSectionTitle(title: string): string {
  return title
    .split('_')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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