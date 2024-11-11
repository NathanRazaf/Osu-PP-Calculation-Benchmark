import pandas as pd
import matplotlib.pyplot as plt

def plot_pp_for_user(csv_file, username, pp_cap=2000):
    # Load the CSV data
    data = pd.read_csv(csv_file)
    
    # Filter the data for the given username
    user_data = data[data['username'] == username].reset_index(drop=True)

    # Check if user has any rows
    if user_data.empty:
        print(f"No data found for username: {username}")
        return
    
    # Separate out the outliers above the specified PP cap
    outliers = user_data[(user_data['ojsamaPP'] > pp_cap) | 
                         (user_data['rosuPP'] > pp_cap) | 
                         (user_data['otpcPP'] > pp_cap) |
                         (user_data['actualPP'] > pp_cap)]
    
    # Print outlier information
    if not outliers.empty:
        # Write them into a separate CSV
        outliers.to_csv(f'./data/outliers_{username}.csv', index=False)

    
    # Remove the outliers for the main plot
    user_data = user_data[~user_data.index.isin(outliers.index)]

    # Create a new sequential play ID column from 1 to N (number of plays)
    user_data['playIndex'] = range(1, len(user_data) + 1)
    
    # Extract values for plotting
    play_ids = user_data['playIndex']  # Use sequential play IDs
    ojsama_pp = user_data['ojsamaPP']
    rosu_pp = user_data['rosuPP']
    otpc_pp = user_data['otpcPP']
    actual_pp = user_data['actualPP']

    # Plot each pp type
    plt.figure(figsize=(12, 8))
    
    # Plot ojsamaPP, rosuPP, and otpcPP with unique markers and colors
    plt.plot(play_ids, ojsama_pp, 'o-', color='blue', label='ojsamaPP', alpha=0.6, markersize=3)
    plt.plot(play_ids, rosu_pp, 's-', color='green', label='rosuPP', alpha=0.6, markersize=3)
    plt.plot(play_ids, otpc_pp, 'D-', color='purple', label='otpcPP', alpha=0.6, markersize=3)
    
    # Plot actualPP as larger, more visible points with a bold line
    plt.plot(play_ids, actual_pp, 'o-', color='red', label='actualPP', markersize=5, markeredgecolor='black', linewidth=2)

    # Add labels, title, legend, and grid
    plt.xlabel("Play Order")
    plt.ylabel("Performance Points (PP)")
    plt.title(f"Performance Points Comparison for {username}")
    plt.legend()
    plt.grid(visible=True, linestyle='--', alpha=0.7)

    # Limit the y-axis to a maximum of pp_cap
    plt.ylim(0, pp_cap)

    # Display plot
    plt.show()

# Example usage
plot_pp_for_user('./data/scores.csv', 'mrekk', pp_cap=2000)
