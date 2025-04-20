import React, { useState } from "react";
import "./past_style.css";

interface ExpandableSummaryTileProps {
  summary: {
    id: number;
    content: string;
    created_at?: string;
  };
  renderSummaryContent: (content: any) => React.ReactNode;
}

const ExpandableSummaryTile: React.FC<ExpandableSummaryTileProps> = ({
  summary,
  renderSummaryContent,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  const toggleExpansion = () => {
    setExpanded(!expanded);
  };

  // Get a preview of the content
  const getPreview = (content: string) => {
    try {
      let contentObj;
      if (typeof content === "string") {
        contentObj = JSON.parse(content);
      } else {
        contentObj = content;
      }

      // Get the first section name if it's an object
      if (typeof contentObj === "object" && contentObj !== null) {
        const firstKey = Object.keys(contentObj)[0];
        if (firstKey) {
          return formatSectionTitle(firstKey);
        }
      }

      return "Summary";
    } catch (e) {
      return "Summary";
    }
  };

  // Format section title (copied from the existing function)
  const formatSectionTitle = (title: string): string => {
    return title
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={`summary-tile ${expanded ? "expanded" : ""}`} onClick={toggleExpansion}>
      <div className="summary-tile-header">
        <h3 className="summary-title">{getPreview(summary.content)}</h3>
        {summary.created_at && (
          <div className="summary-date">{formatDate(summary.created_at)}</div>
        )}
        <span className="expand-icon">{expanded ? "▼" : "▶"}</span>
      </div>
      
      {expanded && (
        <div className="summary-content">
          {renderSummaryContent(summary.content)}
        </div>
      )}
      
      {!expanded && (
        <div className="summary-preview">
          <p>Click to view details</p>
        </div>
      )}
    </div>
  );
};

export default ExpandableSummaryTile;