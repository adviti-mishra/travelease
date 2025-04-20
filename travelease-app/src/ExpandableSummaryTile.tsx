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
interface SummarySection {
  details?: string[];
  description?: string;
  [key: string]: any;
}

interface ContentObject {
  [key: string]: any;
  details?: string[];
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

  // Direct extraction of actual content from the summary
  const getContentPreview = (content: string): string => {
    try {
      // Try parsing the content as JSON
      let parsedContent: ContentObject;
      try {
        parsedContent = typeof content === "string" ? JSON.parse(content) : content;
      } catch (e) {
        console.error("Failed to parse content as JSON:", e);
        return "Click to view travel details";
      }

      // Function to extract text from nested objects
      const extractTextItems = (obj: any): string[] => {
        const items: string[] = [];
        
        if (!obj || typeof obj !== "object") {
          return items;
        }
        
        // Handle different types of objects
        if (Array.isArray(obj)) {
          // If it's an array, add each string item
          obj.forEach(item => {
            if (typeof item === "string") {
              items.push(`• ${item}`);
            } else if (typeof item === "object" && item !== null) {
              // For object items, try to get meaningful properties
              if (item.name || item.title) {
                items.push(`• ${item.name || item.title}`);
              }
            }
          });
        } else {
          // For regular objects, look for useful properties
          Object.entries(obj).forEach(([key, value]) => {
            // Skip description properties
            if (key.toLowerCase() === "description") {
              return;
            }
            
            if (Array.isArray(value)) {
              // Add the key as a header
              items.push(formatTitle(key));
              
              // Add the first few items from the array
              value.slice(0, 3).forEach(item => {
                if (typeof item === "string") {
                  items.push(`• ${item}`);
                }
              });
            } else if (typeof value === "object" && value !== null) {
              // For nested objects, check if they have details
              const typedValue = value as SummarySection;
              if (typedValue.details && Array.isArray(typedValue.details)) {
                items.push(formatTitle(key));
                typedValue.details.slice(0, 3).forEach((detail: any) => {
                  if (typeof detail === "string") {
                    items.push(`• ${detail}`);
                  }
                });
              }
            }
          });
        }
        
        return items;
      };

      // Start extracting content
      let contentLines: string[] = [];
      
      // Process different content structures
      if (typeof parsedContent === "object" && parsedContent !== null) {
        // Try to find the most important sections
        const getTopLevelDetails = (): string[] | null => {
          // Look for details at the top level
          if (parsedContent.details && Array.isArray(parsedContent.details)) {
            return [`Details:`, ...parsedContent.details.slice(0, 4).map(d => `• ${d}`)];
          }
          return null;
        };
        
        // Check for specific structure types we know about
        const trySpecificStructures = (): string[] | null => {
          // Travel-specific structure with sections like getting_to_nyc, etc.
          const travelKeys = ['getting_to_nyc', 'commuting_within_nyc', 'tourist_attractions', 
                             'food_and_dining', 'safety_tips', 'broadways_and_shows'];
          
          for (const key of travelKeys) {
            if (parsedContent[key] && typeof parsedContent[key] === 'object') {
              const section = parsedContent[key] as SummarySection;
              if (section.details && Array.isArray(section.details)) {
                return [formatTitle(key) + ':', ...section.details.slice(0, 4).map(d => `• ${d}`)];
              }
            }
          }
          return null;
        };

        // Try different extraction strategies
        const topLevelDetails = getTopLevelDetails();
        const specificStructure = trySpecificStructures();
        
        if (topLevelDetails) {
          contentLines = topLevelDetails;
        } else if (specificStructure) {
          contentLines = specificStructure;
        } else {
          // Generic extraction for unknown structures
          for (const [key, value] of Object.entries(parsedContent)) {
            if (typeof value === "object" && value !== null) {
              const extracted = extractTextItems(value);
              if (extracted.length > 0) {
                contentLines.push(formatTitle(key) + ":");
                contentLines = [...contentLines, ...extracted.slice(0, 4)];
                contentLines.push(""); // Add spacing
                
                // Stop after getting enough content
                if (contentLines.length >= 10) break;
              }
            }
          }
        }
      }
      
      // If we extracted content, format and return it
      if (contentLines.length > 0) {
        return contentLines.join('\n');
      }
      
      // Fallback for empty content
      return "Tap to view travel details";
      
    } catch (error) {
      console.error("Error extracting content preview:", error);
      return "Click to view travel details";
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
          <pre className="preview-text">{getContentPreview(summary.content)}</pre>
        </div>
      )}
    </div>
  );
};

export default ExpandableSummaryTile;