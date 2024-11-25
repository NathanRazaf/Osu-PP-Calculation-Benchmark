import pandas as pd
import plotly.graph_objects as go
from db import db

def plot_pp_instance(identifier, is_username, addOjsamaPP=False, addRosuPP=False, addOtpcPP=False, addActualPP=True):
    query = {'username': identifier} if is_username else {'beatmapId': int(identifier)}
    cursor = db['userscores' if is_username else 'beatmapscores'].find_one(query)
    data = pd.DataFrame(list(cursor['scores']))

    if data.empty:
        return None

    # Remove outliers
    max_pp = max(data['actualPP'])
    data = data[(data['ojsamaPP'] < 2 * max_pp) & (data['rosuPP'] < 2 * max_pp) & (data['otpcPP'] < 2 * max_pp)]
    data['playIndex'] = range(1, len(data) + 1)
    pp_min = min(data['ojsamaPP'].min(), data['rosuPP'].min(), data['otpcPP'].min(), data['actualPP'].min()) - 50
    pp_cap = max(max_pp, data['ojsamaPP'].max(), data['rosuPP'].max(), data['otpcPP'].max()) + 50

    # Plotting
    fig = go.Figure()
    if addOjsamaPP:
        fig.add_trace(go.Scatter(x=data['playIndex'], y=data['ojsamaPP'], mode='lines+markers', name='ojsamaPP', line=dict(color='blue')))
    if addRosuPP:
        fig.add_trace(go.Scatter(x=data['playIndex'], y=data['rosuPP'], mode='lines+markers', name='rosuPP', line=dict(color='red')))
    if addOtpcPP:
        fig.add_trace(go.Scatter(x=data['playIndex'], y=data['otpcPP'], mode='lines+markers', name='otpcPP', line=dict(color='purple')))
    if addActualPP:
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
        xaxis_title="Play Rank",
        yaxis_title="Performance Points (PP)",
        yaxis=dict(range=[pp_min, pp_cap]),
        autosize=True,
        hovermode="x unified",
        template="plotly_dark"
    )

    return fig.to_html(full_html=False)

