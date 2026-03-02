import React, { useState } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Search, ShieldAlert, Activity } from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';

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

      const response = await axios.post('https://gst-fraud.onrender.com/api/v1/evaluate-invoice', {
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

  // --- UI Helpers & Chart Data Generation ---

  const getRiskColor = (score) => {
    if (score > 60) return '#ef4444'; // Red (High/Critical)
    if (score > 30) return '#eab308'; // Yellow (Medium)
    return '#22c55e'; // Green (Low)
  };

  // Generate breakdown data based on the severity of the score
  const getPieData = (score) => {
    if (score > 50) {
      return [
        { name: 'ITC Anomaly', value: 45 },
        { name: 'Invoice Spike', value: 35 },
        { name: 'Refund Risk', value: 20 },
      ];
    }
    return [
      { name: 'ITC Anomaly', value: 10 },
      { name: 'Invoice Spike', value: 5 },
      { name: 'Normal Volume', value: 85 },
    ];
  };
  const PIE_COLORS = ['#f97316', '#ef4444', '#3b82f6'];

  // Mock historical trend leading up to the current score
  const getTrendData = (currentScore) => {
    const baseRisk = currentScore > 60 ? 40 : 10;
    return [
      { month: 'Oct', risk: Math.max(0, baseRisk - 15) },
      { month: 'Nov', risk: Math.max(0, baseRisk - 5) },
      { month: 'Dec', risk: baseRisk + 5 },
      { month: 'Jan', risk: baseRisk },
      { month: 'Feb', risk: baseRisk + 10 },
      { month: 'Mar (Current)', risk: currentScore },
    ];
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#1e293b' }}>
      
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 0.5rem 0' }}>
            <ShieldAlert size={36} color="#2563eb" />
            Intelligent GST Fraud Detection
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Real-time invoice anomaly detection and entity risk scoring.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>
          <Activity size={18} color="#22c55e" />
          System Active
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* LEFT COLUMN: INPUT FORM */}
        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h2 style={{ marginTop: 0, borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Submit Invoice</h2>
          
          <form onSubmit={evaluateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem' }}>Target GSTIN</label>
              <input 
                type="text" name="GSTIN" value={invoiceData.GSTIN} onChange={handleInputChange} required maxLength="15"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem' }}>Invoice Value (₹)</label>
              <input 
                type="number" name="Invoice_Value" value={invoiceData.Invoice_Value} onChange={handleInputChange} required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem' }}>ITC Claimed (₹)</label>
              <input 
                type="number" name="ITC_Claimed" value={invoiceData.ITC_Claimed} onChange={handleInputChange} required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem' }}>Refund Claimed (₹)</label>
              <input 
                type="number" name="Refund_Claimed" value={invoiceData.Refund_Claimed} onChange={handleInputChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              />
            </div>
            <button 
              type="submit" disabled={loading}
              style={{ 
                backgroundColor: '#2563eb', color: 'white', padding: '1rem', border: 'none', 
                borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', 
                marginTop: '0.5rem', transition: 'background-color 0.2s' 
              }}
            >
              {loading ? 'Executing ML Pipeline...' : 'Run Risk Engine'}
            </button>
          </form>
          {error && <p style={{ color: '#ef4444', marginTop: '1rem', fontWeight: '500', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '4px' }}>{error}</p>}
        </div>

        {/* RIGHT COLUMN: RESULTS DASHBOARD */}
        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h2 style={{ marginTop: 0, borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Evaluation Output</h2>
          
          {!result ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '6rem' }}>
              <Search size={64} style={{ margin: '0 auto', opacity: 0.3 }} />
              <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>Awaiting invoice submission...</p>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.5s' }}>
              
              {/* Top Row: Score & Action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Business Risk Score</h3>
                  <div style={{ fontSize: '3.5rem', fontWeight: '900', color: getRiskColor(result.Business_Risk), lineHeight: '1' }}>
                    {result.Business_Risk}
                    <span style={{ fontSize: '1.2rem', color: '#cbd5e1' }}>/100</span>
                  </div>
                  <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '999px', backgroundColor: `${getRiskColor(result.Business_Risk)}20`, color: getRiskColor(result.Business_Risk), fontWeight: 'bold', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    {result.Category.toUpperCase()}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                   <h4 style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Triggered Action</h4>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', fontSize: '1.2rem', fontWeight: 'bold', color: result.Business_Risk > 60 ? '#ef4444' : '#22c55e' }}>
                    {result.Business_Risk > 60 ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
                    {result.Action_Triggered}
                  </div>
                </div>
              </div>

              {/* Middle Row: Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '220px', marginBottom: '1.5rem' }}>
                
                {/* Pie Chart */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 5px 5px', fontSize: '0.85rem', color: '#64748b' }}>Anomaly Breakdown</h4>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie data={getPieData(result.Business_Risk)} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                        {getPieData(result.Business_Risk).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Trend Line Graph */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 5px 5px', fontSize: '0.85rem', color: '#64748b' }}>6-Month Entity Risk Trend</h4>
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={getTrendData(result.Business_Risk)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} hide={true} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="risk" stroke={getRiskColor(result.Business_Risk)} strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottom Row: Key Risk Factors */}
              <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Detected Risk Factors</h4>
                <ul style={{ paddingLeft: '20px', color: '#334155', margin: 0, fontWeight: '500' }}>
                  {result.Top_Risk_Drivers.map((driver, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{driver}</li>
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
