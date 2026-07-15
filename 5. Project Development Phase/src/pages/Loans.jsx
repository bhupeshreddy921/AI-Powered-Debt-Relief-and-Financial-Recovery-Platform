import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Check, X, CreditCard, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Loans({ token }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form inputs
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [creditorName, setCreditorName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [emi, setEmi] = useState('0');
  const [delinquencyMonths, setDelinquencyMonths] = useState('0');
  const [status, setStatus] = useState('active');

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/loans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to retrieve loans list.');
      const data = await response.json();
      setLoans(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchLoans();
  }, [token]);

  const handleResetForm = () => {
    setCreditorName('');
    setTotalAmount('');
    setInterestRate('0');
    setEmi('0');
    setDelinquencyMonths('0');
    setStatus('active');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAddLoan = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/api/loans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creditor_name: creditorName,
          total_amount: parseFloat(totalAmount),
          interest_rate: parseFloat(interestRate),
          emi: parseFloat(emi),
          delinquency_months: parseInt(delinquencyMonths),
          status
        })
      });

      if (!response.ok) throw new Error('Failed to create new loan record.');
      
      handleResetForm();
      fetchLoans();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (loan) => {
    setEditingId(loan.id);
    setCreditorName(loan.creditor_name);
    setTotalAmount(loan.total_amount);
    setInterestRate(loan.interest_rate);
    setEmi(loan.emi);
    setDelinquencyMonths(loan.delinquency_months);
    setStatus(loan.status);
    setIsAdding(false);
  };

  const handleUpdateLoan = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/loans/${editingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creditor_name: creditorName,
          total_amount: parseFloat(totalAmount),
          interest_rate: parseFloat(interestRate),
          emi: parseFloat(emi),
          delinquency_months: parseInt(delinquencyMonths),
          status
        })
      });

      if (!response.ok) throw new Error('Failed to update loan record.');
      
      handleResetForm();
      fetchLoans();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteLoan = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account? This will permanently remove its history.")) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/loans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete loan.');
      fetchLoans();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (loan) => {
    const nextStatus = loan.status === 'settled' ? 'active' : 'settled';
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/loans/${loan.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: nextStatus
        })
      });

      if (!response.ok) throw new Error('Failed to change loan status.');
      fetchLoans();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '32px', fontWeight: 700, margin: '0 0 5px 0' }}>Creditor Accounts</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>Add new accounts, edit active balances, or mark resolved debts.</p>
        </div>
        
        {!isAdding && !editingId && (
          <button 
            onClick={() => { handleResetForm(); setIsAdding(true); }} 
            className="clay-btn clay-btn-blue"
          >
            <Plus size={16} />
            Track New Debt
          </button>
        )}
      </div>

      {error && (
        <div className="clay-card clay-card-coral" style={{ padding: '12px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={18} color="var(--clay-coral-dark)" />
          <span style={{ fontWeight: 600, color: 'var(--clay-coral-dark)' }}>{error}</span>
        </div>
      )}

      {/* Adding or Editing Form Drawer */}
      {(isAdding || editingId) && (
        <form onSubmit={isAdding ? handleAddLoan : handleUpdateLoan} className="clay-card clay-card-blue" style={{ marginBottom: '30px', animation: 'slideIn 0.3s ease-out' }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', margin: '0 0 20px 0', fontWeight: 700 }}>
            {isAdding ? 'Track New Account' : 'Edit Creditor Account'}
          </h3>
          
          <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Creditor Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Discover Card"
                className="clay-input" 
                value={creditorName} 
                onChange={(e) => setCreditorName(e.target.value)} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Total Debt Balance ($)</label>
              <input 
                type="number" 
                required 
                min="1"
                placeholder="e.g. 5200"
                className="clay-input" 
                value={totalAmount} 
                onChange={(e) => setTotalAmount(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Interest Rate (% APR)</label>
              <input 
                type="number" 
                required 
                step="0.01"
                min="0"
                placeholder="e.g. 21.99"
                className="clay-input" 
                value={interestRate} 
                onChange={(e) => setInterestRate(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Minimum EMI ($)</label>
              <input 
                type="number" 
                required 
                min="0"
                placeholder="e.g. 150"
                className="clay-input" 
                value={emi} 
                onChange={(e) => setEmi(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Delinquency (Months Unpaid)</label>
              <input 
                type="number" 
                required 
                min="0"
                className="clay-input" 
                value={delinquencyMonths} 
                onChange={(e) => setDelinquencyMonths(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Resolution Status</label>
              <select 
                className="clay-input clay-select" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active (Unresolved)</option>
                <option value="settled">Settled (Fully Discharged)</option>
                <option value="defaulted">Defaulted / Charge-off</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleResetForm} className="clay-btn clay-btn-secondary">
              <X size={16} /> Cancel
            </button>
            <button type="submit" className="clay-btn clay-btn-blue">
              <Check size={16} /> {isAdding ? 'Save Account' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Main Loan List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading account directories...</div>
      ) : loans.length === 0 ? (
        <div className="clay-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <CreditCard size={48} color="#cbd3e2" style={{ margin: '0 auto 15px auto' }} />
          <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', margin: '0 0 10px 0', fontWeight: 700 }}>No accounts tracked</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 25px 0', fontWeight: 500 }}>Add your credit cards or personal loans to model negotiation programs.</p>
          <button onClick={() => setIsAdding(true)} className="clay-btn clay-btn-blue">Track Your First Loan</button>
        </div>
      ) : (
        <div className="dashboard-grid">
          {loans.map((loan) => (
            <div 
              key={loan.id} 
              className={`clay-card clay-card-interactive ${
                loan.status === 'settled' 
                  ? 'clay-card-green' 
                  : loan.delinquency_months >= 6 
                    ? 'clay-card-coral' 
                    : loan.delinquency_months >= 3 
                      ? 'clay-card-orange' 
                      : ''
              }`}
              style={{ position: 'relative' }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0' }}>{loan.creditor_name}</h3>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    padding: '3px 8px', 
                    borderRadius: '8px',
                    backgroundColor: loan.status === 'settled' ? '#ffffff' : '#f0f3f8',
                    color: loan.status === 'settled' ? 'var(--clay-green-dark)' : 'var(--text-secondary)'
                  }}>
                    {loan.status}
                  </span>
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleEditClick(loan)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    title="Edit account details"
                  >
                    <Edit3 size={16} color="var(--text-secondary)" />
                  </button>
                  <button 
                    onClick={() => handleDeleteLoan(loan.id)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    title="Delete account"
                  >
                    <Trash2 size={16} color="var(--clay-coral-dark)" />
                  </button>
                </div>
              </div>

              {/* Card Metrics */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Balance Due</span>
                <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Outfit', margin: '4px 0 10px 0' }}>
                  ${loan.total_amount.toLocaleString()}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', fontWeight: 600 }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Interest Rate</span>
                    <span>{loan.interest_rate}% APR</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Monthly EMI</span>
                    <span>${loan.emi}/mo</span>
                  </div>
                </div>
              </div>

              {/* Status bar & Settlement Actions */}
              <div style={{ 
                borderTop: '2px solid rgba(163, 177, 198, 0.15)', 
                paddingTop: '15px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                  <ShieldAlert size={14} color={loan.delinquency_months >= 3 ? 'var(--clay-coral-dark)' : 'var(--text-secondary)'} />
                  <span>{loan.delinquency_months} mo delinquent</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleToggleStatus(loan)}
                  className={`clay-btn ${loan.status === 'settled' ? 'clay-btn-secondary' : 'clay-btn-green'}`}
                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '10px' }}
                >
                  {loan.status === 'settled' ? (
                    <>
                      <X size={12} /> Reactivate
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={12} /> Mark Settled
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
