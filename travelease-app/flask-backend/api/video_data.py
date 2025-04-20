import os
import re
import requests
import json
import pinecone
from supadata import Supadata, SupadataError
from dotenv import load_dotenv
from openai import OpenAI
from flask import jsonify
from pinecone import Pinecone
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load environment variables from .env
load_dotenv(override=True)

# Access API keys
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
SUPADATA_API_KEY = os.getenv("SUPADATA_API_KEY")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")  # Set OpenAI API key
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

client = OpenAI()
pc = Pinecone(api_key=PINECONE_API_KEY)

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
    try:
        video_id = extract_video_id(video_url)
        video_details = get_video_details(video_id)
        summary = get_transcript_summary(video_id)  # Returns structured JSON

        if not isinstance(summary, dict):
            return {"error": "Invalid summary format."}

        print("Fetched summary:", summary)

        formatted_summary = "\n".join([
            f"**{key}**:\n- " + "\n- ".join(map(str, value)) 
            if isinstance(value, list) else f"**{key}**:\n{json.dumps(value, indent=2)}"
            for key, value in summary.items()
        ])

        return {"summary": summary} # Return as dictionary instead of list

    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}


def get_transcript_summary(video_id: str):
    "summarizes the raw transcript into neat bullets"

    transcript = get_video_transcript(video_id)
    embed_transcript_with_splitting(video_id=video_id, transcript=transcript)

    response = client.chat.completions.create(
        model="gpt-4o-mini",  # or "gpt-4"
        messages=[
            {"role": "system", "content": "You are an expert at summarizing YouTube transcripts and returns structured JSON."},
            {"role": "user", "content": f"if the video is an itinerary for a certain amount of days: give a day 1 - day n summary for each day of activities and suggested time ranges for each activity and some organized details for each activity make it look nice too. if the video is about best things to do or top places to visit: List each location as a header, and then in the body summarize details about the place using bullet points. if the video is about tips for tourists: summarize the tips and group similar tips together and have a header for each group.:\n\n{transcript}"}
        ],
        response_format={"type": "json_object"}
    )
    structured_json = json.loads(response.choices[0].message.content)
    
    return structured_json


def embed_transcript_with_splitting(video_id, transcript, chunk_size=1000, chunk_overlap=200):
    """
    Split transcript into chunks and embed each chunk using ada-002,
    then store all chunks in Pinecone.
    
    Args:
        video_id (str): YouTube video ID
        transcript (str): Full transcript text
        chunk_size (int): Maximum size of each chunk
        chunk_overlap (int): Overlap between chunks
        
    Returns:
        dict: Status information
    """
    try:
        # Initialize LangChain text splitter
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
        )
        
        # Split the transcript into chunks
        chunks = text_splitter.split_text(transcript)
        print(f"Split transcript into {len(chunks)} chunks")
        
        # Get Pinecone index
        index = pc.Index("travelease")
        
        # Process each chunk and prepare vectors
        vectors = []
        for i, chunk in enumerate(chunks):
            # Create embedding for this chunk
            response = client.embeddings.create(
                model="text-embedding-ada-002",
                input=chunk
            )
            embedding = response.data[0].embedding
            
            # Create unique ID for this chunk
            unique_id = f"transcript-{video_id}-chunk-{i}"
            
            # Create metadata for this chunk
            metadata = {
                "video_id": video_id,
                "type": "transcript_chunk",
                "chunk_index": i,
                "total_chunks": len(chunks),
                "text": chunk[:1000]  # Store beginning of chunk for context
            }
            
            # Add to vectors list
            vectors.append({
                "id": unique_id,
                "values": embedding,
                "metadata": metadata
            })
        
        index.upsert(vectors=vectors)
        
        return {
            "status": "success",
            "message": f"Successfully embedded {len(chunks)} transcript chunks",
            "chunks_count": len(chunks),
            "video_id": video_id
        }
        
    except Exception as e:
        print(f"Error embedding transcript: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        } 