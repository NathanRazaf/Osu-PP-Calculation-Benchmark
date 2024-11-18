from flask import Blueprint, render_template_string, request
from graph_calculations import plot_pp_instance

graph_plotter_bp = Blueprint('graph_plotter', __name__)

@graph_plotter_bp.route('/visualize-instance')
def visualize_instance():
    identifier = request.args.get("identifier")
    is_username = request.args.get("isUsername", "false").lower() == "true"
    addOjsamaPP = request.args.get("addOjsamaPP", "false").lower() == "true"
    addRosuPP = request.args.get("addRosuPP", "false").lower() == "true"
    addOtpcPP = request.args.get("addOtpcPP", "false").lower() == "true"
    addActualPP = request.args.get("addActualPP", "true").lower() == "true"

    html_graph = plot_pp_instance(identifier, is_username, addOjsamaPP, addRosuPP, addOtpcPP, addActualPP)
    if html_graph is None:
        return render_template_string(
            "<div style='display: flex; justify-content: center; align-items: center; "
            "height: 90vh; color: lightblue; font-size: 1.5em; border:3px solid lightblue;'>"
            "No data found."
            "</div>"
        ), 404

    # Return HTML with embedded graph
    return render_template_string(f"<div style='width: 100%; height: 100%;'>{html_graph}</div>")

