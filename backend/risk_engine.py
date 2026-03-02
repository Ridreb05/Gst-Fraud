import pandas as pd
import numpy as np
import joblib
import json
import os

class GSTFraudRiskEngine:
    def __init__(self):
        print("Initializing Risk Engine...")
        # Step 1: Initialize System [cite: 2]
        self.load_models_and_data()
        
    def load_models_and_data(self):
        """Loads the pre-trained Isolation Forest and historical entity profiles. [cite: 4, 6]"""
        try:
            self.iso_forest = joblib.load('models/isolation_forest.pkl')
            self.entity_profiles = pd.read_csv('data/entity_profiles.csv')
            self.entity_profiles.set_index('GSTIN', inplace=True)
            print("✅ Models and Profiles loaded successfully.")
        except FileNotFoundError as e:
            print(f"⚠️ Warning: Could not load data/models. {e}")
            self.iso_forest = None
            self.entity_profiles = pd.DataFrame()

    def process_new_invoice(self, new_invoice):
        """
        Main pipeline to process a real-time invoice.
        new_invoice: dict containing GSTIN, Invoice_Value, ITC_Claimed, Refund_Claimed [cite: 41, 42]
        """
        gstin = new_invoice.get("GSTIN")
        invoice_value = new_invoice.get("Invoice_Value", 0)
        itc_claimed = new_invoice.get("ITC_Claimed", 0)
        refund_claimed = new_invoice.get("Refund_Claimed", 0)
        
        current_itc_ratio = itc_claimed / invoice_value if invoice_value > 0 else 0 [cite: 56]
        
        # Step 3: Wait for Incoming Invoice / Identify GSTIN [cite: 32, 36]
        is_new_entity = gstin not in self.entity_profiles.index [cite: 37]
        
        if is_new_entity:
            # COLD START PROTOCOL: Handle brand new businesses
            historical_data = {
                'Avg_Invoice_Value': invoice_value, # Treat current as baseline
                'Std_Invoice_Value': 0,
                'Avg_ITC_Ratio': current_itc_ratio,
                'Total_Refund': 0
            }
        else:
            historical_data = self.entity_profiles.loc[gstin].to_dict() [cite: 44]

        # Step 4: Preprocess & Create Comparison Features [cite: 45, 50]
        avg_inv = historical_data.get('Avg_Invoice_Value', invoice_value)
        std_inv = historical_data.get('Std_Invoice_Value', 1) # Avoid div by zero
        avg_itc_ratio = historical_data.get('Avg_ITC_Ratio', 0.1)
        avg_refund = historical_data.get('Total_Refund', 0)

        invoice_spike = invoice_value / avg_inv if avg_inv > 0 else 1 [cite: 54]
        z_score = (invoice_value - avg_inv) / std_inv if std_inv > 0 else 0 [cite: 55]
        itc_deviation = (current_itc_ratio - avg_itc_ratio) * 100 # In percentage points [cite: 57]
        refund_spike = refund_claimed / avg_refund if avg_refund > 0 else (refund_claimed > 0) [cite: 58]

        # Step 5: Real-Time Invoice Anomaly Check (Rule-Based) [cite: 59, 62]
        rule_risk_score = 0
        risk_drivers = []

        if invoice_spike > 5: [cite: 66]
            rule_risk_score += 20
            risk_drivers.append(f"Invoice Spike ({invoice_spike:.1f}x normal)")
        
        if itc_deviation > 15: # e.g., claiming 30% when average is 10% [cite: 67]
            rule_risk_score += 25
            risk_drivers.append(f"ITC Deviation (+{itc_deviation:.1f}%)")
            
        if refund_spike > 3: [cite: 68]
            rule_risk_score += 20
            risk_drivers.append("Abnormal Refund Request")
            
        if z_score > 3: [cite: 69]
            rule_risk_score += 15
            risk_drivers.append("Statistical Outlier (Z-Score > 3)")

        # Step 5: ML Anomaly Detection [cite: 63]
        ml_risk_score = 0
        if self.iso_forest:
            # Prepare feature array matching the training columns
            features = pd.DataFrame([{
                'Invoice_Value': invoice_value,
                'ITC_Claimed': itc_claimed,
                'ITC_Ratio': current_itc_ratio,
                'Refund_Claimed': refund_claimed
            }])
            
            # Isolation forest returns 1 (normal) or -1 (anomaly)
            prediction = self.iso_forest.predict(features)[0]
            
            # Convert to a 0-100 score [cite: 70]
            if prediction == -1:
                ml_risk_score = 50
                decision_function_score = self.iso_forest.decision_function(features)[0]
                # Lower decision score = more anomalous. Scale it.
                ml_risk_score += min(50, abs(decision_function_score) * 100)
                risk_drivers.append("ML Anomaly Detected")

        # Combine Rule-based and ML score
        invoice_risk_score = min(100, rule_risk_score + (ml_risk_score * 0.5)) [cite: 71]

        # Step 7: Risk Aggregation (Simulated for real-time demo) [cite: 88, 94]
        # In a real app, you'd pull all past invoice scores for this GSTIN from a DB.
        # Here, we blend the current invoice risk with the entity's historical footprint.
        business_risk = invoice_risk_score 
        if not is_new_entity:
            # Simulated Historical Aggregation logic
            avg_risk = historical_data.get('Avg_ITC_Ratio', 0) * 100 # Rough proxy for demo
            business_risk = (0.5 * avg_risk) + (0.3 * invoice_risk_score) + (0.2 * max(avg_risk, invoice_risk_score)) [cite: 94]
            business_risk = min(100, max(0, business_risk))

        # OVERRIDE FIX: Prevent massive fraud from being diluted by averages
        if invoice_risk_score > 90:
            business_risk = max(business_risk, 90)

        # Step 8: Action Decision Engine [cite: 98]
        action = "Monitor"
        category = "Low Risk"
        if business_risk > 80: [cite: 99]
            action = "Audit + Refund Hold"
            category = "Critical Risk"
        elif business_risk > 60: [cite: 99]
            action = "Manual Review"
            category = "High Risk"
        elif business_risk > 30: [cite: 99]
            action = "Auto Notice"
            category = "Medium Risk"

        # Step 10: Generate Structured Output [cite: 107, 100]
        alert = {
            "GSTIN": gstin,
            "Invoice_Risk": round(invoice_risk_score, 2),
            "Business_Risk": round(business_risk, 2),
            "Category": category,
            "Action_Triggered": action, [cite: 111]
            "Top_Risk_Drivers": risk_drivers if risk_drivers else ["Normal Transaction"] [cite: 100]
        }
        
        # Step 9: Update System State (Simulated logging) [cite: 101, 102]
        self._log_transaction(alert)
        
        return alert

    def _log_transaction(self, alert):
        """Simulates logging to a database. [cite: 102]"""
        print(f"\n[LOG] Processed {alert['GSTIN']} | Score: {alert['Business_Risk']} | Action: {alert['Action_Triggered']}")


if __name__ == "__main__":
    # Test the Engine
    engine = GSTFraudRiskEngine()
    
    # 1. Test a totally normal invoice
    normal_invoice = {
        "GSTIN": "27ABCDE0001F1Z1", # Assuming this exists in your generated CSV
        "Invoice_Value": 100000,
        "ITC_Claimed": 12000,       # 12% is normal
        "Refund_Claimed": 0
    }
    
    # 2. Test a blatant fraud invoice (Massive invoice spike + huge ITC deviation)
    fraud_invoice = {
        "GSTIN": "27ABCDE0002F1Z1", 
        "Invoice_Value": 9000000,   # Massive spike
        "ITC_Claimed": 8500000,     # Impossible ITC ratio
        "Refund_Claimed": 500000    # Suspicious refund
    }
    
    print("\n--- Testing Normal Invoice ---")
    result_normal = engine.process_new_invoice(normal_invoice)
    print(json.dumps(result_normal, indent=2))
    
    print("\n--- Testing Fraudulent Invoice ---")
    result_fraud = engine.process_new_invoice(fraud_invoice)
    print(json.dumps(result_fraud, indent=2))
