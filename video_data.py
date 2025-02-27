import os
import re
import requests
from supadata import Supadata, SupadataError
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Access API keys 
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
SUPADATA_API_KEY = os.getenv("SUPADATA_API_KEY")

if not YOUTUBE_API_KEY or not SUPADATA_API_KEY:
    raise ValueError("API keys are missing! Check your .env file.")

# Initialize Supadata client
supadata = Supadata(api_key=SUPADATA_API_KEY)

def extract_video_id(url: str):
    """Extracts the YouTube video ID from a given URL."""
    pattern = r"(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})"
    match = re.search(pattern, url)
    if not match:
        raise ValueError("Invalid YouTube URL")
    return match.group(1)

def get_video_details(video_id: str):
    """Fetches video title and thumbnail using the YouTube API."""
    url = f"https://www.googleapis.com/youtube/v3/videos?id={video_id}&key={YOUTUBE_API_KEY}&part=snippet"
    response = requests.get(url)
    
    if response.status_code != 200:
        raise Exception("Failed to fetch video details")

    data = response.json()
    if "items" not in data or not data["items"]:
        raise Exception("Video not found")

    snippet = data["items"][0]["snippet"]
    return {
        "title": snippet["title"],
        "thumbnail": snippet["thumbnails"]["high"]["url"]
    }

def get_video_transcript(video_id: str):
    """Fetches YouTube video transcript in English using Supadata."""
    try:
        transcript = supadata.youtube.transcript(video_id=video_id, lang="en")
        print(f"Supadata Response: {transcript}")  # Debugging line
        return transcript.content
    except SupadataError as e:
        print(f"Supadata API Error: {e}")  # Print the actual error
        return "Transcript not available"


def fetch_video_data(video_url: str):
    """Main function to get video thumbnail and transcript."""
    try:
        video_id = extract_video_id(video_url)
        video_details = get_video_details(video_id)
        transcript = get_video_transcript(video_id)

        return {
            "video_id": video_id,
            "title": video_details["title"],
            "thumbnail": video_details["thumbnail"],
            "transcript": transcript
        }
    except Exception as e:
        return {"error": str(e)}

# Example usage
video_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
video_data = fetch_video_data(video_url)
print(video_data)
