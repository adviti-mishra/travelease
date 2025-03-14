from flask import Flask, request, jsonify
from flask_cors import CORS
from video_data import fetch_video_data  
import os
import jwt 
from supabase import create_client
import json

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)


app = Flask(__name__)
CORS(app)  # Allows requests from frontend

# Function to decode JWT and get user ID
def get_user_id():
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    token = auth_header.split("Bearer ")[-1]
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})  # Do proper verification in production
        return decoded.get("sub")  # Supabase stores user ID in 'sub'
    except jwt.DecodeError:
        return None

@app.route("/summaries", methods=["POST"])
def store_summary():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    content = data.get("content")
    
    if not content:
        return jsonify({"error": "Content is required"}), 400

    response = supabase_client.table("summaries").insert({
        "user_id": user_id,  # Store the user's UUID
        "content": content
    }).execute()

    return jsonify(response.data), 201

@app.route("/summaries", methods=["GET"])
def get_summaries():
    user_id = request.args.get("user_id")  
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    try:
        response = supabase_client.table("summaries") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
        
        return jsonify(response.data), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/process', methods=['POST'])
def process():
    data = request.json  # Get JSON data from frontend
    video_link = data.get('link')

    if not video_link:
        return jsonify({"error": "No link provided"}), 400
    
    user_id = get_user_id()  # Extract user ID from the request
    if not user_id:
        return jsonify({"error": "Unauthorized. Please log in."}), 401

    result = fetch_video_data(video_link)

    # Ensure result is correctly formatted as an object
    if not result or not isinstance(result, list) or not result[0]:
        return jsonify({"error": "Failed to generate summary"}), 500

    formatted_result = {"summary": result[0]}  # Wrap in an object with "summary" key

    # Insert summary into the Supabase database
    try:
        response = supabase_client.table("summaries").insert({
            "user_id": user_id,
            "content": json.dumps(result)  # Convert dictionary to JSON string for storage
        }).execute()

    except Exception as db_error:
        return jsonify({"error": f"Database insert failed: {str(db_error)}"}), 500
    return jsonify(formatted_result)  # Send JSON back to frontend

if __name__ == '__main__':
    app.run(debug=True, port=5000)
