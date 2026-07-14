import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CreditCard, Calculator, FileEdit, LogOut, ShieldCheck, User } from 'lucide-react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Loans from './pages/Loans';
import SettlementPredictor from './pages/SettlementPredictor';
import LetterGenerator from './pages/LetterGenerator';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, loans, predictor, letters
  const [userProfile, setUserProfile] = useState(null);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      } else {
        // Token expired or invalid, clear it
        handleLogout();
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const handleLoginSuccess = () => {
    const savedToken = localStorage.getItem('token');
    setToken(savedToken);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUserProfile(null);
  };

  if (!token) {
    return (
      <div style={{ padding: '40px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
          <ShieldCheck size={32} color="#7792fb" />
          <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', fontWeight: 800, margin: 0 }}>
            Antigravity Debt Relief
          </h1>
        </div>
        <Auth onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard token={token} onNavigate={setActiveTab} />;
      case 'loans':
        return <Loans token={token} />;
      case 'predictor':
        return <SettlementPredictor token={token} onNavigate={setActiveTab} />;
      case 'letters':
        return <LetterGenerator token={token} />;
      default:
        return <Dashboard token={token} onNavigate={setActiveTab} />;
    }
  };

  const isTabActive = (tabName) => activeTab === tabName;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
      
      {/* Top Navbar Header */}
      <header className="clay-card" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        gap: '20px',
        padding: '16px 30px', 
        marginBottom: '40px',
        borderRadius: '24px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <ShieldCheck size={28} color="#7792fb" />
          <span style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
            Antigravity Debt Relief
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ 
          display: 'flex', 
          backgroundColor: '#f0f3f8', 
          borderRadius: '18px', 
          padding: '4px',
          boxShadow: 'inset 2px 2px 5px rgba(163, 177, 198, 0.25), inset -2px -2px 5px rgba(255, 255, 255, 0.7)'
        }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '14px',
              fontFamily: 'Outfit',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: isTabActive('dashboard') ? '#ffffff' : 'transparent',
              color: isTabActive('dashboard') ? 'var(--clay-blue-dark)' : 'var(--text-secondary)',
              boxShadow: isTabActive('dashboard') ? '2px 2px 4px rgba(163, 177, 198, 0.15), inset 1px 1px 2px #ffffff' : 'none'
            }}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '14px',
              fontFamily: 'Outfit',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: isTabActive('loans') ? '#ffffff' : 'transparent',
              color: isTabActive('loans') ? 'var(--clay-blue-dark)' : 'var(--text-secondary)',
              boxShadow: isTabActive('loans') ? '2px 2px 4px rgba(163, 177, 198, 0.15), inset 1px 1px 2px #ffffff' : 'none'
            }}
          >
            <CreditCard size={16} />
            Loans
          </button>
          <button
            onClick={() => setActiveTab('predictor')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '14px',
              fontFamily: 'Outfit',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: isTabActive('predictor') ? '#ffffff' : 'transparent',
              color: isTabActive('predictor') ? 'var(--clay-blue-dark)' : 'var(--text-secondary)',
              boxShadow: isTabActive('predictor') ? '2px 2px 4px rgba(163, 177, 198, 0.15), inset 1px 1px 2px #ffffff' : 'none'
            }}
          >
            <Calculator size={16} />
            Predictor
          </button>
          <button
            onClick={() => setActiveTab('letters')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '14px',
              fontFamily: 'Outfit',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: isTabActive('letters') ? '#ffffff' : 'transparent',
              color: isTabActive('letters') ? 'var(--clay-blue-dark)' : 'var(--text-secondary)',
              boxShadow: isTabActive('letters') ? '2px 2px 4px rgba(163, 177, 198, 0.15), inset 1px 1px 2px #ffffff' : 'none'
            }}
          >
            <FileEdit size={16} />
            AI Writer
          </button>
        </nav>

        {/* User profile + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {userProfile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="clay-card clay-card-blue" style={{ borderRadius: '50%', padding: '6px', border: 'none', display: 'flex' }}>
                <User size={14} color="#7792fb" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                {userProfile.username}
              </span>
            </div>
          )}
          <button 
            onClick={handleLogout} 
            className="clay-btn clay-btn-coral"
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '12px' }}
            title="Log out of session"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <main style={{ minHeight: '60vh', marginBottom: '40px' }}>
        {renderActivePage()}
      </main>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center', 
        fontSize: '12px', 
        color: 'var(--text-secondary)',
        fontWeight: 600,
        padding: '20px 0',
        borderTop: '2px solid rgba(163, 177, 198, 0.15)'
      }}>
        <p>🛡️ Antigravity Financial Relief and Recovery Platform — All simulated calculations are context-based. Always consult a licensed attorney or financial counselor for bankruptcy advice.</p>
      </footer>
    </div>
  );
}
