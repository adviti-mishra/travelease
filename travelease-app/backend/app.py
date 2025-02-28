from flask import Flask, request, jsonify
from flask_cors import CORS
from video_data import fetch_video_data  

app = Flask(__name__)
CORS(app)  # Allows requests from frontend

@app.route('/process', methods=['POST'])
def process():
    data = request.json  # Get JSON data from frontend
    video_link = data.get('link')

    if not video_link:
        return jsonify({"error": "No link provided"}), 400

    # Process the video link (assuming process_video function returns a JSON object)
    fetch_video_data(video_link)

    return "^ success?"  # Send JSON back to frontend

if __name__ == '__main__':
    app.run(debug=True, port=5000)
