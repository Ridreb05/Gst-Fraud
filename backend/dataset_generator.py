import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os
import matplotlib.pyplot as plt

os.makedirs('data', exist_ok=True)

def generate_gst_data(num_entities=100, days=365):
    data = []
    start_date = datetime(2025, 1, 1)
    
    # Defining Entity Profiles
    # 80% Normal, 10% Seasonal, 10% Fraudulent
    entity_types = (
        ['normal'] * int(num_entities * 0.8) + 
        ['seasonal'] * int(num_entities * 0.1) + 
        ['fraud'] * int(num_entities * 0.1)
    )
    random.shuffle(entity_types)
    
    gstins = [f"27ABCDE{str(i).zfill(4)}F1Z{random.randint(1,9)}" for i in range(num_entities)]
    entity_mapping = dict(zip(gstins, entity_types))

    for gstin, e_type in entity_mapping.items():
        # Base metrics per entity
        base_invoice_val = np.random.uniform(50000, 500000)
        base_itc_ratio = np.random.uniform(0.05, 0.18) # Normal ITC is 5-18% of invoice
        
        for day in range(days):
            current_date = start_date + timedelta(days=day)
            
            if random.random() > 0.3: 
                continue
                
            invoice_val = np.random.normal(base_invoice_val, base_invoice_val * 0.1)
            itc_claimed = invoice_val * np.random.normal(base_itc_ratio, 0.02)
            refund_claimed = 0
            is_fraud = 0
            
            # --- Injecting Behaviors ---
            
            if e_type == 'seasonal' and current_date.month in [9, 10]: # Festive season spike
                invoice_val *= np.random.uniform(2.5, 4.0)
                itc_claimed = invoice_val * np.random.normal(base_itc_ratio, 0.02)
                
            elif e_type == 'fraud':
                # Fraud Pattern 1: Massive ITC Claim vs Invoice Value (Structural Error)
                if random.random() < 0.2:
                    itc_claimed = invoice_val * np.random.uniform(0.8, 1.5) 
                    is_fraud = 1
                
                # Fraud Pattern 2: Huge Invoice Spike out of nowhere
                elif random.random() < 0.1:
                    invoice_val *= np.random.uniform(5.0, 10.0)
                    is_fraud = 1
                    
                # Fraud Pattern 3: High Refund Claim
                if random.random() < 0.15:
                    refund_claimed = itc_claimed * np.random.uniform(0.5, 0.9)
                    is_fraud = 1
            
            # Clean up negatives and formatting
            invoice_val = max(1000, round(invoice_val, 2))
            itc_claimed = max(0, round(itc_claimed, 2))
            refund_claimed = max(0, round(refund_claimed, 2))
            
            data.append([gstin, current_date.strftime("%Y-%m-%d"), invoice_val, itc_claimed, refund_claimed, is_fraud, e_type])

    df = pd.DataFrame(data, columns=['GSTIN', 'Date', 'Invoice_Value', 'ITC_Claimed', 'Refund_Claimed', 'Is_Fraud_Label', 'Entity_Type'])
    
    file_path = 'data/historical_invoices.csv'
    df.to_csv(file_path, index=False)
    print(f"✅ Generated {len(df)} invoices across {num_entities} entities.")
    print(f"💾 Saved to {file_path}")
    
    return df

if __name__ == "__main__":
    print("Generating synthetic GST data...")
    df = generate_gst_data(num_entities=200, days=365)
    
    plt.figure(figsize=(10, 6))
    plt.scatter(df['Invoice_Value'], df['ITC_Claimed'], c=df['Is_Fraud_Label'], cmap='coolwarm', alpha=0.6)
    plt.xlabel('Invoice Value (₹)')
    plt.ylabel('ITC Claimed (₹)')
    plt.title('Invoice Value vs ITC Claimed (Red = Fraudulent Behavior)')
    plt.show()
