from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import the engine we just built
from risk_engine import GSTFraudRiskEngine

# Initialize the FastAPI app
app = FastAPI(
    title="Intelligent GST Fraud Pattern Detection API",
    description="Real-time evaluation engine for GST invoices.",
    version="1.0.0"
)

# Crucial for local development with a React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace "*" with your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the ML Engine
# This loads the models into memory once when the server starts
try:
    risk_engine = GSTFraudRiskEngine()
except Exception as e:
    print(f"Failed to load Risk Engine. Ensure models are trained. Error: {e}")
    risk_engine = None

# Define the expected JSON payload using Pydantic
class InvoiceRequest(BaseModel):
    GSTIN: str = Field(..., description="The 15-character GST Identification Number", min_length=15, max_length=15)
    Invoice_Value: float = Field(..., description="Total value of the invoice", gt=0)
    ITC_Claimed: float = Field(..., description="Input Tax Credit claimed", ge=0)
    Refund_Claimed: float = Field(0.0, description="Any refund requested on this invoice", ge=0)

@app.get("/")
def read_root():
    return {"message": "GST Fraud Detection API is running. Go to /docs to test the endpoints."}

@app.post("/api/v1/evaluate-invoice")
def evaluate_invoice(invoice: InvoiceRequest):
    """
    Receives a single invoice and returns a comprehensive risk assessment.
    """
    if risk_engine is None:
        raise HTTPException(status_code=500, detail="Risk Engine failed to initialize. Check server logs.")
    
    try:
        # Convert Pydantic model to dict and pass to engine
        invoice_data = invoice.dict()
        assessment = risk_engine.process_new_invoice(invoice_data)
        return {"status": "success", "data": assessment}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run the server using Uvicorn
    print("Starting FastAPI server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
