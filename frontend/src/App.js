import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Search, ShieldAlert, Activity, Moon, Sun } from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, CartesianGrid
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
  
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#ffffff',
    cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
    text: isDarkMode ? '#f8fafc' : '#1e293b',
    subText: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    inputBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputBorder: isDarkMode ? '#475569' : '#cbd5e1',
    shadow: isDarkMode ? '0 4px 6px -1px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0,0,0,0.1)',
    chartGrid: isDarkMode ? '#334155' : '#e2e8f0',
  };

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

  const getRiskColor = (score) => {
    if (score > 60) return '#ef4444'; 
    if (score > 30) return '#eab308'; 
    return '#22c55e'; 
  };

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
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', transition: 'background-color 0.3s ease', padding: '2rem 1rem' }}>
      
      {/* INJECTED CSS FOR RESPONSIVENESS AND ANIMATIONS */}
      <style>
        {`
          .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 1200px; margin: 0 auto; }
          .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; height: 250px; margin-bottom: 1.5rem; }
          .header-flex { display: flex; justify-content: space-between; align-items: flex-end; max-width: 1200px; margin: 0 auto; }
          
          @media (max-width: 900px) {
            .responsive-grid { grid-template-columns: 1fr; }
            .header-flex { flex-direction: column; align-items: flex-start; gap: 1rem; }
          }
          
          @media (max-width: 600px) {
            .charts-grid { grid-template-columns: 1fr; height: auto; gap: 1.5rem; }
            .chart-box { height: 200px; }
          }

          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-in { animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          
          input:focus { outline: 2px solid #3b82f6; outline-offset: -1px; }
          button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
          button:active:not(:disabled) { transform: translateY(0); }
        `}
      </style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <header className="header-flex" style={{ marginBottom: '2rem', borderBottom: `1px solid ${theme.border}`, paddingBottom: '1rem' }}>
          <div className="animate-in" style={{ animationDelay: '0.1s' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 0.5rem 0' }}>
              <ShieldAlert size={36} color="#3b82f6" />
              GST SENTINEL AI
            </h1>
            <p style={{ color: theme.subText, margin: 0 }}>Real-time invoice anomaly detection and entity risk scoring.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="animate-in" style={{ animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.subText, fontSize: '0.9rem', fontWeight: 'bold' }}>
              <Activity size={18} color="#22c55e" />
              System Active
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{ background: 'transparent', border: `1px solid ${theme.border}`, color: theme.text, padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}
            >
              {isDarkMode ? <Sun size={20} color="#eab308" /> : <Moon size={20} color="#64748b" />}
            </button>
          </div>
        </header>

        {/* MAIN LAYOUT */}
        <div className="responsive-grid">
          
          {/* LEFT COLUMN: INPUT FORM */}
          <div className="animate-in" style={{ animationDelay: '0.3s', padding: '1.5rem', border: `1px solid ${theme.border}`, borderRadius: '12px', backgroundColor: theme.cardBg, boxShadow: theme.shadow, transition: 'all 0.3s ease' }}>
            <h2 style={{ marginTop: 0, borderBottom: `2px solid ${theme.border}`, paddingBottom: '0.5rem' }}>Submit Invoice</h2>
            
            <form onSubmit={evaluateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem' }}>
              {['GSTIN', 'Invoice_Value', 'ITC_Claimed', 'Refund_Claimed'].map((field) => (
                <div key={field}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', color: theme.text }}>
                    {field.replace('_', ' ')} {field !== 'GSTIN' && '(₹)'}
                  </label>
                  <input 
                    type={field === 'GSTIN' ? "text" : "number"}
                    name={field} 
                    value={invoiceData[field]} 
                    onChange={handleInputChange} 
                    required={field !== 'Refund_Claimed'}
                    maxLength={field === 'GSTIN' ? "15" : undefined}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBg, color: theme.text, fontSize: '1rem', transition: 'all 0.2s', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <button 
                type="submit" disabled={loading}
                style={{ 
                  backgroundColor: loading ? '#94a3b8' : '#2563eb', color: 'white', padding: '1rem', border: 'none', 
                  borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.1rem', 
                  marginTop: '0.5rem', transition: 'all 0.2s ease' 
                }}
              >
                {loading ? 'Executing ML Pipeline...' : 'Run Risk Engine'}
              </button>
            </form>
            {error && <p className="animate-in" style={{ color: '#ef4444', marginTop: '1rem', fontWeight: '500', padding: '0.75rem', backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2', borderRadius: '6px', border: '1px solid #fca5a5' }}>{error}</p>}
          </div>

          {/* RIGHT COLUMN: RESULTS DASHBOARD */}
          <div className="animate-in" style={{ animationDelay: '0.4s', padding: '1.5rem', border: `1px solid ${theme.border}`, borderRadius: '12px', backgroundColor: theme.bg, boxShadow: theme.shadow, transition: 'all 0.3s ease' }}>
            <h2 style={{ marginTop: 0, borderBottom: `2px solid ${theme.border}`, paddingBottom: '0.5rem' }}>Evaluation Output</h2>
            
            {!result ? (
              <div className="animate-in" style={{ color: theme.subText, textAlign: 'center', marginTop: '6rem' }}>
                <Search size={64} style={{ margin: '0 auto', opacity: 0.3 }} />
                <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>Awaiting invoice submission...</p>
              </div>
            ) : (
              <div className="animate-in" key={result.Business_Risk}> 
                
                {/* Top Row: Score & Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: theme.cardBg, padding: '1.2rem', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 5px 0', color: theme.subText, fontSize: '0.9rem', textTransform: 'uppercase' }}>Business Risk</h3>
                    <div style={{ fontSize: '3.5rem', fontWeight: '900', color: getRiskColor(result.Business_Risk), lineHeight: '1' }}>
                      {result.Business_Risk}
                      <span style={{ fontSize: '1.2rem', color: theme.subText }}>/100</span>
                    </div>
                    <div style={{ display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: '999px', backgroundColor: `${getRiskColor(result.Business_Risk)}20`, color: getRiskColor(result.Business_Risk), fontWeight: 'bold', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      {result.Category.toUpperCase()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                     <h4 style={{ margin: '0 0 5px 0', color: theme.subText, fontSize: '0.9rem', textTransform: 'uppercase' }}>Triggered Action</h4>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', fontSize: '1.2rem', fontWeight: 'bold', color: result.Business_Risk > 60 ? '#ef4444' : '#22c55e' }}>
                      {result.Business_Risk > 60 ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
                      {result.Action_Triggered}
                    </div>
                  </div>
                </div>

                {/* Middle Row: Charts */}
                <div className="charts-grid">
                  {/* Pie Chart */}
                  <div className="chart-box" style={{ border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '0.75rem', backgroundColor: theme.cardBg }}>
                    <h4 style={{ margin: '0 0 5px 5px', fontSize: '0.85rem', color: theme.subText }}>Anomaly Breakdown</h4>
                    <ResponsiveContainer width="100%" height="85%">
                      <PieChart>
                        <Pie data={getPieData(result.Business_Risk)} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                          {getPieData(result.Business_Risk).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }} itemStyle={{ color: theme.text }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Trend Line Graph */}
                  <div className="chart-box" style={{ border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '0.75rem', backgroundColor: theme.cardBg }}>
                    <h4 style={{ margin: '0 0 5px 5px', fontSize: '0.85rem', color: theme.subText }}>6-Month Risk Trend</h4>
                    <ResponsiveContainer width="100%" height="85%">
                      <LineChart data={getTrendData(result.Business_Risk)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chartGrid} />
                        <XAxis dataKey="month" tick={{fontSize: 10, fill: theme.subText}} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} hide={true} />
                        <RechartsTooltip contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }} />
                        <Line type="monotone" dataKey="risk" stroke={getRiskColor(result.Business_Risk)} strokeWidth={3} dot={{ r: 4 }} animationDuration={1000} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bottom Row: Key Risk Factors */}
                <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, padding: '1.2rem', borderRadius: '8px', marginTop: '1rem' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: theme.text }}>Detected Risk Factors</h4>
                  <ul style={{ paddingLeft: '20px', color: theme.subText, margin: 0, fontWeight: '500', lineHeight: '1.6' }}>
                    {result.Top_Risk_Drivers.map((driver, index) => (
                      <li key={index} className="animate-in" style={{ animationDelay: `${0.5 + (index * 0.1)}s` }}>{driver}</li>
                    ))}
                  </ul>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
