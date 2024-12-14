from flask import render_template_string, jsonify
from mongoengine import DoesNotExist
from graph_mongo_models.comparisonGraphModels import UserGraphModel, BeatmapGraphModel
from graph_mongo_models.statsGraphModels import ErrorStatsModel, OutlierDistributionGraphModel, OutlierModel
from datetime import datetime


def get_all_stats_from_db():
    # Define expected ranges
    pp_ranges = [
        (0, 200), (200, 400), (400, 600),
        (600, 800), (800, 1000), (1000, 100000),
        (0, 100000)
    ]
    error_thresholds = [200, 400, 600, 800]

    # Initialize response with None for all expected ranges
    response = {
        "distribution": {f"{min_pp}-{max_pp}": 0 for min_pp, max_pp in pp_ranges},
        "errorStats": {f"{min_pp}-{max_pp}": None for min_pp, max_pp in pp_ranges},
        "outliers": {
            f"{min_pp}-{max_pp}": {threshold: None for threshold in error_thresholds}
            for min_pp, max_pp in pp_ranges
        }
    }
    
    # Fetch all documents at once
    all_error_stats = ErrorStatsModel.objects()
    all_outliers = OutlierDistributionGraphModel.objects()

    # Process error stats documents
    for stat in all_error_stats:
        stat_dict = stat.to_mongo().to_dict()
        min_pp = stat_dict['minPp']
        max_pp = stat_dict['maxPp']
        range_key = f"{int(min_pp)}-{int(max_pp)}"
        
        # Add to distribution data
        response["distribution"][range_key] = stat_dict["dataSize"]
        
        # Add to error stats data
        stat_dict['_id'] = str(stat_dict['_id'])
        response["errorStats"][range_key] = stat_dict

    # Process outliers documents
    for outlier in all_outliers:
        outlier_dict = outlier.to_mongo().to_dict()
        min_pp = outlier_dict['minPp']
        max_pp = outlier_dict['maxPp']
        threshold = outlier_dict['errorThreshold']
        range_key = f"{int(min_pp)}-{int(max_pp)}"
        
        # Add the outlier data for this threshold
        outlier_dict['_id'] = str(outlier_dict['_id'])
        response["outliers"][range_key][threshold] = outlier_dict

    return jsonify(response)


def get_errors_data(min_pp, max_pp):
    try:
        error_stats = ErrorStatsModel.objects(minPp=min_pp, maxPp=max_pp).get()
        error_dict = error_stats.to_mongo().to_dict()
        error_dict['_id'] = str(error_dict['_id'])
        return jsonify(error_dict)
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
    

def get_pp_distribution_data():
    try:
        stats = ErrorStatsModel.objects()
        final_dict = {}
        for stat in stats:
            stat_dict = stat.to_mongo().to_dict()
            min_pp = stat_dict['minPp']
            max_pp = stat_dict['maxPp']
            range_key = f"{int(min_pp)}-{int(max_pp)}"
            final_dict[range_key] = stat_dict["dataSize"]

        return jsonify(final_dict)        
    except DoesNotExist:
        return jsonify({ "message": "No data found" }), 404