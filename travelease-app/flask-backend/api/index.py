from flask import Blueprint, request, jsonify
from .video_data import fetch_video_data

api = Blueprint('api', __name__)

@api.route('/process', methods=['POST', 'OPTIONS'])
def process():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    data = request.json  
    video_link = data.get('link')
    print("Received link:", video_link)

    if not video_link:
        return jsonify({"error": "No link provided"}), 400

    result = fetch_video_data(video_link)
    if not result or "summary" not in result or not isinstance(result["summary"], dict):
        return jsonify({"error": "Failed to generate summary"}), 500

    return jsonify(result)