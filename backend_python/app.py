from flask import Flask
from flask_cors import CORS
from graph_routes import graph_plotter_bp
from stats_routes import stats_plotter_bp

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Register blueprint
app.register_blueprint(graph_plotter_bp)
app.register_blueprint(stats_plotter_bp)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
