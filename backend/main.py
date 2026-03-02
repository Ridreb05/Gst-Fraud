from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Importing our built engine 
from risk_engine import GSTFraudRiskEngine

app = FastAPI(
    title="Intelligent GST Fraud Pattern Detection API",
    description="Real-time evaluation engine for GST invoices.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    risk_engine = GSTFraudRiskEngine()
except Exception as e:
    print(f"Failed to load Risk Engine. Ensure models are trained. Error: {e}")
    risk_engine = None

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
        # Converting Pydantic model to dict and passing to engine
        invoice_data = invoice.dict()
        assessment = risk_engine.process_new_invoice(invoice_data)
        return {"status": "success", "data": assessment}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("Starting FastAPI server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
