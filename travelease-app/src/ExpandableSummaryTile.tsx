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

// Type definitions to help TypeScript
interface SummaryDetails {
  details?: string[];
  description?: string;
  [key: string]: any;
}

const ExpandableSummaryTile: React.FC<ExpandableSummaryTileProps> = ({
  summary,
  renderSummaryContent,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  const toggleExpansion = () => {
    setExpanded(!expanded);
  };

  // Extract a meaningful title from the content
  const getTitle = (content: string): string => {
    try {
      let contentObj;
      if (typeof content === "string") {
        contentObj = JSON.parse(content);
      } else {
        contentObj = content;
      }

      // If it's an object with keys, use the first key as the title
      if (typeof contentObj === "object" && contentObj !== null) {
        const keys = Object.keys(contentObj);
        if (keys.length > 0) {
          // Find a potentially more meaningful key (look for a title-like key)
          const titleKeys = ["title", "name", "destination", "location", "city", "place"];
          const foundTitleKey = keys.find(key => 
            titleKeys.some(titleKey => key.toLowerCase().includes(titleKey))
          );
          
          // If we found a title-like key, use it, otherwise use the first key
          return formatTitle(foundTitleKey || keys[0]);
        }
      }

      return "Travel Summary";
    } catch (e) {
      return "Travel Summary";
    }
  };

  // Get a preview of the content to display when collapsed - showing more text
  const getContentPreview = (content: string): string => {
    try {
      let contentObj;
      if (typeof content === "string") {
        contentObj = JSON.parse(content);
      } else {
        contentObj = content;
      }

      if (typeof contentObj === "object" && contentObj !== null) {
        // Gather all detail texts from the content object
        let allDetails: string[] = [];
        
        // Process all sections to extract details
        for (const [key, value] of Object.entries(contentObj)) {
          if (typeof value === "object" && value !== null) {
            // Cast to our helper interface to access properties safely
            const section = value as SummaryDetails;
            
            // If it has details array, add them to our collection
            if (Array.isArray(section.details) && section.details.length > 0) {
              allDetails = [...allDetails, ...section.details];
            }
            
            // If it has a description field, add it too
            if (section.description) {
              allDetails.push(section.description);
            }
          } else if (Array.isArray(value) && value.length > 0) {
            // If the value is an array, add all items
            allDetails = [...allDetails, ...value.map(item => String(item))];
          } else if (value) {
            // If it's a simple value, add it
            allDetails.push(String(value));
          }
        }
        
        // If we collected any details, use them
        if (allDetails.length > 0) {
          // Take up to 5 details and join them
          return allDetails.slice(0, 5).join('. ');
        }

        // Fallback: Convert the first section to string
        const firstKey = Object.keys(contentObj)[0];
        if (firstKey) {
          const firstValue = contentObj[firstKey];
          if (typeof firstValue === "object" && firstValue !== null) {
            return JSON.stringify(firstValue).slice(0, 150) + "...";
          } else {
            return String(firstValue);
          }
        }
      }

      return "Click to view full summary details";
    } catch (e) {
      return "Click to view full summary details";
    }
  };

  // Format the title for display
  const formatTitle = (title: string): string => {
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
    <div 
      className={`summary-tile ${expanded ? "expanded" : ""}`} 
      onClick={!expanded ? toggleExpansion : undefined}
    >
      <div className="summary-tile-header">
        <h3>{getTitle(summary.content)}</h3>
        <div className="summary-date">{formatDate(summary.created_at)}</div>
        <span 
          className="expand-icon" 
          onClick={(e) => {
            e.stopPropagation();
            toggleExpansion();
          }}
        >
          {expanded ? "▲" : "▼"}
        </span>
      </div>
      
      {expanded ? (
        <div className="summary-content">
          {renderSummaryContent(summary.content)}
        </div>
      ) : (
        <div className="summary-preview">
          <p>{getContentPreview(summary.content)}</p>
        </div>
      )}
    </div>
  );
};

export default ExpandableSummaryTile;