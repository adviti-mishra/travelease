import React, { useState } from 'react';
import './style.css';
import './pastsummaries.tsx'

function App() {

  const [link, setLink] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Link Submitted: ${link}`);


    try {
      const response = await fetch("http://127.0.0.1:5000/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ link }), // Send the link to the backend
      });

      const data = await response.text(); // Read response as text
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
          <img src="/api/placeholder/60/60" alt="Profile" className="profile-image" />
        </div>
        <div className="logo-section">
          <h1 className="logo-text">TravelEase</h1>
          <div className="divider"></div>
          <h2 className="tagline">Summarize Link</h2>
        </div>
        <div className="history-section">
          <button className="history-button">
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
};

export default App;