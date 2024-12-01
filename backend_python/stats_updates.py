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

    # Use modify with upsert to handle both creation and updates in one step
    error_stat = ErrorStatsModel.objects(minPp=minPP, maxPp=maxPP).modify(
        upsert=True,
        new=True,
        set_on_insert={'minPp': minPP, 'maxPp': maxPP, 'createdAt': datetime.now(), 'dataSize': 0, 'mae': [0] * 3, 'rmse': [0] * 3, 'mbe': [0] * 3},
    )

    dataSize = error_stat.dataSize
    current_mae = error_stat.mae
    current_rmse = error_stat.rmse
    current_mbe = error_stat.mbe

    # Incrementally calculate new MAE, RMSE, and MBE
    new_mae = [
        (current_mae[i] * dataSize + abs(actualPP - newDoc[calc])) / (dataSize + 1)
        for i, calc in enumerate(calculators)
    ]
    new_rmse = [
        (((current_rmse[i] ** 2) * dataSize + (actualPP - newDoc[calc]) ** 2) / (dataSize + 1)) ** 0.5
        for i, calc in enumerate(calculators)
    ]
    new_mbe = [
        (current_mbe[i] * dataSize + (actualPP - newDoc[calc])) / (dataSize + 1)
        for i, calc in enumerate(calculators)
    ]

    # Return the update operation
    return UpdateOne(
        {'minPp': minPP, 'maxPp': maxPP},
        {
            '$set': {'mae': new_mae, 'rmse': new_rmse, 'mbe': new_mbe, 'createdAt': datetime.now()},
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

    # Use modify with upsert to initialize document if it doesn't exist
    outlier_stat = OutlierDistributionGraphModel.objects(
        minPp=minPP, maxPp=maxPP, errorThreshold=errThreshold
    ).modify(
        upsert=True,
        new=True,
        set_on_insert={
            'minPp': minPP,
            'maxPp': maxPP,
            'errorThreshold': errThreshold,
            'createdAt': datetime.now(),
            'top200best': [],
            'top200worst': []
        }
    )

    # Push and slice only if there are new outliers
    if new_outliers:
        return UpdateOne(
            {'minPp': minPP, 'maxPp': maxPP, 'errorThreshold': errThreshold},
            {
                '$push': {
                    'top200best': {
                        '$each': new_outliers,
                        '$slice': 200,
                        '$sort': {'error': 1}
                    },
                    'top200worst': {
                        '$each': new_outliers,
                        '$slice': 200,
                        '$sort': {'error': -1}
                    }
                }
            }
        )

