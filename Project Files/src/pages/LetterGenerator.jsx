import React, { useState, useEffect } from 'react';
import { Send, FileText, Copy, Download, History, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function LetterGenerator({ token }) {
  const [loans, setLoans] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [letterType, setLetterType] = useState('hardship'); // hardship, settlement, dispute
  const [hardshipReason, setHardshipReason] = useState('general_hardship');
  const [customContext, setCustomContext] = useState('');
  
  // Results
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [strategyNotes, setStrategyNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchInitialData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [loansRes, historyRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/loans', { headers }),
        fetch('http://127.0.0.1:8000/api/finance/negotiation-history', { headers })
      ]);

      if (loansRes.ok) {
        const loansData = await loansRes.json();
        const activeLoans = loansData.filter(l => l.status === 'active');
        setLoans(activeLoans);
        if (activeLoans.length > 0) {
          setSelectedLoanId(activeLoans[0].id.toString());
        }
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchInitialData();
  }, [token]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedLoanId) {
      setError('Please add or select a loan first.');
      return;
    }
    
    setGenerating(true);
    setError('');
    setCopied(false);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/finance/generate-letter', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loan_id: parseInt(selectedLoanId),
          letter_type: letterType,
          hardship_reason: letterType === 'dispute' ? null : hardshipReason,
          custom_context: customContext || null
        })
      });

      if (!response.ok) throw new Error('Failed to generate letter from API.');
      
      const data = await response.json();
      setGeneratedLetter(data.letter_content);
      setStrategyNotes(data.strategy_notes);
      
      // Refresh history sidebar
      fetchInitialData();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedLetter) return;
    const loan = loans.find(l => l.id.toString() === selectedLoanId);
    const creditor = loan ? loan.creditor_name.replace(/\s+/g, '_') : 'creditor';
    const filename = `${creditor}_${letterType}_letter.txt`;
    
    const element = document.createElement("a");
    const file = new Blob([generatedLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const loadHistoryItem = (item) => {
    setGeneratedLetter(item.letter_content);
    setStrategyNotes(item.strategy_notes);
    setLetterType(item.letter_type);
    setSelectedLoanId(item.loan_id.toString());
  };

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '32px', fontWeight: 700, margin: '0 0 5px 0' }}>AI Negotiation Assistant</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>Create personalized hardship notices, dispute forms, and settlement packages using Gemini AI.</p>
      </div>

      {loans.length === 0 ? (
        <div className="clay-card" style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <FileText size={48} color="#cbd3e2" style={{ margin: '0 auto 15px auto' }} />
          <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', margin: '0 0 10px 0', fontWeight: 700 }}>No accounts available for writing</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 25px 0', fontWeight: 500 }}>You must track active outstanding accounts to draft negotiation letters.</p>
          <button onClick={() => onNavigate('loans')} className="clay-btn clay-btn-blue">Track Accounts</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }} className="lg:grid-cols-3">
          
          {/* Form controls (1/3 width) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <form onSubmit={handleGenerate} className="clay-card">
              <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', margin: '0 0 20px 0', fontWeight: 700 }}>Draft Configuration</h3>
              
              {/* Account select */}
              <div className="form-group">
                <label className="form-label">Creditor Account</label>
                <select 
                  className="clay-input clay-select"
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                >
                  {loans.map(loan => (
                    <option key={loan.id} value={loan.id}>
                      {loan.creditor_name} (${loan.total_amount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Letter Type */}
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">Negotiation Document Type</label>
                <select 
                  className="clay-input clay-select"
                  value={letterType}
                  onChange={(e) => {
                    setLetterType(e.target.value);
                    setError('');
                  }}
                >
                  <option value="hardship">Hardship Notice (Reduced Payment / Pause)</option>
                  <option value="settlement">Settlement Proposal (Lump-Sum Discount)</option>
                  <option value="dispute">Debt Validation / Dispute Notice</option>
                </select>
              </div>

              {/* Hardship Reason (Disabled for dispute letters) */}
              {letterType !== 'dispute' && (
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label className="form-label">Primary Hardship Reason</label>
                  <select 
                    className="clay-input clay-select"
                    value={hardshipReason}
                    onChange={(e) => setHardshipReason(e.target.value)}
                  >
                    <option value="general_hardship">General Financial Hardship</option>
                    <option value="job_loss">Involuntary Job Loss / Layoff</option>
                    <option value="medical_emergency">Severe Medical Illness or Emergency</option>
                    <option value="divorce_family">Divorce or Family Separation</option>
                    <option value="income_reduction">Salary Reduction / Hours Cut</option>
                  </select>
                </div>
              )}

              {/* Custom Details */}
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">Additional Custom Context (Optional)</label>
                <textarea 
                  rows="3"
                  placeholder="Provide specific details about your situation (e.g. date of layoff, specific medical condition)..."
                  className="clay-input"
                  style={{ resize: 'none', height: '90px' }}
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                />
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clay-coral-dark)', fontSize: '13px', fontWeight: 600, margin: '15px 0' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={generating}
                className="clay-btn clay-btn-blue"
                style={{ width: '100%', marginTop: '10px' }}
              >
                <Send size={16} /> {generating ? 'Consulting Gemini AI...' : 'Draft Letter'}
              </button>
            </form>

            {/* History Sidebar */}
            {history.length > 0 && (
              <div className="clay-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <History size={18} color="var(--clay-blue-dark)" />
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', margin: 0, fontWeight: 700 }}>Generated History</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                  {history.map((hist) => {
                    const matchedLoan = loans.find(l => l.id === hist.loan_id);
                    const name = matchedLoan ? matchedLoan.creditor_name : 'Account';
                    return (
                      <button
                        key={hist.id}
                        type="button"
                        onClick={() => loadHistoryItem(hist)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          border: '2px solid #eef2f8',
                          borderRadius: '12px',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontFamily: 'Quicksand',
                          fontSize: '12px',
                          fontWeight: 600,
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                        className="clay-card-interactive"
                      >
                        <span style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: 700 }}>{name}</span>
                        <span style={{ color: 'var(--clay-blue-dark)', textTransform: 'capitalize', fontSize: '11px' }}>{hist.letter_type} Letter</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Letter Preview & Advice (2/3 width) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 2 }} className="lg:col-span-2">
            {generatedLetter ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Strategic Advice Card */}
                {strategyNotes && (
                  <div className="clay-card clay-card-blue" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <Sparkles size={20} color="#7792fb" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', fontFamily: 'Outfit', fontWeight: 700, fontSize: '15px' }}>Strategic Recommendation</h4>
                      <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.4, fontWeight: 500 }}>{strategyNotes}</p>
                    </div>
                  </div>
                )}

                {/* Letter Preview Card */}
                <div className="clay-card" style={{ padding: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eef2f8', paddingBottom: '15px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={20} color="var(--clay-blue-dark)" />
                      <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', margin: 0, fontWeight: 700 }}>Letter Document</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={handleCopy}
                        className="clay-btn clay-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '10px' }}
                      >
                        {copied ? (
                          <>
                            <Check size={14} color="var(--clay-green-dark)" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copy Text
                          </>
                        )}
                      </button>
                      <button 
                        onClick={handleDownload}
                        className="clay-btn clay-btn-blue"
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '10px' }}
                      >
                        <Download size={14} /> Download TXT
                      </button>
                    </div>
                  </div>

                  <pre style={{
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    color: 'var(--text-main)',
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                    fontWeight: 500,
                    overflowX: 'auto',
                    maxHeight: '400px'
                  }}>
                    {generatedLetter}
                  </pre>
                </div>

              </div>
            ) : (
              <div className="clay-card" style={{ padding: '100px 30px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center' }}>
                <Sparkles size={40} color="#cbd3e2" style={{ marginBottom: '15px' }} />
                <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', margin: '0 0 10px 0', fontWeight: 700 }}>Generate negotiation documents</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '400px', fontWeight: 500, lineHeight: 1.4 }}>
                  Configure your parameters in the left pane and consult our Gemini AI integration to compose custom letters.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
