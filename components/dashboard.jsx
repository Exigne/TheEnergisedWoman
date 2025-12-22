// Create a new file: Dashboard.jsx
import React from 'react';

const Dashboard = ({ currentUser, onLogout }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        padding: '3rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#4a5568' }}>FitFiddle Dashboard</h1>
          <button 
            onClick={onLogout}
            style={{
              background: '#e53e3e',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#718096' }}>Welcome, {currentUser?.email}!</h2>
          <p style={{ color: '#a0aec0' }}>Ready to track your fitness journey?</p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          <div style={{
            background: '#f7fafc',
            padding: '2rem',
            borderRadius: '12px',
            border: '2px solid #e2e8f0'
          }}>
            <h3 style={{ color: '#4a5568' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <button style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}>
                Log New Workout
              </button>
              <button style={{
                background: '#4299e1',
                color: 'white',
                border: 'none',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}>
                View Progress
              </button>
            </div>
          </div>

          <div style={{
            background: '#f7fafc',
            padding: '2rem',
            borderRadius: '12px',
            border: '2px solid #e2e8f0'
          }}>
            <h3 style={{ color: '#4a5568' }}>Recent Activity</h3>
            <p style={{ color: '#a0aec0', marginTop: '1rem' }}>
              No workouts logged yet. Start your fitness journey!
            </p>
          </div>
        </div>

        <div style={{
          marginTop: '3rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '12px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h3>🎵 Musical Fitness Features Coming Soon!</h3>
          <p>Volume charts, muscle group breakdown, and consistency heatmaps</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
