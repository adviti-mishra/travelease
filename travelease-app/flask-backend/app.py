from flask import Flask, request, jsonify, send_from_directory
import os
import jwt 
from supabase import create_client
import json
from flask_cors import CORS
from api.index import api


# Load Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
# URL for Supabase's JWT public key (for verification)
SUPABASE_JWT_PUBLIC_KEY_URL = f"{SUPABASE_URL}/auth/v1/public"

supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Set Flask to serve React's build directory (go up one level)
app = Flask(__name__)

# Simple CORS configuration that applies to all routes
CORS(app, 
     origins=["http://localhost:3000", "https://travelease-fawn.vercel.app"],
     supports_credentials=True)

# Register the API Blueprint
app.register_blueprint(api, url_prefix='/api')

# Serve React's index.html for the root
@app.route("/")
def serve_frontend():
    return send_from_directory("../build", "index.html")

# Serve all React static files
@app.route("/<path:path>")
def serve_static_files(path):
    # List of static files that don't require authentication
    public_files = ['manifest.json', 'favicon.ico', 'robots.txt']
    if path in public_files:
        return send_from_directory("../build", path)
    
    # For other files, check authentication
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    return send_from_directory("../build", path)

# Specific route for manifest.json
@app.route("/manifest.json")
def serve_manifest():
    return send_from_directory("../build", "manifest.json")

# Decode JWT and get user ID
def get_user_id():
    auth_header = request.headers.get("Authorization")
    print("Authorization header:", auth_header)

    if not auth_header:
        print("Missing Authorization header")
        return None

    token = auth_header.split("Bearer ")[-1]
    print("Extracted token:", token[:20] + "...")

    try:
        user_response = supabase_client.auth.get_user(token)
        print("Supabase user response:", user_response)

        if user_response and user_response.user:
            print("✅ Authenticated user ID:", user_response.user.id)
            return user_response.user.id
        else:
            print("❌ No user returned in response.")
            return None
    except Exception as e:
        print("❌ Error verifying JWT:", e)
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
    user_id = get_user_id()  # ✅ USE JWT!
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        response = supabase_client.table("summaries") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
        
        return jsonify(response.data), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Run the app
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001, debug=True) 