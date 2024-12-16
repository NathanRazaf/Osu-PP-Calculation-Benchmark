import pandas as pd
from db import db
from flask import jsonify

def get_pp_data(identifier, is_username):
    query = {'username': identifier} if is_username else {'beatmapId': int(identifier)}
    cursor = db['userscores' if is_username else 'beatmapscores'].find_one(query)
    if cursor is None:
        return jsonify({"message": "No data found"}), 404
    
    data = pd.DataFrame(list(cursor['scores']))

    if data.empty:
        return jsonify({"message": "No data found"}), 404

    # Remove outliers
    max_pp = max(data['actualPP'])
    data = data[(data['ojsamaPP'] < 2 * max_pp) & (data['rosuPP'] < 2 * max_pp) & (data['otpcPP'] < 2 * max_pp)]
    data['playIndex'] = range(1, len(data) + 1)
    pp_min = min(data['ojsamaPP'].min(), data['rosuPP'].min(), data['otpcPP'].min(), data['actualPP'].min()) - 50
    pp_cap = max(max_pp, data['ojsamaPP'].max(), data['rosuPP'].max(), data['otpcPP'].max()) + 50

    # Return the jsonified data
    final_data = {
        "playIndex": list(data['playIndex']),
        "ojsamaPP": list(data['ojsamaPP']),
        "rosuPP": list(data['rosuPP']),
        "otpcPP": list(data['otpcPP']),
        "actualPP": list(data['actualPP']),
        "pp_min": pp_min,
        "pp_cap": pp_cap
    }
    
    return jsonify(final_data)

