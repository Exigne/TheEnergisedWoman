import React, { useState, useEffect } from 'react'; // Added hooks to the import just in case

const Dashboard = ({ currentUser, onLogout }) => {
  // Simple alert-based functions
  const handleLogWorkout = () => {
    alert('📝 Workout Logging Feature!\n\nComing soon!');
  };

  const handleViewProgress = () => {
    alert('📊 Progress Dashboard Coming Soon!');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '3rem', 
        borderRadius: '20px', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '600px',
        width: '100%'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: '#4a5568', fontSize: '2.5rem' }}>🎵 FitFiddle</h1>
          <h2 style={{ color: '#718096', fontSize: '1.5rem' }}>Dashboard</h2>
        </div>

        <div style={{ marginBottom: '3rem' }}>
          <p style={{ color: '#4a5568', fontSize: '1.2rem' }}>
            Welcome, <strong>{currentUser?.email || 'User'}</strong>!
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
          <button onClick={handleLogWorkout} style={buttonStyle}>🏋️ Log New Workout</button>
          <button onClick={handleViewProgress} style={{...buttonStyle, background: '#3182ce'}}>📊 View Progress</button>
        </div>

        <button onClick={onLogout} style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </div>
  );
};

const buttonStyle = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  border: 'none',
  padding: '1.2rem',
  borderRadius: '12px',
  fontSize: '1.1rem',
  fontWeight: '600',
  cursor: 'pointer'
};

export default Dashboard;
