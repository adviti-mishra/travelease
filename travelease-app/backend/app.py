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

    try:
        # Process the video link
        result = fetch_video_data(video_link)
        
        # Make sure we're returning proper JSON, not a string
        if isinstance(result, dict) and 'summary' in result:
            # If summary is a string containing JSON, parse it
            if isinstance(result['summary'], str) and result['summary'].startswith('{'):
                import json
                try:
                    # Parse the JSON string into a Python object
                    parsed_summary = json.loads(result['summary'])
                    # Return the parsed JSON directly
                    return jsonify({"summary": parsed_summary})
                except json.JSONDecodeError:
                    # If parsing fails, return the original result
                    return jsonify(result)
        
        # Return the original result if no special handling needed
        return jsonify(result)
    except Exception as e:
        # Log the error for debugging
        app.logger.error(f"Error processing link: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/test', methods=['GET'])
def test():
    # Simple endpoint to test if server is running
    return jsonify({"status": "Server is running correctly"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)