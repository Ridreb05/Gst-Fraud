import React, { useState } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Search, ShieldAlert } from 'lucide-react';

function App() {
  const [invoiceData, setInvoiceData] = useState({
    GSTIN: '27ABCDE0001F1Z1',
    Invoice_Value: 100000,
    ITC_Claimed: 12000,
    Refund_Claimed: 0
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setInvoiceData({ ...invoiceData, [e.target.name]: e.target.value });
  };

  const evaluateInvoice = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Pointing to your local FastAPI server
      const response = await axios.post('https://gst-fraud.onrender.com', {
        GSTIN: invoiceData.GSTIN,
        Invoice_Value: parseFloat(invoiceData.Invoice_Value),
        ITC_Claimed: parseFloat(invoiceData.ITC_Claimed),
        Refund_Claimed: parseFloat(invoiceData.Refund_Claimed)
      });
      setResult(response.data.data);
    } catch (err) {
      setError('Failed to connect to the risk engine. Is the backend running?');
    }
    setLoading(false);
  };

  // Helper to determine color based on your flowchart logic
  const getRiskColor = (score) => {
    if (score > 60) return '#ef4444'; // Red for High/Critical Risk
    if (score > 30) return '#eab308'; // Yellow for Medium Risk
    return '#22c55e'; // Green for Low Risk
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
          <ShieldAlert size={32} color="#2563eb" />
          Intelligent GST Fraud Detection
        </h1>
        <p style={{ color: '#64748b' }}>Real-time invoice anomaly detection and entity risk scoring.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* INPUT FORM */}
        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
          <h2 style={{ marginTop: 0 }}>Submit Invoice</h2>
          <form onSubmit={evaluateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>GSTIN</label>
              <input 
                type="text" name="GSTIN" value={invoiceData.GSTIN} onChange={handleInputChange} required maxLength="15"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Invoice Value (₹)</label>
              <input 
                type="number" name="Invoice_Value" value={invoiceData.Invoice_Value} onChange={handleInputChange} required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>ITC Claimed (₹)</label>
              <input 
                type="number" name="ITC_Claimed" value={invoiceData.ITC_Claimed} onChange={handleInputChange} required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Refund Claimed (₹)</label>
              <input 
                type="number" name="Refund_Claimed" value={invoiceData.Refund_Claimed} onChange={handleInputChange}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <button 
              type="submit" disabled={loading}
              style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '1rem' }}
            >
              {loading ? 'Analyzing...' : 'Evaluate Risk Engine'}
            </button>
          </form>
          {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
        </div>

        {/* RESULTS DASHBOARD */}
        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0 }}>System Output</h2>
          
          {!result ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '4rem' }}>
              <Search size={48} style={{ margin: '0 auto', opacity: 0.5 }} />
              <p>Submit an invoice to generate a risk profile.</p>
            </div>
          ) : (
            <div>
              {/* Risk Meter Simulation */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#64748b' }}>Business Risk Score</h3>
                <div style={{ fontSize: '4rem', fontWeight: '900', color: getRiskColor(result.Business_Risk) }}>
                  {result.Business_Risk}
                  <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>/100</span>
                </div>
                <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '999px', backgroundColor: `${getRiskColor(result.Business_Risk)}20`, color: getRiskColor(result.Business_Risk), fontWeight: 'bold', marginTop: '0.5rem' }}>
                  {result.Category.toUpperCase()}
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '1.5rem 0' }} />

              {/* Triggered Action */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 5px 0' }}>Triggered Action</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {result.Business_Risk > 60 ? <AlertTriangle color="#ef4444" /> : <CheckCircle color="#22c55e" />}
                  {result.Action_Triggered}
                </div>
              </div>

              {/* Key Risk Factors */}
              <div>
                <h4 style={{ margin: '0 0 10px 0' }}>Top Risk Drivers</h4>
                <ul style={{ paddingLeft: '20px', color: '#334155' }}>
                  {result.Top_Risk_Drivers.map((driver, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>{driver}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
