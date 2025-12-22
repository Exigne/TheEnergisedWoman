import React, { useState, useEffect } from 'react';
import { databaseAPI } from './api/database.js';
import Dashboard from './components/Dashboard'; // ADD THIS LINE
import './App.css';

const AuthForm = ({ isLogin, onSuccess, onSwitch }) => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Debug function to test database connection
  const testDatabase = async () => {
    console.log('=== DATABASE DEBUG ===');
    setDebugInfo('Testing connection...');
    
    try {
      // Test the database function directly
      const response = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'getUser', 
          email: formData.email || 'test@test.com', 
          password: formData.password || 'test123' 
        })
      });
      
      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Raw response:', `"${text}"`);
      console.log('Response length:', text.length);
      
      setDebugInfo(`Raw response: "${text}" (${text.length} bytes)`);
      
      if (!text || text.trim() === '') {
        setDebugInfo('❌ Empty response - database may need setup');
      } else {
        try {
          const data = JSON.parse(text);
          setDebugInfo(`Found: ${data ? JSON.stringify(data) : 'null'}`);
        } catch (e) {
          setDebugInfo(`Raw text: ${text}`);
        }
      }
    } catch (err) {
      setDebugInfo(`❌ Error: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebugInfo(''); // Clear debug info

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', formData.email);
    console.log('Password:', formData.password);
    console.log('Action:', isLogin ? 'login' : 'register');

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      let user;
      
      if (isLogin) {
        console.log('Attempting login...');
        user = await databaseAPI.getUser(formData.email, formData.password);
        console.log('Login result:', user);
        
        if (!user) {
          setError('Invalid credentials - user not found');
          setLoading(false);
          return;
        }
      } else {
        console.log('Attempting registration...');
        user = await databaseAPI.createUser(formData.email, formData.password);
        console.log('Registration result:', user);
      }
      
      console.log('Success! User:', user);
      onSuccess(user);
      
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
      setDebugInfo(`Error: ${err.message}`);
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
        
        {error && <div style={{ background: '#fed7d7', color: '#c53030', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        
        {/* DEBUG BUTTON - shows exactly what's happening */}
        <button 
          type="button" 
          onClick={testDatabase}
          style={{background: '#ff9800', color: 'white', padding: '0.5rem', marginBottom: '1rem', width: '100%', fontSize: '0.9rem'}}
        >
          🔍 Test Database Connection
        </button>
        
        {/* DEBUG INFO DISPLAY */}
        {debugInfo && (
          <div style={{ background: '#e3f2fd', color: '#1565c0', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem', wordBreak: 'break-all' }}>
            {debugInfo}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            style={{ padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            style={{ padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }}
          />
          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
              style={{ padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }}
            />
          )}
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

// Rest of your App.jsx (Dashboard and App components) remain the same...
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
