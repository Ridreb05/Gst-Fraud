# 🛡️ Intelligent GST Fraud Pattern Detection 
### **NextGenHack 2026 | Problem Statement 26**

Fake invoices and tax manipulation are systemic challenges in GST-based systems. This project implements a **Hybrid Risk Engine** designed for small businesses, utilizing unsupervised machine learning (Isolation Forest) and rule-based validation to identify suspicious patterns in real-time.



## 🚀 Key Features
* **Entity Profiling**: Converts raw historical invoices into summarized profiles for each GST entity to establish a behavioral baseline.
* **Hybrid Risk Engine**: Combines statistical z-scores and rule-based heuristics with ML anomaly detection.
* **Real-Time API**: A FastAPI backend that accepts new invoice data (JSON) and identifies entity-level deviations instantly.
* **Compliance Dashboard**: A React-based interface featuring a 0–100 Risk Meter and visual breakdown of risk drivers.

## 🏗️ System Architecture & Logic
The system follows a multi-step pipeline to ensure high precision and low false positives:

### 1. Data Preprocessing & Profiling
Historical data is aggregated per **GSTIN** to calculate baseline metrics:
* **ITC-to-Turnover Ratio**: $ITC\_Claimed / Invoice\_Value$
* **Avg Invoice Value & Std Deviation**: Establishing what "normal" looks like for that specific entity.
* **Transaction Frequency**: Monitoring daily/monthly counts for volume spikes.

### 2. Real-Time Invoice Evaluation
Incoming invoices are compared against the **entity_profile_table** to generate deviation metrics:
* **Invoice Spike**: Detection of large spikes indicating potential "ghost" billing.
* **Z-Score**: Statistical outlier detection where $z = \frac{x - \mu}{\sigma}$.
* **ITC Deviation**: Identification of inflated ITC claims, a common tax evasion method.

### 3. Risk Aggregation Formula
The final **Business Risk Score** (capped at 100) is calculated using a weighted formula:
$$Business\_Risk = (0.5 \times Avg\_Risk) + (0.3 \times Pattern\_Risk) + (0.2 \times Trend\_Risk)$$



## 🛠️ Technology Stack
* **Backend**: Python, FastAPI, Uvicorn
* **Machine Learning**: Scikit-Learn (Isolation Forest), Joblib
* **Frontend**: React.js, Recharts, Lucide-React
* **Data Science**: Pandas, NumPy
* **Deployment**: Render (API), GitHub Pages (Dashboard)

## 🚦 Action Decision Engine
Based on the calculated risk score, the system triggers automated compliance actions:

| Risk Score | Category | Action Triggered |
| :--- | :--- | :--- |
| **0 – 30** | Low Risk | Monitor |
| **31 – 60** | Medium Risk | Auto Notice |
| **61 – 80** | High Risk | Manual Review |
| **81 – 100** | Critical Risk | Audit + Refund Hold |

## 📁 Project Structure
```text
Gst-Fraud/
├── backend/                # FastAPI & ML Engine
│   ├── main.py             # API Entry Point
│   ├── risk_engine.py      # Core Logic & Scoring
│   ├── model_pipeline.py   # Training & Profiling Script
│   ├── data/               # Generated Historical Datasets
│   └── models/             # Pre-trained ML Models (.pkl)
└── frontend/               # React Dashboard
    ├── src/App.js          # UI Logic & Visualizations
    └── public/             # Static Assets
