import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './past_style.css';
import summariesData from './data.json';

interface SummarySummary {
  id: number;
  title: string;
  displayTitle: string;
  description: string;
  imageUrl: string;
}

const PastSummaries: React.FC = () => {
  const navigate = useNavigate();
  
  const [summaries, setSummaries] = useState<SummarySummary[]>([]);
  
  useEffect(() => {
    setSummaries(summariesData.summaries);
  }, []);
  
  return (
    <div className="past-container">
      <div className="past-header">
        <div className="profile-circle">
          <img src="/" alt="Profile" className="profile-image" />
        </div>
        
        <div className="past-title-container">
          <h1 className="past-title">TravelEase</h1>
          <div className="past-divider"></div>
          <h2 className="past-subtitle">Past Summaries</h2>
        </div>
        
        <div className="insert-link-section" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="insert-link-button" 
            onClick={() => navigate('/')}
          >
            Insert Link <span className="arrow">&gt;</span>
          </button>
        </div>
      </div>
      
      <div className="summaries-list">
        {summaries.map((summary) => (
          <div key={summary.id} className="summary-card">
            <div className="summary-image-container">
              <img
                src={summary.imageUrl}
                alt={summary.title}
                className="summary-image"
              />
              <div className="image-overlay">
                <span className="image-title">{summary.displayTitle}</span>
              </div>
            </div>
            <div className="summary-content">
              <p className="summary-description">{summary.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PastSummaries;