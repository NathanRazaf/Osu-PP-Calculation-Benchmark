import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from io import BytesIO

CSV_FILE = './data/scores.csv'

def plot_pp(identifier, isUsername):
    # Load the CSV data
    data = pd.read_csv(CSV_FILE)

    id = 'username' if isUsername else 'beatmapId'
    # Filter the data for the given identifier
    csv_data = data[data[id].astype(str) == identifier].reset_index(drop=True)

    if csv_data.empty:
        print(f"No data found for {id}: {identifier}")
        return None
    
    # Set the pp cap
    pp_cap = max(csv_data['actualPP']) + 50
    
    # Separate and save outliers
    outliers = csv_data[(csv_data['ojsamaPP'] > pp_cap) | 
                         (csv_data['rosuPP'] > pp_cap) | 
                         (csv_data['otpcPP'] > pp_cap) |
                         (csv_data['actualPP'] > pp_cap)]
    if not outliers.empty:
        outliers.to_csv(f'./data/outliers.csv', index=False)
    
    csv_data = csv_data[~csv_data.index.isin(outliers.index)]
    csv_data['playIndex'] = range(1, len(csv_data) + 1)
    
    # Prepare plot
    plt.figure(figsize=(12, 8))
    plt.plot(csv_data['playIndex'], csv_data['ojsamaPP'], 'o-', color='blue', label='ojsamaPP', alpha=0.6, markersize=3)
    plt.plot(csv_data['playIndex'], csv_data['rosuPP'], 's-', color='green', label='rosuPP', alpha=0.6, markersize=3)
    plt.plot(csv_data['playIndex'], csv_data['otpcPP'], 'D-', color='purple', label='otpcPP', alpha=0.6, markersize=3)
    plt.plot(csv_data['playIndex'], csv_data['actualPP'], 'o-', color='red', label='actualPP', markersize=5, markeredgecolor='black', linewidth=2)
    plt.xlabel("Play Order")
    plt.ylabel("Performance Points (PP)")
    plt.title(f"Performance Points Comparison for {identifier}")
    plt.legend()
    plt.grid(visible=True, linestyle='--', alpha=0.7)
    plt.ylim(0, pp_cap)

    # Save plot to BytesIO
    img = BytesIO()
    plt.savefig(img, format='png')
    plt.close()
    img.seek(0)
    return img

