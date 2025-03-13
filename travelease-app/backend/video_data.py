import os
import re
import requests
import json
from supadata import Supadata, SupadataError
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env
load_dotenv(override=True)

# Access API keys
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
SUPADATA_API_KEY = os.getenv("SUPADATA_API_KEY")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")  # Set OpenAI API key
print(os.getenv("OPENAI_API_KEY"))

client = OpenAI()

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
    """
    Main function to get video thumbnail and transcript.
    return {
            "video_id": video_id,
            "title": video_details["title"],
            "thumbnail": video_details["thumbnail"],
            "summary": summary
        }
    """
    try:
        video_id = extract_video_id(video_url)
        video_details = get_video_details(video_id)
        summary = get_transcript_summary(video_id)

        return {"summary": summary}

    except Exception as e:
        return {"error": str(e)}

    # print("fvideo_url}")
    # print(f'got the link {video_url}')


def get_transcript_summary(video_id: str):
    "summarizes the raw transcript into neat bullets"

    # For now commented out so we avoid repeated API calls, eventualy remove file stuff
    # transcript = get_video_transcript(video_id)

    # Ensure the file exists before trying to open it

    script_dir = os.path.dirname(os.path.abspath(
        __file__))  # Get the script's directory
    file_path = os.path.join(script_dir, "output.txt")
    print(file_path)

    with open(file_path, "r", encoding="utf-8") as file:
        transcript = file.read()

    if transcript == "Transcript not available":
        return "Summary not available (Transcript missing)."

    # print(transcript)

    response = client.chat.completions.create(
        model="gpt-4o-mini",  # or "gpt-4"
        messages=[
            {"role": "system", "content": "You are an expert at summarizing YouTube transcripts and returns structured JSON."},
            {"role": "user", "content": f"Organize this transcript into sections: getting to NYC, commuting within NYC, TOURIST ATTRACTIONS in NYC, safety tips, food and dining recommendations, brodways and shows, saving money, weather, and miscellaneous tips. Striclty only include the information provided in the video. If the video does not talk aout a certain category, do not include it. Do not use any source outside this transcript for context:\n\n{transcript}"}
        ],
        response_format={"type": "json_object"}
    )
    structured_json = json.loads(response.choices[0].message.content)
    return structured_json


# Example usage
print("Current working directory:", os.getcwd())
video_url = "https://www.youtube.com/watch?v=sqc1v30C6TA"
video_data = fetch_video_data(video_url)
print(video_data)

# print(OPENAI_KEY)
