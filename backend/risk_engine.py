import pandas as pd
import numpy as np
import joblib
import json
import os

class GSTFraudRiskEngine:
    def __init__(self):
        print("Initializing Risk Engine...")
        self.load_models_and_data()
        
    def load_models_and_data(self):
        """Loads the pre-trained Isolation Forest and historical entity profiles. """
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
        new_invoice: dict containing GSTIN, Invoice_Value, ITC_Claimed, Refund_Claimed 
        """
        gstin = new_invoice.get("GSTIN")
        invoice_value = new_invoice.get("Invoice_Value", 0)
        itc_claimed = new_invoice.get("ITC_Claimed", 0)
        refund_claimed = new_invoice.get("Refund_Claimed", 0)
        
        current_itc_ratio = itc_claimed / invoice_value if invoice_value > 0 else 0 
        
        is_new_entity = gstin not in self.entity_profiles.index 
        
        if is_new_entity:
            historical_data = {
                'Avg_Invoice_Value': invoice_value, 
                'Std_Invoice_Value': 0,
                'Avg_ITC_Ratio': current_itc_ratio,
                'Total_Refund': 0
            }
        else:
            historical_data = self.entity_profiles.loc[gstin].to_dict() 

        avg_inv = historical_data.get('Avg_Invoice_Value', invoice_value)
        std_inv = historical_data.get('Std_Invoice_Value', 1) 
        avg_itc_ratio = historical_data.get('Avg_ITC_Ratio', 0.1)
        avg_refund = historical_data.get('Total_Refund', 0)

        invoice_spike = invoice_value / avg_inv if avg_inv > 0 else 1 
        z_score = (invoice_value - avg_inv) / std_inv if std_inv > 0 else 0 
        itc_deviation = (current_itc_ratio - avg_itc_ratio) * 100 
        refund_spike = refund_claimed / avg_refund if avg_refund > 0 else (refund_claimed > 0) 

        rule_risk_score = 0
        risk_drivers = []

        if invoice_spike > 5: 
            rule_risk_score += 20
            risk_drivers.append(f"Invoice Spike ({invoice_spike:.1f}x normal)")
        
        if itc_deviation > 15:
            rule_risk_score += 25
            risk_drivers.append(f"ITC Deviation (+{itc_deviation:.1f}%)")
            
        if refund_spike > 3: 
            rule_risk_score += 20
            risk_drivers.append("Abnormal Refund Request")
            
        if z_score > 3: 
            rule_risk_score += 15
            risk_drivers.append("Statistical Outlier (Z-Score > 3)")

        ml_risk_score = 0
        if self.iso_forest:
            features = pd.DataFrame([{
                'Invoice_Value': invoice_value,
                'ITC_Claimed': itc_claimed,
                'ITC_Ratio': current_itc_ratio,
                'Refund_Claimed': refund_claimed
            }])
            
            prediction = self.iso_forest.predict(features)[0]
            
            if prediction == -1:
                ml_risk_score = 50
                decision_function_score = self.iso_forest.decision_function(features)[0]
                ml_risk_score += min(50, abs(decision_function_score) * 100)
                risk_drivers.append("ML Anomaly Detected")

        invoice_risk_score = min(100, rule_risk_score + (ml_risk_score * 0.5)) 

       
        business_risk = invoice_risk_score 
        if not is_new_entity:
            avg_risk = historical_data.get('Avg_ITC_Ratio', 0) * 100 
            business_risk = (0.5 * avg_risk) + (0.3 * invoice_risk_score) + (0.2 * max(avg_risk, invoice_risk_score)) 
            business_risk = min(100, max(0, business_risk))

        if invoice_risk_score > 90:
            business_risk = max(business_risk, 90)

        action = "Monitor"
        category = "Low Risk"
        if business_risk > 80: 
            action = "Audit + Refund Hold"
            category = "Critical Risk"
        elif business_risk > 60: 
            action = "Manual Review"
            category = "High Risk"
        elif business_risk > 30: 
            action = "Auto Notice"
            category = "Medium Risk"

        alert = {
            "GSTIN": gstin,
            "Invoice_Risk": round(invoice_risk_score, 2),
            "Business_Risk": round(business_risk, 2),
            "Category": category,
            "Action_Triggered": action, 
            "Top_Risk_Drivers": risk_drivers if risk_drivers else ["Normal Transaction"] 
        }
        
        self._log_transaction(alert)
        
        return alert

    def _log_transaction(self, alert):
        """Simulates logging to a database. """
        print(f"\n[LOG] Processed {alert['GSTIN']} | Score: {alert['Business_Risk']} | Action: {alert['Action_Triggered']}")


if __name__ == "__main__":
    engine = GSTFraudRiskEngine()
    
    normal_invoice = {
        "GSTIN": "27ABCDE0001F1Z1",
        "Invoice_Value": 100000,
        "ITC_Claimed": 12000,       
        "Refund_Claimed": 0
    }
    
    fraud_invoice = {
        "GSTIN": "27ABCDE0002F1Z1", 
        "Invoice_Value": 9000000,   
        "ITC_Claimed": 8500000,     
        "Refund_Claimed": 500000    
    }
    
    print("\n--- Testing Normal Invoice ---")
    result_normal = engine.process_new_invoice(normal_invoice)
    print(json.dumps(result_normal, indent=2))
    
    print("\n--- Testing Fraudulent Invoice ---")
    result_fraud = engine.process_new_invoice(fraud_invoice)
    print(json.dumps(result_fraud, indent=2))
