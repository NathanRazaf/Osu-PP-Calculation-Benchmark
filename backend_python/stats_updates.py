from pymongo import UpdateOne
from graph_mongo_models.statsGraphModels import ErrorStatsModel, OutlierDistributionGraphModel, OutlierModel
from datetime import datetime   
from concurrent.futures import ThreadPoolExecutor

def update_stats_on_all_ranges(newDoc):
    actualPP = newDoc['actualPP']

    finalRanges = []
    increments = list(range(0, 1001, 200)) + [100000]

    # Generate all the ranges the actualPP falls into
    for i in increments:
        for j in increments:
            if i < j and i <= actualPP < j:
                finalRanges.append((i, j))

    thresholds = [i * 200 for i in range(1, 5)]  # From 200 to 800

    # Use ThreadPoolExecutor for parallel processing
    with ThreadPoolExecutor() as executor:
        # Prepare tasks for error stats
        error_futures = [
            executor.submit(update_error_stats_bulk, newDoc, minPP, maxPP)
            for minPP, maxPP in finalRanges
        ]

        # Prepare tasks for outlier stats
        outlier_futures = [
            executor.submit(update_outlier_stats_bulk, newDoc, minPP, maxPP, threshold)
            for minPP, maxPP in finalRanges
            for threshold in thresholds
        ]

        # Collect results for bulk write
        error_updates = [future.result() for future in error_futures]
        outlier_updates = [future.result() for future in outlier_futures]

    # Perform bulk operations
    if error_updates:
        ErrorStatsModel._get_collection().bulk_write(error_updates)
    if outlier_updates:
        OutlierDistributionGraphModel._get_collection().bulk_write(outlier_updates)


def update_error_stats_bulk(newDoc, minPP, maxPP):
    actualPP = newDoc['actualPP']
    calculators = ['ojsamaPP', 'rosuPP', 'otpcPP']

    # Attempt to find the document
    error_stat = ErrorStatsModel.objects(minPp=minPP, maxPp=maxPP).first()

    if error_stat is None:
        # New document logic
        mae = [abs(actualPP - newDoc[calc]) for calc in calculators]
        rmse = [abs(actualPP - newDoc[calc]) for calc in calculators]  # Initial RMSE is just absolute difference
        mbe = [actualPP - newDoc[calc] for calc in calculators]

        return UpdateOne(
            {'minPp': minPP, 'maxPp': maxPP}, 
            {
                '$setOnInsert': {
                    'minPp': minPP,
                    'maxPp': maxPP,
                    'createdAt': datetime.now(),
                    'dataSize': 1,
                    'mae': mae,
                    'rmse': rmse,
                    'mbe': mbe
                }
            },
            upsert=True  # Create document if it doesn't exist
        )
    else:
        # Existing document logic
        dataSize = error_stat.dataSize
        current_mae = error_stat.mae
        current_rmse = error_stat.rmse
        current_mbe = error_stat.mbe

        # Incrementally calculate new MAE
        new_mae = [
            (current_mae[i] * dataSize + abs(actualPP - newDoc[calc])) / (dataSize + 1)
            for i, calc in enumerate(calculators)
        ]

        # Incrementally calculate new RMSE
        new_rmse = [
            (((current_rmse[i] ** 2) * dataSize + (actualPP - newDoc[calc]) ** 2) / (dataSize + 1)) ** 0.5
            for i, calc in enumerate(calculators)
        ]

        # Incrementally calculate new MBE
        new_mbe = [
            (current_mbe[i] * dataSize + (actualPP - newDoc[calc])) / (dataSize + 1)
            for i, calc in enumerate(calculators)
        ]

        return UpdateOne(
            {'minPp': minPP, 'maxPp': maxPP},  # Filter
            {
                '$set': {
                    'createdAt': datetime.now(),
                    'mae': new_mae,
                    'rmse': new_rmse,
                    'mbe': new_mbe,
                },
                '$inc': {'dataSize': 1}
            }
        )


def update_outlier_stats_bulk(newDoc, minPP, maxPP, errThreshold):
    actualPP = newDoc['actualPP']

    # Calculate errors for each calculator
    errors = {
        'ojsamaPP': abs(actualPP - newDoc['ojsamaPP']),
        'rosuPP': abs(actualPP - newDoc['rosuPP']),
        'otpcPP': abs(actualPP - newDoc['otpcPP']),
    }

    # Prepare outliers for each calculator exceeding the error threshold
    new_outliers = [
        {
            'model': calc,
            'actualPP': actualPP,
            'error': error,
            'createdAt': datetime.now()
        }
        for calc, error in errors.items()
        if error > errThreshold
    ]

    # Build the UpdateOne operation
    
    if OutlierDistributionGraphModel.objects(minPp=minPP, maxPp=maxPP, errorThreshold=errThreshold).count() == 0:
        return UpdateOne(
            {'minPp': minPP, 'maxPp': maxPP, 'errorThreshold': errThreshold},  # Filter
            {
                '$setOnInsert': {
                    'minPp': minPP,
                    'maxPp': maxPP,
                    'errorThreshold': errThreshold,
                    'createdAt': datetime.now(),
                    'top200best': new_outliers if new_outliers else [],
                    'top200worst': new_outliers if new_outliers else []
                }
            },
            upsert=True  # Create document if it doesn't exist
        )
    
    return UpdateOne(
        {'minPp': minPP, 'maxPp': maxPP, 'errorThreshold': errThreshold},  # Filter
        {
            '$push': {
                'top200best': {
                    '$each': new_outliers,
                    '$slice': 200,  # Keep only the top 200 best entries
                    '$sort': {'error': 1}  # Sort by ascending error
                },
                'top200worst': {
                    '$each': new_outliers,
                    '$slice': 200,  # Keep only the top 200 worst entries
                    '$sort': {'error': -1}  # Sort by descending error
                }
            }
        }
    )
