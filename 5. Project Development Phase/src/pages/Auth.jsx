import React, { useState } from 'react';
import { Mail, Lock, User, AlertCircle, Sparkles } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password } 
      : { email, username, password };

    try {
      const response = await fetch(`http://127.0.0.1:8000${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong. Please try again.');
      }

      if (isLogin) {
        localStorage.setItem('token', data.access_token);
        onLoginSuccess();
      } else {
        // Automatically switch to login on successful registration
        setIsLogin(true);
        setPassword('');
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '20px'
    }}>
      <div className="clay-card" style={{
        maxWidth: '450px',
        width: '100%',
        padding: '40px 30px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Soft floating colored circle backgrounds for a play on glassmorphism and claymorphism */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: 'rgba(139, 228, 197, 0.2)',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: 'rgba(143, 168, 255, 0.2)',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div className="clay-card clay-card-blue" style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0'
            }}>
              <Sparkles size={28} color="#7792fb" />
            </div>
          </div>

          <h2 style={{
            fontFamily: 'Outfit',
            fontSize: '28px',
            textAlign: 'center',
            margin: '0 0 10px 0',
            fontWeight: 700
          }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            margin: '0 0 30px 0',
            fontWeight: 500
          }}>
            {isLogin 
              ? 'Manage debts, predict settlements, and negotiate using Gemini AI.'
              : 'Join the AI-powered financial recovery platform today.'}
          </p>

          {/* Toggle Tab */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f0f3f8',
            borderRadius: '16px',
            padding: '4px',
            marginBottom: '30px',
            boxShadow: 'inset 3px 3px 6px rgba(163, 177, 198, 0.25), inset -3px -3px 6px rgba(255, 255, 255, 0.7)'
          }}>
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: isLogin ? '#ffffff' : 'transparent',
                borderRadius: '12px',
                fontFamily: 'Outfit',
                fontWeight: 600,
                color: isLogin ? 'var(--clay-blue-dark)' : 'var(--text-secondary)',
                boxShadow: isLogin ? '3px 3px 6px rgba(163, 177, 198, 0.15), inset 2px 2px 4px rgba(255, 255, 255, 0.9)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: !isLogin ? '#ffffff' : 'transparent',
                borderRadius: '12px',
                fontFamily: 'Outfit',
                fontWeight: 600,
                color: !isLogin ? 'var(--clay-blue-dark)' : 'var(--text-secondary)',
                boxShadow: !isLogin ? '3px 3px 6px rgba(163, 177, 198, 0.15), inset 2px 2px 4px rgba(255, 255, 255, 0.9)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="clay-card clay-card-coral" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '16px',
              fontSize: '14px',
              color: 'var(--clay-coral-dark)',
              fontWeight: 600
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#6c7f99" style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }} />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    className="clay-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ paddingLeft: '48px' }}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#6c7f99" style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="clay-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '30px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#6c7f99" style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="clay-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="clay-btn clay-btn-blue"
              style={{ width: '100%', padding: '14px' }}
            >
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
            </button>
          </form>

          {isLogin && (
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                💡 Quick Demo Access: Use <span style={{ color: 'var(--clay-blue-dark)' }}>test@example.com</span> & <span style={{ color: 'var(--clay-blue-dark)' }}>password123</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
