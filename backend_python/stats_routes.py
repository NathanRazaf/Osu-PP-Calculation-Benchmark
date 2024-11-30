from flask import Blueprint, request, jsonify
from stats_data import get_errors_data, get_outlier_data
from stats_updates import update_stats_on_all_ranges


stats_plotter_bp = Blueprint('stats', __name__)


@stats_plotter_bp.route('/stats/errors')
def stats_error_chart():
    min_pp = request.args.get("min_pp", type=int, default=0)
    max_pp = request.args.get("max_pp", type=int, default=100000)

    return get_errors_data(min_pp, max_pp)


@stats_plotter_bp.route('/stats/outliers')
def stats_outliers():
    min_pp = request.args.get("min_pp", type=int, default=0)
    max_pp = request.args.get("max_pp", type=int, default=100000)
    err_threshold = request.args.get("err_threshold", type=int, default=700)

    return get_outlier_data(min_pp, max_pp, err_threshold)


@stats_plotter_bp.route('/stats/update', methods=['POST'])
def update_all_stats():
    # Get the document from the request's body
    doc = request.get_json()  
    if doc is None:
        return jsonify({ "message": "No document provided" }), 400

    # Update the stats with the document
    update_stats_on_all_ranges(doc)  

    return jsonify({ "message": "Stats updated" })


    
