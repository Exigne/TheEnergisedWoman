import React from 'react';

const Dashboard = ({ currentUser, onLogout }) => {
  // Simple alert-based functions (no hooks needed)
  const handleLogWorkout = () => {
    alert('📝 Workout Logging Feature!\n\nEnter workout details:\n• Workout name\n• Exercises (comma separated)\n• Duration (minutes)\n\nFeature coming soon with full form!');
  };

  const handleViewProgress = () => {
    alert('📊 Progress Dashboard Coming Soon!\n\nMusical fitness features:\n• Volume charts with sound waves\n• Muscle group breakdown with beats\n• Consistency heatmaps with rhythm\n• PR alerts with musical notifications');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
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
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: '#4a5568', fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎵 FitFiddle</h1>
          <h2 style={{ color: '#718096', fontSize: '1.5rem' }}>Dashboard</h2>
        </div>

        {/* Welcome Message */}
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ color: '#4a5568', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            Welcome, <strong>{currentUser?.email}</strong>!
          </p>
          <p style={{ color: '#a0aec0' }}>Ready to track your fitness journey?</p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
          <button onClick={handleLogWorkout} style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '1.2rem 2rem',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
          }} onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
             onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}>
            🏋️ Log New Workout
          </button>
          
          <button onClick={handleViewProgress} style={{
            background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
            color: 'white',
            border: 'none',
            padding: '1.2rem 2rem',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 15px rgba(66, 153, 225, 0.4)'
          }} onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
             onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}>
            📊 View Progress
          </button>
        </div>

        {/* Feature Preview */}
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '12px',
          padding: '2rem',
          color: 'white',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>🎵 Musical Fitness Features</h3>
          <div style={{ textAlign: 'left', fontSize: '0.9rem' }}>
            <p>• Volume charts with sound wave visualization</p>
            <p>• Muscle group breakdown with rhythm patterns</p>
            <p>• Consistency heatmaps with musical progressions</p>
            <p>• PR alerts with custom notification sounds</p>
          </div>
        </div>

        {/* Logout Button */}
        <button onClick={onLogout} style={{
          background: '#e53e3e',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
