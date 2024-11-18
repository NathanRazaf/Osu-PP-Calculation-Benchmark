import pandas as pd
from db import collection
import numpy as np

def process_chunk(chunk, stats_dict):
    """
    Processes a chunk of data, updating cumulative sums for MAE, RMSE, MBE, MedAE.
    """
    chunk_size = len(chunk)

    # Filter out outliers
    chunk = chunk[(chunk['ojsamaPP'] < 1e6) & (chunk['rosuPP'] < 1e6) & (chunk['otpcPP'] < 1e6)]

    # Calculate signed, absolute, and squared differences for this chunk
    signed_diff = chunk[['ojsamaPP', 'rosuPP', 'otpcPP']].apply(lambda x: chunk['actualPP'] - x)
    abs_diff = chunk[['ojsamaPP', 'rosuPP', 'otpcPP']].sub(chunk['actualPP'], axis=0).abs().clip(upper=1e6)
    sq_diff = chunk[['ojsamaPP', 'rosuPP', 'otpcPP']].apply(lambda x: (x - chunk['actualPP'])**2)

    # Update cumulative sums
    for col in ['ojsamaPP', 'rosuPP', 'otpcPP']:
        stats_dict['mbe'][col] += signed_diff[col].sum()
        stats_dict['mae'][col] += abs_diff[col].sum()
        stats_dict['rmse'][col] += sq_diff[col].sum()
        stats_dict['abs_diff_list'][col].extend(abs_diff[col].tolist())  # Collect data for MedAE

    return chunk_size

def prepare_data(min_pp=0, max_pp=10000, batch_size=10000):
    """
    Processes the data in batches from the database using a MongoDB cursor.
    Returns cumulative metrics and the total data size.
    """
    query = {'actualPP': {'$gte': min_pp, '$lte': max_pp}}
    cursor = collection.find(query, batch_size=batch_size)

    # Initialize accumulators
    stats_dict = {
        'mae': {'ojsamaPP': 0, 'rosuPP': 0, 'otpcPP': 0},
        'rmse': {'ojsamaPP': 0, 'rosuPP': 0, 'otpcPP': 0},
        'mbe': {'ojsamaPP': 0, 'rosuPP': 0, 'otpcPP': 0},
        'abs_diff_list': {'ojsamaPP': [], 'rosuPP': [], 'otpcPP': []},  # For MedAE
    }
    total_size = 0

    # Accumulate documents into a batch for processing
    batch = []
    for doc in cursor:
        batch.append(doc)
        # Process the batch when it reaches the batch size
        if len(batch) >= batch_size:
            chunk = pd.DataFrame(batch)
            total_size += process_chunk(chunk, stats_dict)
            batch = []  # Reset the batch

    # Process any remaining documents in the final batch
    if batch:
        chunk = pd.DataFrame(batch)
        total_size += process_chunk(chunk, stats_dict)

    # Normalize accumulated metrics
    if total_size > 0:
        for key in stats_dict['mae']:
            stats_dict['mae'][key] /= total_size
            stats_dict['rmse'][key] = (stats_dict['rmse'][key] / total_size)**0.5
            stats_dict['mbe'][key] /= total_size

    return stats_dict, total_size

def calculate_metrics(min_pp=0, max_pp=10000, batch_size=10000):
    """
    Calculates MAE, RMSE, MBE and MedAE for each model.
    """
    stats_dict, data_size = prepare_data(min_pp, max_pp, batch_size)

    if data_size == 0:
        return None

    # Calculate MedAE
    medae = {}
    for col in stats_dict['abs_diff_list']:
        diffs = np.array(stats_dict['abs_diff_list'][col])
        medae[col] = np.median(diffs)

    # Identify the best models for MAE and RMSE
    best_mae = min(stats_dict['mae'], key=stats_dict['mae'].get)
    best_rmse = min(stats_dict['rmse'], key=stats_dict['rmse'].get)

    model_names = {
        'rosuPP': 'RosuPP-js',
        'ojsamaPP': 'OjsamaPP-js',
        'otpcPP': "osu-tools' PerformanceCalculator"
    }

    best_mae_model = model_names.get(best_mae)
    best_rmse_model = model_names.get(best_rmse)

    return {
        'mae': stats_dict['mae'],
        'rmse': stats_dict['rmse'],
        'mbe': stats_dict['mbe'],
        'medae': medae,
        'best_mae_model': best_mae_model,
        'best_rmse_model': best_rmse_model,
        'data_size': data_size,
    }

def identify_outliers(min_pp=0, max_pp=10000, error_threshold=2000, batch_size=10000):
    query = {'actualPP': {'$gte': min_pp, '$lte': max_pp}}
    cursor = collection.find(query, batch_size=batch_size)
    
    outliers = []
    for doc in cursor:
        for model in ['ojsamaPP', 'rosuPP', 'otpcPP']:
            error = abs(doc[model] - doc['actualPP'])
            if error > error_threshold:
                outliers.append({
                    'model': model,
                    'actualPP': doc['actualPP'],
                    'predictedPP': doc[model],
                    'error': error
                })

    return pd.DataFrame(outliers)


def fetch_all_rows(min_pp=0, max_pp=10000, batch_size=10000):
    """
    Fetches all rows within a specified PP range from the database.
    Uses batching for memory efficiency.
    """
    query = {'actualPP': {'$gte': min_pp, '$lte': max_pp}}
    cursor = collection.find(query, batch_size=batch_size)

    # List to collect batches of rows
    all_rows = []

    # Fetch data in batches
    for doc in cursor:
        all_rows.append(doc)
        # Process the batch when it reaches the batch size
        if len(all_rows) >= batch_size:
            yield pd.DataFrame(all_rows)  # Yield the current batch as a DataFrame
            all_rows = []  # Reset the batch

    # Process any remaining rows in the final batch
    if all_rows:
        yield pd.DataFrame(all_rows)
        

def get_full_data(min_pp=0, max_pp=10000, batch_size=10000):
    """
    Fetches all rows within a specified PP range and combines them into a single DataFrame.
    """
    batches = fetch_all_rows(min_pp=min_pp, max_pp=max_pp, batch_size=batch_size)
    return pd.concat(batches, ignore_index=True) if batches else pd.DataFrame()
