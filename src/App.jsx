import React, { useState, useEffect } from 'react';
import { databaseAPI } from './api/database.js';
import './App.css';
const AuthForm = ({ isLogin, onSuccess, onSwitch }) => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(''); // ✅ This was missing!
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setLoading(true);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // ... your existing login logic ...
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', padding: '3rem', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
                   textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        
        <h2 style={{ color: '#4a5568', marginBottom: '0.5rem' }}>{isLogin ? 'Login to FitFiddle' : 'Join FitFiddle'}</h2>
        <p style={{ color: '#718096', marginBottom: '2rem' }}>Musical Fitness App</p>
        
        {/* ✅ Now this will work because error is defined */}
        {error && <div style={{ background: '#fed7d7', color: '#c53030', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* your form inputs here */}
          
          <button type="submit" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', border: 'none', padding: '1rem', borderRadius: '12px',
            fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer'
          }} disabled={loading}>
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', color: '#718096' }}>
          {isLogin ? (
            <p>Don't have an account? <button onClick={onSwitch} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontWeight: '600' }}>Register</button></p>
          ) : (
            <p>Already have an account? <button onClick={onSwitch} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontWeight: '600' }}>Login</button></p>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check URL params for register view
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'register') {
      setIsLogin(false);
    }
  }, []);

  const handleAuthSuccess = (user) => {
    console.log('Auth successful:', user);
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const switchToRegister = () => {
    setIsLogin(false);
    window.history.pushState({}, '', '?view=register');
  };

  const switchToLogin = () => {
    setIsLogin(true);
    window.history.pushState({}, '', '?view=login');
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <Dashboard currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <AuthForm 
          isLogin={isLogin} 
          onSuccess={handleAuthSuccess}
          onSwitch={isLogin ? switchToRegister : switchToLogin}
        />
      )}
    </div>
  );
}

export default App;
