from flask import Blueprint, request
from stats_data import get_errors_data, get_outlier_data, get_pp_distribution_data, get_all_stats_from_db


stats_plotter_bp = Blueprint('stats', __name__)

@stats_plotter_bp.route('/stats/all')
def get_all_stats():
    return get_all_stats_from_db()

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

@stats_plotter_bp.route('/stats/distribution')
def stats_distribution():
    return get_pp_distribution_data()




    
