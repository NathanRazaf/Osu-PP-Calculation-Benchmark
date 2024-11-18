import plotly.graph_objects as go
import numpy as np

def plot_errors_bar_chart(results):
    """
    Generates a Plotly bar chart for MAE, RMSE (log-transformed), and other metrics across calculators.
    Returns the chart as an HTML div.
    """
    calculators = ['ojsamaPP', 'rosuPP', 'otpcPP']
    
    # Extract metric values
    mae_values = [results['mae'][calc] for calc in calculators] 
    rmse_values = [results['rmse'][calc] for calc in calculators]
    mbe_values = [results['mbe'][calc] for calc in calculators]
    medae_values = [results['medae'][calc] for calc in calculators]
    data_size = results['data_size']
    
    # Create bar chart
    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=calculators,
        y=mae_values,
        name='Mean Absolute Error',
        marker=dict(color='blue')
    ))
    fig.add_trace(go.Bar(
        x=calculators,
        y=rmse_values,
        name='Root Mean Squared Error',
        marker=dict(color='orange')
    ))
    fig.add_trace(go.Bar(
        x=calculators,
        y=mbe_values,
        name='Mean Bias Error',
        marker=dict(color='purple')
    ))
    fig.add_trace(go.Bar(
        x=calculators,
        y=medae_values,
        name='Median Absolute Error',
        marker=dict(color='green')
    ))
    fig.update_layout(
        title=f"Performance Metrics Comparison<br>Data Points: {data_size}",
        xaxis_title="Calculators",
        yaxis_title="Error Value",
        barmode='group',
        template="plotly_dark"
    )
    
    # Return the HTML div
    return fig.to_html(full_html=False)


def plot_error_distribution(data):
    errors = {
        "ojsamaPP": abs(data['ojsamaPP'] - data['actualPP']),
        "rosuPP": abs(data['rosuPP'] - data['actualPP']),
        "otpcPP": abs(data['otpcPP'] - data['actualPP'])
    }
    fig = go.Figure()
    for calc, error in errors.items():
        fig.add_trace(go.Box(y=error, name=calc, boxmean="sd"))
    fig.update_layout(
        title="Error Distribution Per Calculator",
        yaxis_title="Error (|Calculated PP - Actual PP|)",
        template="plotly_dark"
    )
    return fig.to_html(full_html=False)


def plot_outlier_distribution(outliers_df):
    fig = go.Figure()
    for model in outliers_df['model'].unique():
        model_data = outliers_df[outliers_df['model'] == model]
        fig.add_trace(go.Scatter(
            x=model_data['actualPP'],
            y=model_data['error'],
            mode='markers',
            name=model,
            showlegend=True
        ))

    fig.update_layout(
        title="Outlier Distribution by Model",
        xaxis_title="Actual PP",
        yaxis_title="Error Magnitude",
        template="plotly_dark"
    )
    return fig.to_html(full_html=False)
