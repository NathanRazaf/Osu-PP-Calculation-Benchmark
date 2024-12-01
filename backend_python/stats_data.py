from flask import render_template_string, jsonify
from stats_calculations import calculate_metrics, identify_outliers
from mongoengine import DoesNotExist
from graph_mongo_models.comparisonGraphModels import UserGraphModel, BeatmapGraphModel
from graph_mongo_models.statsGraphModels import ErrorStatsModel, OutlierDistributionGraphModel, OutlierModel
from datetime import datetime

def get_errors_data(min_pp, max_pp):
    try:
        error_stats = ErrorStatsModel.objects(minPp=min_pp, maxPp=max_pp).get()
        error_dict = error_stats.to_mongo().to_dict()
        error_dict['_id'] = str(error_dict['_id'])
    except DoesNotExist:
        return jsonify({ "message": "No data found" }), 404
    
def get_outlier_data(min_pp, max_pp, err_threshold):
    try:
        outlier_data = OutlierDistributionGraphModel.objects(minPp=min_pp, maxPp=max_pp, errorThreshold=err_threshold).get()
        outlier_dict = outlier_data.to_mongo().to_dict()
        outlier_dict['_id'] = str(outlier_dict['_id'])
        return jsonify(outlier_dict)
    except DoesNotExist:
        return jsonify({"message": "No data found"}), 404