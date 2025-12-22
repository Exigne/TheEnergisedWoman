import React, { useState, useEffect } from 'react';

// In your Dashboard component, add these functions:

const Dashboard = ({ currentUser, onLogout }) => {
  const [workouts, setWorkouts] = useState([]);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);

  // Load workouts when component mounts
  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const response = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'getWorkouts', 
          userId: currentUser.id 
        })
      });
      
      const data = await response.json();
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  };

  const handleLogWorkout = () => {
    setShowWorkoutForm(true);
  };

  const handleViewProgress = () => {
    alert(`You have ${workouts.length} workouts logged! \n\nComing soon: Detailed progress charts with musical visualizations! 🎵`);
  };

  const handleAddWorkout = async (workoutData) => {
    try {
      const response = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'addWorkout', 
          userId: currentUser.id,
          name: workoutData.name,
          exercises: workoutData.exercises,
          duration: workoutData.duration
        })
      });
      
      if (response.ok) {
        await loadWorkouts(); // Reload workouts
        setShowWorkoutForm(false);
        alert('Workout logged successfully! 💪');
      }
    } catch (error) {
      console.error('Error adding workout:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '20px', padding: '3rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#4a5568' }}>🎵 FitFiddle Dashboard</h1>
          <button onClick={onLogout} style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>

        {/* Welcome Message */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#718096' }}>Welcome, {currentUser?.email}!</h2>
          <p style={{ color: '#a0aec0' }}>Ready to track your fitness journey with musical motivation?</p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          <div style={{ background: '#f7fafc', padding: '2rem', borderRadius: '12px', border: '2px solid #e2e8f0' }}>
            <h3 style={{ color: '#4a5568' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={handleLogWorkout} style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem'
              }}>
                🏋️ Log New Workout
              </button>
              <button onClick={handleViewProgress} style={{
                background: '#4299e1', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem'
              }}>
                📊 View Progress ({workouts.length})
              </button>
            </div>
          </div>

          {/* Recent Workouts */}
          <div style={{ background: '#f7fafc', padding: '2rem', borderRadius: '12px', border: '2px solid #e2e8f0' }}>
            <h3 style={{ color: '#4a5568' }}>Recent Activity</h3>
            {workouts.length === 0 ? (
              <p style={{ color: '#a0aec0', marginTop: '1rem' }}>No workouts logged yet. Start your fitness journey!</p>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                {workouts.slice(0, 3).map((workout, index) => (
                  <div key={index} style={{ 
                    padding: '0.5rem', 
                    marginBottom: '0.5rem', 
                    background: 'white', 
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <strong>{workout.name}</strong> - {workout.duration}min
                    <br />
                    <small style={{ color: '#718096' }}>
                      {new Date(workout.date).toLocaleDateString()}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coming Soon Features */}
        <div style={{
          padding: '2rem', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '12px', color: 'white', textAlign: 'center'
        }}>
          <h3>🎵 Musical Fitness Features Coming Soon!</h3>
          <p>Volume charts, muscle group breakdown, consistency heatmaps, and more!</p>
        </div>

        {/* Simple Workout Form (when button clicked) */}
        {showWorkoutForm && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '500px', width: '90%' }}>
              <h3>Log New Workout</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleAddWorkout({
                  name: formData.get('name'),
                  exercises: formData.get('exercises').split(',').map(e => e.trim()),
                  duration: parseInt(formData.get('duration'))
                });
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input name="name" placeholder="Workout name" required style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                  <input name="exercises" placeholder="Exercises (comma separated)" required style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                  <input name="duration" type="number" placeholder="Duration (minutes)" required style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" style={{ background: '#48bb78', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}>Save Workout</button>
                    <button type="button" onClick={() => setShowWorkoutForm(false)} style={{ background: '#e2e8f0', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
