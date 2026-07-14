import React, { useState, useEffect } from 'react';
import { DollarSign, ShieldAlert, Sparkles, TrendingUp, Edit2, Check, RefreshCw } from 'lucide-react';

export default function Dashboard({ token, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [loans, setLoans] = useState([]);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [expensesInput, setExpensesInput] = useState('');
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [analysisRes, loansRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/finance/analysis', { headers }),
        fetch('http://127.0.0.1:8000/api/loans', { headers })
      ]);

      if (!analysisRes.ok || !loansRes.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const analysisData = await analysisRes.json();
      const loansData = await loansRes.json();

      setData(analysisData);
      setLoans(loansData);
      setIncomeInput(analysisData.monthly_income);
      setExpensesInput(analysisData.monthly_expenses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monthly_income: parseFloat(incomeInput),
          monthly_expenses: parseFloat(expensesInput)
        })
      });

      if (!response.ok) throw new Error('Failed to update financial values');
      
      setIsEditingBudget(false);
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="clay-card clay-card-blue" style={{ padding: '30px 50px', textAlign: 'center' }}>
          <RefreshCw size={36} className="animate-spin" style={{ animation: 'spin 2s linear infinite', color: '#7792fb' }} />
          <h3 style={{ marginTop: '15px', fontFamily: 'Outfit' }}>Calculating Financial Health...</h3>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const getStressColorClass = (level) => {
    switch (level) {
      case 'low': return 'clay-card-green';
      case 'moderate': return 'clay-card-orange';
      case 'high':
      case 'critical': return 'clay-card-coral';
      default: return '';
    }
  };

  const getStressLabelColor = (level) => {
    switch (level) {
      case 'low': return 'var(--clay-green-dark)';
      case 'moderate': return 'var(--clay-orange-dark)';
      case 'high':
      case 'critical': return 'var(--clay-coral-dark)';
      default: return 'var(--clay-blue-dark)';
    }
  };

  // Heuristic advice list
  const getFinancialAdvice = () => {
    const advice = [];
    if (data.debt_stress_score >= 45) {
      advice.push({
        title: "High Debt Stress Detected",
        desc: "Initiate settlement predictions for your highly delinquent accounts to see potential settlement target figures.",
        action: "View Predictor",
        tab: "predictor"
      });
    }
    if (loans.some(l => l.delinquency_months >= 3 && l.status === 'active')) {
      advice.push({
        title: "Accounts Nearing Default",
        desc: "Some accounts are 3+ months delinquent. Draft hardship letters using Gemini AI immediately.",
        action: "Generate Hardship Letter",
        tab: "letters"
      });
    }
    if (data.monthly_surplus < 0) {
      advice.push({
        title: "Negative Monthly Cashflow",
        desc: "Your monthly expenses + EMIs exceed your income. Review your expenses or contact lenders for hardship programs.",
        action: "Update Income/Expenses",
        tab: "self"
      });
    } else if (advice.length === 0) {
      advice.push({
        title: "Finances Stable",
        desc: "You have a positive cash surplus. Set aside emergency savings or consider paying off high-interest loans early.",
        action: "Track Loans",
        tab: "loans"
      });
    }
    return advice;
  };

  return (
    <div>
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '32px', fontWeight: 700, margin: '0 0 5px 0' }}>Financial Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>Track your debt burden, DTI index, and recover your financial balance.</p>
        </div>
        
        <button 
          onClick={() => setIsEditingBudget(!isEditingBudget)} 
          className="clay-btn clay-btn-secondary"
        >
          <Edit2 size={16} />
          Adjust Budget
        </button>
      </div>

      {/* Adjust Budget Drawer */}
      {isEditingBudget && (
        <form onSubmit={handleUpdateBudget} className="clay-card clay-card-blue" style={{ marginBottom: '30px', animation: 'slideIn 0.3s ease-out' }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', margin: '0 0 20px 0', fontWeight: 700 }}>Adjust Monthly Budget</h3>
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Monthly Take-Home Income ($)</label>
              <input 
                type="number" 
                required 
                min="0"
                className="clay-input" 
                value={incomeInput} 
                onChange={(e) => setIncomeInput(e.target.value)} 
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Monthly Core Living Expenses ($)</label>
              <input 
                type="number" 
                required 
                min="0"
                className="clay-input" 
                value={expensesInput} 
                onChange={(e) => setExpensesInput(e.target.value)} 
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsEditingBudget(false)} className="clay-btn clay-btn-secondary">Cancel</button>
            <button type="submit" className="clay-btn clay-btn-blue">
              <Check size={16} /> Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Main Analysis Cards Grid */}
      <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
        {/* Metric 1: Debt Stress Score */}
        <div className={`clay-card ${getStressColorClass(data.debt_stress_level)}`} style={{ position: 'relative', overflow: 'hidden' }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', margin: '0 0 15px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Debt Stress Index</h3>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '15px' }}>
            <span style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'Outfit' }}>{Math.round(data.debt_stress_score)}</span>
            <span style={{ fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 600 }}>/ 100</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div className="clay-card" style={{
              padding: '6px 14px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              display: 'inline-block',
              boxShadow: '2px 2px 4px rgba(163,177,198,0.2), inset 1px 1px 2px #fff',
              border: 'none'
            }}>
              <span style={{ 
                fontFamily: 'Outfit', 
                fontWeight: 700, 
                fontSize: '13px',
                color: getStressLabelColor(data.debt_stress_level), 
                textTransform: 'uppercase' 
              }}>
                {data.debt_stress_level} Stress
              </span>
            </div>
          </div>

          {/* Claymorphic linear stress indicator */}
          <div className="clay-meter-container">
            <div 
              className={`clay-meter-fill ${
                data.debt_stress_level === 'low' ? 'clay-meter-fill-green' :
                data.debt_stress_level === 'moderate' ? 'clay-meter-fill-orange' : 'clay-meter-fill-coral'
              }`}
              style={{ width: `${data.debt_stress_score}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Monthly Cash Surplus */}
        <div className={`clay-card ${data.monthly_surplus < 0 ? 'clay-card-coral' : 'clay-card-green'}`}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', margin: '0 0 15px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Monthly Cash Surplus</h3>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '15px' }}>
            <span style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'Outfit' }}>
              {data.monthly_surplus < 0 ? '-' : ''}${Math.abs(Math.round(data.monthly_surplus))}
            </span>
            <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 600 }}>/ month</span>
          </div>

          <p style={{ fontSize: '14px', margin: '0 0 20px 0', fontWeight: 500, lineHeight: 1.4 }}>
            {data.monthly_surplus < 0 
              ? 'Critical deficit: Your basic costs and loan EMIs exceed monthly income.' 
              : 'Positive surplus: Money available for credit negotiations or savings.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <span>Income: ${data.monthly_income}</span>
            <span>Expenses + EMI: ${data.monthly_expenses + data.total_monthly_emi}</span>
          </div>
        </div>

        {/* Metric 3: Debt-To-Income (DTI) Ratio */}
        <div className="clay-card">
          <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', margin: '0 0 15px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Debt-To-Income (DTI) Ratio</h3>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '15px' }}>
            <span style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'Outfit' }}>{Math.round(data.debt_to_income_ratio)}%</span>
          </div>

          <p style={{ fontSize: '14px', margin: '0 0 20px 0', fontWeight: 500, lineHeight: 1.4 }}>
            {data.debt_to_income_ratio > 36 
              ? 'High DTI: More than 36% of your income goes to repay debt payments. Lenders consider this high risk.' 
              : 'Healthy DTI: Your debt obligations are within the recommended financial threshold.'}
          </p>

          <div className="clay-meter-container">
            <div 
              className={`clay-meter-fill ${data.debt_to_income_ratio > 36 ? 'clay-meter-fill-coral' : 'clay-meter-fill-blue'}`}
              style={{ width: `${Math.min(100, data.debt_to_income_ratio)}%` }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', margin: '0' }} className="md:grid-cols-3">
        {/* Left Side: Recommended Recovery Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '22px', fontWeight: 700, margin: '10px 0 0 0' }}>AI Recovery Actions</h2>
          {getFinancialAdvice().map((adv, index) => (
            <div key={index} className="clay-card clay-card-interactive" style={{ padding: '20px', borderLeft: '6px solid var(--clay-blue)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Sparkles size={18} color="#7792fb" />
                <h4 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700 }}>{adv.title}</h4>
              </div>
              <p style={{ fontSize: '13px', margin: '0 0 15px 0', color: 'var(--text-secondary)', lineHeight: 1.4, fontWeight: 500 }}>{adv.desc}</p>
              
              {adv.tab !== "self" && (
                <button 
                  onClick={() => onNavigate(adv.tab)} 
                  className="clay-btn clay-btn-blue"
                  style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '12px' }}
                >
                  {adv.action}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Right Side: Active Delinquent Accounts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontFamily: 'Outfit', fontSize: '22px', fontWeight: 700, margin: '10px 0 0 0' }}>Active Creditor Accounts</h2>
            <button 
              onClick={() => onNavigate('loans')} 
              className="clay-btn clay-btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '12px' }}
            >
              Add/Edit Accounts
            </button>
          </div>

          <div className="clay-card" style={{ padding: '10px 0 0 0' }}>
            {loans.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                <ShieldAlert size={40} color="#cbd3e2" style={{ margin: '0 auto 10px auto' }} />
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>No accounts tracked. Add a loan to begin!</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', padding: '0 15px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '15px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eef2f8', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>
                      <th style={{ padding: '12px 10px' }}>Lender</th>
                      <th style={{ padding: '12px 10px' }}>Balance</th>
                      <th style={{ padding: '12px 10px' }}>Delinquency</th>
                      <th style={{ padding: '12px 10px' }}>EMI</th>
                      <th style={{ padding: '12px 10px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan) => (
                      <tr key={loan.id} style={{ borderBottom: '1px solid #eef2f8', fontSize: '14px', fontWeight: 600 }}>
                        <td style={{ padding: '16px 10px' }}>{loan.creditor_name}</td>
                        <td style={{ padding: '16px 10px' }}>${loan.total_amount.toLocaleString()}</td>
                        <td style={{ padding: '16px 10px' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '10px', 
                            fontSize: '11px',
                            backgroundColor: loan.delinquency_months >= 6 ? '#fff1f1' : loan.delinquency_months >= 3 ? '#fffaf0' : '#f0faf6',
                            color: loan.delinquency_months >= 6 ? 'var(--clay-coral-dark)' : loan.delinquency_months >= 3 ? 'var(--clay-orange-dark)' : 'var(--clay-green-dark)'
                          }}>
                            {loan.delinquency_months} month{loan.delinquency_months !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '16px 10px' }}>${loan.emi}/mo</td>
                        <td style={{ padding: '16px 10px' }}>
                          <button 
                            onClick={() => onNavigate('predictor')} 
                            className="clay-btn clay-btn-blue"
                            style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '10px' }}
                          >
                            Analyze
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
