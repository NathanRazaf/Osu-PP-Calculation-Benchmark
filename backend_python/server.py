from flask import Flask, send_file, request, jsonify
from pp_plotter import plot_pp

app = Flask(__name__)

# Define a route for the root URL "/"
@app.route("/")
def hello_world():
    return "Hello, World!"

@app.route("/visualize")
def visualize():
    identifier = request.args.get('identifier')
    is_username = request.args.get('isUsername', 'false').lower() == 'true'

    if not identifier:
        return jsonify({'error': 'No identifier provided!'}), 400
    
    img = plot_pp(str(identifier), is_username)

    if img is None:
        return jsonify({"error": f"No data found for {'username' if is_username else 'beatmapId'}: {identifier}"}), 404
    
    # Return the image as a response
    return send_file(img, mimetype='image/png')

if __name__ == "__main__":
    app.run(debug=True, port=5000)