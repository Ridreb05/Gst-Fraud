import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os
import matplotlib.pyplot as plt

# Ensure directories exist
os.makedirs('data', exist_ok=True)
os.makedirs('models', exist_ok=True)

def engineer_features(df):
    """Calculates derived features for individual invoices."""
    print("Engineering features...")
    # ITC-to-turnover ratio = ITC_Claimed / Invoice_Value
    df['ITC_Ratio'] = df['ITC_Claimed'] / df['Invoice_Value']
    
    # Handle any potential division by zero or NaNs
    df['ITC_Ratio'] = df['ITC_Ratio'].fillna(0)
    return df

def build_entity_profiles(df):
    """
    Creates a summarized profile for each GST entity to establish a baseline.
    Corresponds to STEP 2 of the flowchart.
    """
    print("Building entity profiles...")
    
    # Aggregate per GSTIN
    entity_profile = df.groupby('GSTIN').agg(
        Avg_Invoice_Value=('Invoice_Value', 'mean'),
        Std_Invoice_Value=('Invoice_Value', 'std'),
        Total_ITC_Claimed=('ITC_Claimed', 'sum'),
        Avg_ITC_Ratio=('ITC_Ratio', 'mean'),
        Total_Refund=('Refund_Claimed', 'sum'),
        Transaction_Frequency=('Invoice_Value', 'count')
    ).reset_index()
    
    # Fill NaN std deviations (happens if an entity only has 1 transaction) with 0
    entity_profile['Std_Invoice_Value'] = entity_profile['Std_Invoice_Value'].fillna(0)
    
    # Store: entity_profile_table
    profile_path = 'data/entity_profiles.csv'
    entity_profile.to_csv(profile_path, index=False)
    print(f"✅ Entity profiles saved to {profile_path}")
    
    return entity_profile

def train_isolation_forest(df):
    """
    Trains the anomaly detection model (Isolation Forest) on invoice features.
    """
    print("Training Isolation Forest model...")
    
    # Features we want the model to look at
    features = ['Invoice_Value', 'ITC_Claimed', 'ITC_Ratio', 'Refund_Claimed']
    X = df[features]
    
    # Initialize and fit the model
    # contamination=0.1 assumes roughly 10% of our historical data might be anomalous
    iso_forest = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
    iso_forest.fit(X)
    
    # Save the trained model
    model_path = 'models/isolation_forest.pkl'
    joblib.dump(iso_forest, model_path)
    print(f"✅ Model saved to {model_path}")
    
    return iso_forest, features

def visualize_anomalies(df, model, features):
    """
    Uses Matplotlib to plot the model's predictions. Great for debugging and presentations.
    """
    print("Generating visualization...")
    # Predict anomalies on the training set (-1 for anomaly, 1 for normal)
    df['Anomaly_Label'] = model.predict(df[features])
    
    plt.figure(figsize=(10, 6))
    
    # Plot normal points
    normal = df[df['Anomaly_Label'] == 1]
    plt.scatter(normal['Invoice_Value'], normal['ITC_Ratio'], c='blue', label='Normal', alpha=0.5, s=20)
    
    # Plot anomalies
    anomalies = df[df['Anomaly_Label'] == -1]
    plt.scatter(anomalies['Invoice_Value'], anomalies['ITC_Ratio'], c='red', label='Anomaly', alpha=0.7, s=40, marker='x')
    
    plt.xlabel('Invoice Value (₹)')
    plt.ylabel('ITC-to-Turnover Ratio')
    plt.title('Isolation Forest Anomaly Detection Results')
    plt.legend()
    plt.grid(True, linestyle='--', alpha=0.6)
    
    # Save the plot
    plt.savefig('data/anomaly_plot.png')
    print("✅ Visualization saved to data/anomaly_plot.png")
    plt.show()

if __name__ == "__main__":
    # 1. Load historical dataset (CSV)
    try:
        df = pd.read_csv('data/historical_invoices.csv')
    except FileNotFoundError:
        print("❌ Error: data/historical_invoices.csv not found. Run dataset_generator.py first.")
        exit()
        
    # 2. Preprocess and Engineer Features
    df = engineer_features(df)
    
    # 3. Build Entity Profiles (Step 2)
    profiles = build_entity_profiles(df)
    
    # 4. Train Model
    model, features = train_isolation_forest(df)
    
    # 5. Visualize
    visualize_anomalies(df, model, features)
