import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";
import ExpandableSummaryTile from "./ExpandableSummaryTile";
import { BubbleChat } from "flowise-embed-react";
import "./past_style.css";

interface Summary {
  id: number;
  content: string;
  created_at?: string;
}

const PastSummaries: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSummaries = async () => {
      if (!user || !user.id) return; // Ensure user is fully loaded

      setLoading(true);

      const { data, error } = await supabase
        .from("summaries")
        .select("*")
        .order('created_at', { ascending: false }); // Order by created_at descending

      if (error) {
        console.error("Error fetching summaries:", error);
      } else {
        setSummaries(data);
      }

      setLoading(false);
    };

    if (user) {
      fetchSummaries();
    }
  }, [user]); // Run when user updates

  const renderSummaryContent = (summaryContent: any): React.ReactNode => {
    try {
      // Handle different types of content
      let summaryObj;

      if (typeof summaryContent === "string") {
        try {
          summaryObj = JSON.parse(summaryContent);
        } catch (e) {
          return <pre>{summaryContent}</pre>;
        }
      } else {
        summaryObj = summaryContent;
      }

      if (!summaryObj || typeof summaryObj !== "object") {
        return <pre>{String(summaryContent)}</pre>;
      }

      return (
        <div className="summary-sections">
          {Object.entries(summaryObj).map(
            ([section, content]: [string, any]) => (
              <div key={section} className="summary-section">
                <h3>{formatSectionTitle(section)}</h3>
                {renderSectionContent(content)}
              </div>
            )
          )}
        </div>
      );
    } catch (error) {
      return <pre>{JSON.stringify(summaryContent, null, 2)}</pre>;
    }
  };

  const App = () => {
      return (
        <BubbleChat
          chatflowid="6cb7f43f-9562-4c83-876c-99f440e32ee5"
          apiHost="https://atishayk-travelease.hf.space"
        />
      );
  };

  const renderSectionContent = (content: any): React.ReactNode => {
    if (content === null || content === undefined) {
      return null;
    }

    if (typeof content === "string") {
      return <p>{content}</p>;
    }

    if (Array.isArray(content)) {
      return (
        <ul>
          {content.map((item: any, index: number) => (
            <li key={index}>
              {typeof item === "object" && item !== null
                ? renderObjectItem(item)
                : item}
            </li>
          ))}
        </ul>
      );
    }

    if (
      typeof content === "object" &&
      content.information &&
      Array.isArray(content.information)
    ) {
      return (
        <ul>
          {content.information.map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    }

    if (typeof content === "object") {
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

    return <p>{String(content)}</p>;
  };

  const renderObjectItem = (item: any): React.ReactNode => {
    if (item.name) {
      return (
        <div>
          <strong>{item.name}</strong>
          {item.description && <p>{item.description}</p>}
          {item.recommendation && (
            <p>
              <em>Recommendation: </em>
              {item.recommendation}
            </p>
          )}
          {item.note && (
            <p>
              <em>Note: </em>
              {item.note}
            </p>
          )}
          {Object.entries(item)
            .filter(
              ([key]) =>
                !["name", "description", "recommendation", "note"].includes(key)
            )
            .map(([key, value]) => (
              <div key={key} className="sub-item">
                <strong>{formatSectionTitle(key)}: </strong>
                {typeof value === "object"
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
            {typeof value === "object"
              ? renderSectionContent(value)
              : String(value)}
          </div>
        ))}
      </div>
    );
  };

  const formatSectionTitle = (title: string): string => {
    return title
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!user) {
    return (
      <div className="past-container">
        <h2>Please log in to view your summaries.</h2>
      </div>
    );
  }

  return (
    <div className="past-container">
      {/* Video Background */}
      <div className="video-background">
        <video autoPlay loop muted>
          <source src="https://path-to-your-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="past-header">
        <div className="profile-circle">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Profile"
              className="profile-image"
            />
          ) : (
            <img src="/" alt="Profile" className="profile-image" />
          )}
        </div>

        <div className="past-title-container">
          <h1 className="past-title">TravelEase</h1>
          <div className="past-divider"></div>
          <h2 className="past-subtitle">Past Summaries v2</h2>
        </div>

        <div
          className="insert-link-section"
          style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}
        >
          <button className="insert-link-button" onClick={() => navigate("/")}>
            Insert Link <span className="arrow">&gt;</span>
          </button>
        </div>
      </div>

      <div>
        <App></App>
      </div>

      {loading ? (
        <h2 className="loading-summaries">Loading summaries...</h2>
      ) : summaries.length === 0 ? (
        <h2 className="no-summaries">No past summaries found.</h2>
      ) : (
        <div className="summaries-grid">
          {summaries.map((summary) => (
            <ExpandableSummaryTile
              key={summary.id}
              summary={summary}
              renderSummaryContent={renderSummaryContent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PastSummaries;