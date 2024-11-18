from flask import Blueprint, request, render_template_string
from stats_calculations import calculate_metrics, identify_outliers, get_full_data
from stats_plot import plot_errors_bar_chart, plot_outlier_distribution, plot_error_distribution

stats_plotter_bp = Blueprint('stats', __name__)

@stats_plotter_bp.route('/stats/errors')
def stats_error_chart():
    min_pp = request.args.get("min_pp", type=int, default=0)
    max_pp = request.args.get("max_pp", type=int, default=100000)

    results = calculate_metrics(min_pp, max_pp)
    if not results or results['data_size'] == 0:
        return render_template_string(
            "<div style='display: flex; justify-content: center; align-items: center; "
            "height: 90vh; color: lightblue; font-size: 1.5em; border:3px solid lightblue;'>"
            "No data found."
            "</div>"
        )
    # Generate the bar chart
    html_graph = plot_errors_bar_chart(results)

    # Return HTML with embedded graph
    return render_template_string(f"<div style='width: 100%; height: 100%;'>{html_graph}</div>")

@stats_plotter_bp.route('/stats/outliers')
def stats_outliers():
    min_pp = request.args.get("min_pp", type=int, default=0)
    max_pp = request.args.get("max_pp", type=int, default=100000)

    results = identify_outliers(min_pp, max_pp)
    if results.empty:
        return render_template_string(
            "<div style='display: flex; justify-content: center; align-items: center; "
            "height: 90vh; color: lightblue; font-size: 1.5em; border:3px solid lightblue;'>"
            "No outlier found."
            "</div>"
        )
    
    # Generate the outlier distribution plot
    html_graph = plot_outlier_distribution(results)

    # Return HTML with embedded graph
    return render_template_string(f"<div style='width: 100%; height: 100%;'>{html_graph}</div>")


@stats_plotter_bp.route('/stats/error-distribution')
def stats_error_distribution():
    min_pp = request.args.get("min_pp", type=int, default=0)
    max_pp = request.args.get("max_pp", type=int, default=100000)

    results = get_full_data(min_pp, max_pp)
    if results.empty:
        return render_template_string(
            "<div style='display: flex; justify-content: center; align-items: center; "
            "height: 90vh; color: lightblue; font-size: 1.5em; border:3px solid lightblue;'>"
            "No data found."
            "</div>"
        )
    
    # Generate the error distribution plot
    html_graph = plot_error_distribution(results)

    # Return HTML with embedded graph
    return render_template_string(f"<div style='width: 100%; height: 100%;'>{html_graph}</div>")


    
