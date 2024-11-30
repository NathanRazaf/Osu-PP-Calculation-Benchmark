from flask import Blueprint, request
from graph_calculations import get_pp_data

graph_plotter_bp = Blueprint('graph', __name__)

@graph_plotter_bp.route('/graph/get-pp-data')
def visualize_instance():
    identifier = request.args.get("identifier")
    is_username = request.args.get("isUsername", "false").lower() == "true"
    addOjsamaPP = request.args.get("addOjsamaPP", "false").lower() == "true"
    addRosuPP = request.args.get("addRosuPP", "false").lower() == "true"
    addOtpcPP = request.args.get("addOtpcPP", "false").lower() == "true"
    addActualPP = request.args.get("addActualPP", "true").lower() == "true"

    return get_pp_data(identifier, is_username, addOjsamaPP, addRosuPP, addOtpcPP, addActualPP)

