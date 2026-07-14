import React, { useState, useEffect } from 'react';
import { Percent, TrendingDown, Landmark, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';

export default function SettlementPredictor({ token, onNavigate }) {
  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [customDelinquency, setCustomDelinquency] = useState(0);
  const [paymentPlanType, setPaymentPlanType] = useState('lump_sum'); // lump_sum, 3_months, 6_months
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch active loans list
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/loans', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load loans.');
        const data = await response.json();
        const activeLoans = data.filter(l => l.status === 'active');
        setLoans(activeLoans);
        if (activeLoans.length > 0) {
          setSelectedLoanId(activeLoans[0].id.toString());
          setCustomDelinquency(activeLoans[0].delinquency_months);
        }
      } catch (err) {
        setError(err.message);
      }
    };
    if (token) fetchLoans();
  }, [token]);

  // Recalculate prediction when selection or delinquency changes
  useEffect(() => {
    const getPrediction = async () => {
      if (!selectedLoanId) return;
      setLoading(true);
      try {
        const selected = loans.find(l => l.id.toString() === selectedLoanId);
        if (!selected) return;

        // Fetch normal baseline prediction from backend
        const response = await fetch(`http://127.0.0.1:8000/api/finance/predictions/${selectedLoanId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to compute settlement details.');
        const data = await response.json();

        // If the user modified the delinquency slider, we overlay client-side recalculations
        if (customDelinquency !== selected.delinquency_months) {
          // Adjust probability based on custom delinquency
          let prob = 0.15;
          if (customDelinquency >= 12) prob = 0.90;
          else if (customDelinquency >= 6) prob = 0.85;
          else if (customDelinquency >= 3) prob = 0.65;
          else if (customDelinquency >= 1) prob = 0.35;
          
          if (data.lender_cooperativeness === 'High') prob = Math.min(0.95, prob + 0.10);
          if (data.lender_cooperativeness === 'Low') prob = Math.max(0.05, prob - 0.15);

          // Adjust rates based on custom delinquency
          let factor = 1.0;
          if (customDelinquency >= 12) factor = 0.80;
          else if (customDelinquency >= 6) factor = 0.90;
          else if (customDelinquency < 3) factor = 1.15;

          const baseRate = data.recommended_amount / data.total_amount;
          const adjustedRate = Math.max(0.20, minMaxRate(baseRate * factor));
          const recAmt = data.total_amount * adjustedRate;

          setPrediction({
            ...data,
            delinquency_months: customDelinquency,
            probability: prob,
            recommended_amount: Math.round(recAmt),
            min_predicted_amount: Math.round(recAmt * 0.85),
            max_predicted_amount: Math.round(recAmt * 1.15),
            savings_amount: Math.round(data.total_amount - recAmt)
          });
        } else {
          setPrediction(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getPrediction();
  }, [selectedLoanId, customDelinquency, loans]);

  const minMaxRate = (val) => {
    return Math.max(0.20, Math.min(0.85, val));
  };

  const handleLoanChange = (e) => {
    const id = e.target.value;
    setSelectedLoanId(id);
    const selected = loans.find(l => l.id.toString() === id);
    if (selected) {
      setCustomDelinquency(selected.delinquency_months);
    }
  };

  // Helper calculations for payment plans
  const getInstallmentDetails = () => {
    if (!prediction) return null;
    const total = prediction.recommended_amount;
    
    // Installments usually require a 10%-20% markup over a strict lump-sum settlement
    let markup = 1.0;
    let months = 1;
    
    if (paymentPlanType === '3_months') {
      markup = 1.10; // 10% premium
      months = 3;
    } else if (paymentPlanType === '6_months') {
      markup = 1.18; // 18% premium
      months = 6;
    }

    const finalAmount = total * markup;
    const monthlyPayment = finalAmount / months;
    
    return {
      total: Math.round(finalAmount),
      monthly: Math.round(monthlyPayment),
      savings: Math.round(prediction.total_amount - finalAmount),
      months
    };
  };

  const planDetails = getInstallmentDetails();

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '32px', fontWeight: 700, margin: '0 0 5px 0' }}>Settlement Predictor</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>Predict recommended settlement offers, savings potential, and lender agreement likelihoods.</p>
      </div>

      {loans.length === 0 ? (
        <div className="clay-card" style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <Landmark size={48} color="#cbd3e2" style={{ margin: '0 auto 15px auto' }} />
          <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', margin: '0 0 10px 0', fontWeight: 700 }}>No accounts available for modeling</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 25px 0', fontWeight: 500 }}>You must track active outstanding accounts to calculate settlement projections.</p>
          <button onClick={() => onNavigate('loans')} className="clay-btn clay-btn-blue">Track Accounts</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }} className="lg:grid-cols-3">
          
          {/* Left Column: Form Adjustments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="clay-card">
              <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', margin: '0 0 20px 0', fontWeight: 700 }}>Simulation Controls</h3>
              
              {/* Select Loan */}
              <div className="form-group">
                <label className="form-label">Select Loan Account</label>
                <select 
                  className="clay-input clay-select"
                  value={selectedLoanId}
                  onChange={handleLoanChange}
                >
                  {loans.map(loan => (
                    <option key={loan.id} value={loan.id}>
                      {loan.creditor_name} (${loan.total_amount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Delinquency Slider */}
              <div className="form-group" style={{ marginTop: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Simulated Delinquency</label>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clay-blue-dark)' }}>
                    {customDelinquency} month{customDelinquency !== 1 ? 's' : ''}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="18" 
                  className="clay-meter-container"
                  style={{ 
                    width: '100%', 
                    height: '8px', 
                    cursor: 'pointer',
                    outline: 'none',
                    margin: '10px 0'
                  }}
                  value={customDelinquency} 
                  onChange={(e) => setCustomDelinquency(parseInt(e.target.value))} 
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '6px', fontWeight: 500 }}>
                  💡 Delinquency age increases discounts. Creditors rarely accept deep settlement cuts under 3-6 months delinquency.
                </span>
              </div>

              {/* Payment Plan Selector */}
              <div className="form-group" style={{ marginTop: '25px', marginBottom: 0 }}>
                <label className="form-label">Repayment Settlement Term</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="plan" 
                      value="lump_sum" 
                      checked={paymentPlanType === 'lump_sum'}
                      onChange={() => setPaymentPlanType('lump_sum')}
                    />
                    Lump-Sum (Single payment)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="plan" 
                      value="3_months" 
                      checked={paymentPlanType === '3_months'}
                      onChange={() => setPaymentPlanType('3_months')}
                    />
                    3-Month Payment Plan (+10% fee)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="plan" 
                      value="6_months" 
                      checked={paymentPlanType === '6_months'}
                      onChange={() => setPaymentPlanType('6_months')}
                    />
                    6-Month Payment Plan (+18% fee)
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Prediction results (occupies 2/3 space on large screens) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 2 }} className="lg:col-span-2">
            {prediction && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Visual Dashboard Cards */}
                <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  {/* Probability */}
                  <div className={`clay-card ${prediction.probability >= 0.7 ? 'clay-card-green' : prediction.probability >= 0.4 ? 'clay-card-orange' : 'clay-card-coral'}`}>
                    <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', margin: '0 0 10px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Agreement Probability</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '42px', fontWeight: 800, fontFamily: 'Outfit' }}>{Math.round(prediction.probability * 100)}%</span>
                    </div>
                    <div className="clay-meter-container">
                      <div 
                        className={`clay-meter-fill ${prediction.probability >= 0.7 ? 'clay-meter-fill-green' : prediction.probability >= 0.4 ? 'clay-meter-fill-orange' : 'clay-meter-fill-coral'}`}
                        style={{ width: `${prediction.probability * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Estimated Savings */}
                  <div className="clay-card clay-card-green">
                    <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', margin: '0 0 10px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Estimated Savings</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '42px', fontWeight: 800, fontFamily: 'Outfit' }}>
                        ${planDetails ? planDetails.savings.toLocaleString() : prediction.savings_amount.toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--clay-green-dark)', fontWeight: 700, margin: 0 }}>
                      ⚡ Approx {Math.round(((planDetails ? planDetails.savings : prediction.savings_amount) / prediction.total_amount) * 100)}% written off
                    </p>
                  </div>

                  {/* Target Offer */}
                  <div className="clay-card clay-card-blue">
                    <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', margin: '0 0 10px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Target Offer</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '42px', fontWeight: 800, fontFamily: 'Outfit' }}>
                        ${planDetails ? planDetails.total.toLocaleString() : prediction.recommended_amount.toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--clay-blue-dark)', fontWeight: 700, margin: 0 }}>
                      {paymentPlanType === 'lump_sum' ? 'Single Lump-Sum Payment' : `${planDetails.months} payments of $${planDetails.monthly}/mo`}
                    </p>
                  </div>
                </div>

                {/* Lender Profile Card */}
                <div className="clay-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="clay-card clay-card-blue" style={{ borderRadius: '50%', padding: '10px', display: 'flex', border: 'none' }}>
                      <Landmark size={20} color="#7792fb" />
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', margin: 0, fontWeight: 700 }}>{prediction.creditor_name} Profile</h3>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Lender Negotiating Cooperativeness: <strong style={{ color: prediction.lender_cooperativeness === 'High' ? 'var(--clay-green-dark)' : prediction.lender_cooperativeness === 'Low' ? 'var(--clay-coral-dark)' : 'var(--clay-orange-dark)' }}>{prediction.lender_cooperativeness}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ borderTop: '2px solid #eef2f8', paddingTop: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px', fontWeight: 600, marginBottom: '15px' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Typical Settlement Rate</span>
                        <span>{prediction.typical_settlement_range}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Recommended Offer Range</span>
                        <span>${prediction.min_predicted_amount.toLocaleString()} - ${prediction.max_predicted_amount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '10px', 
                      padding: '12px 16px', 
                      borderRadius: '16px', 
                      backgroundColor: '#f6f8fc',
                      fontSize: '13px',
                      fontWeight: 500,
                      lineHeight: 1.4
                    }}>
                      <ShieldCheck size={18} color="var(--clay-green-dark)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>
                        <strong>Action Strategy</strong>: Start negotiations at <strong>{Math.round((prediction.min_predicted_amount/prediction.total_amount)*100)}%</strong>. 
                        If the creditor demands a higher sum, incrementally increase your offer toward <strong>{Math.round((prediction.recommended_amount/prediction.total_amount)*100)}%</strong>.
                      </span>
                    </div>
                  </div>

                  {/* Redirect button to Letter generator */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button 
                      onClick={() => onNavigate('letters')}
                      className="clay-btn clay-btn-blue"
                    >
                      Draft Negotiation Letter <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
