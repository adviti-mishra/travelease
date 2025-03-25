from flask import Flask, request, jsonify, send_from_directory
from video_data import fetch_video_data  
import os
import jwt 
from supabase import create_client
import json
from flask_cors import CORS

# Load Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Set Flask to serve React's build directory (go up one level)
app = Flask(__name__, static_folder="../build", static_url_path="")

CORS(app, supports_credentials=True, origins=["http://localhost:5001"])

# Serve React's index.html for the root
@app.route("/")
def serve_frontend():
    return send_from_directory("../build", "index.html")

# Serve all React static files
@app.route("/<path:path>")
def serve_static_files(path):
    return send_from_directory("../build", path)

# Decode JWT and get user ID
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

# Store summary in Supabase
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

# Get summaries from Supabase
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
    
# Process video data
@app.route('/process', methods=['POST'])
def process():
    data = request.json  
    video_link = data.get('link')
    print("Received link:", video_link)

    if not video_link:
        print("Error: No link provided")
        return jsonify({"error": "No link provided"}), 400
    
    user_id = get_user_id()  
    print("Extracted user ID:", user_id)
    
    if not user_id:
        print("Error: Unauthorized access")
        return jsonify({"error": "Unauthorized. Please log in."}), 401

    result = fetch_video_data(video_link)
    print("Fetched video data:", result)

    if not result or "summary" not in result or not isinstance(result["summary"], dict):
        print("Error: fetch_video_data returned an invalid response format")
        return jsonify({"error": "Failed to generate summary"}), 500

    formatted_result = {"summary": result["summary"]}  

    try:
        response = supabase_client.table("summaries").insert({
            "user_id": user_id,
            "content": json.dumps(result["summary"])  
        }).execute()
        print("Database insert response:", response)
    except Exception as db_error:
        print("Database insert failed:", db_error)
        return jsonify({"error": f"Database insert failed: {str(db_error)}"}), 500

    return jsonify(formatted_result)

# Run the app
if __name__ == '__main__':
        app.run(host="0.0.0.0", port=5001, debug=True)
