from flask import Flask, render_template_string, request
import pandas as pd
import plotly.graph_objects as go
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

client = MongoClient(os.getenv("MONGODB_URI"))
db = client["osu-pp-benchmark-data"]
collection = db["scores"]

def plot_pp(identifier, is_username):
    query = {'username': identifier} if is_username else {'beatmapId': int(identifier)}
    cursor = collection.find(query)
    data = pd.DataFrame(list(cursor))

    if data.empty:
        return None

    # Sort data and process
    data = data.sort_values('actualPP', ascending=False)
    # If some of the values of ojsamaPP, rosuPP or otpcPP are above a certain threshold, we remove the row from the dataframe
    max_pp = max(data['actualPP'])
    data = data[(data['ojsamaPP'] < 2*max_pp) & (data['rosuPP'] < 2*max_pp) & (data['otpcPP'] < 2*max_pp)]
    data['playIndex'] = range(1, len(data) + 1)
    pp_min = min(data['ojsamaPP'].min(), data['rosuPP'].min(), data['otpcPP'].min(), data['actualPP'].min()) - 50
    pp_cap = max(max_pp, data['ojsamaPP'].max(), data['rosuPP'].max(), data['otpcPP'].max()) + 50

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=data['playIndex'], y=data['ojsamaPP'], mode='lines+markers', name='ojsamaPP', line=dict(color='blue')))
    fig.add_trace(go.Scatter(x=data['playIndex'], y=data['rosuPP'], mode='lines+markers', name='rosuPP', line=dict(color='red')))
    fig.add_trace(go.Scatter(x=data['playIndex'], y=data['otpcPP'], mode='lines+markers', name='otpcPP', line=dict(color='purple')))


    fig.add_trace(go.Scatter(
        x=data['playIndex'],
        y=data['actualPP'],
        mode='lines+markers',
        name='actualPP',
        line=dict(width=4, color='limegreen'),        
        marker=dict(size=8, color='limegreen'),      
    ))

    fig.update_layout(
        title=f"Performance Points Calculation Comparison for {'User' if is_username else 'Beatmap'} {identifier}",
        xaxis_title="Play Order",
        yaxis_title="Performance Points (PP)",
        yaxis=dict(range=[pp_min, pp_cap]),
        autosize=True, # Make the figure responsive
        hovermode="x unified"
    )

    return fig.to_html(full_html=False)

@app.route('/visualize')
def visualize():
    identifier = request.args.get("identifier")
    is_username = request.args.get("isUsername", "false").lower() == "true"

    html_graph = plot_pp(identifier, is_username)
    if html_graph is None:
        return render_template_string(
            "<div style='display: flex; justify-content: center; align-items: center; "
            "height: 90vh; color: lightblue; font-size: 1.5em; border:3px solid lightblue;'>"
            "No data found."
            "</div>"
        ), 404

    # Return HTML with embedded graph
    return render_template_string(f"<div style='width: 100%; height: 100%;'>{html_graph}</div>")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
