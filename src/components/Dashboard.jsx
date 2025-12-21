import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  // Mock auth for now
  const user = { email: 'user@fitasafiddle.com' };
  const authLoading = false;
  
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = '/api';

  const fetchWorkoutHistory = async () => {
    if (!user?.email) return;

    try {
      const res = await fetch(`${API_BASE_URL}/workouts?user=${encodeURIComponent(user.email)}`);
      if (!res.ok) return;
      
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Connection to backend failed:", err);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchWorkoutHistory();
    }
  }, [user?.email]);

  const handleLogWorkout = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      user_email: user.email,
      exercise,
      sets: Number(sets),
      reps: Number(reps),
      weight: Number(weight),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');
      
      alert('Workout logged! 💪');
      setExercise('');
      setSets('');
      setReps('');
      setWeight('');
      fetchWorkoutHistory();
    } catch (error) {
      console.error('Error logging workout:', error);
      alert('Failed to save workout');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user?.email) {
    return (
      <div className="error-container">
        <p>Please log in to continue</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2 className="dashboard-title">FitasaFiddle 💪</h2>
        <p className="user-email">{user.email}</p>
      </header>

      <div className="log-workout-section">
        <h3 className="section-title">Log New Session</h3>
        <form onSubmit={handleLogWorkout} className="workout-form">
          <input
            className="exercise-input"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            placeholder="Exercise Name (e.g., Bench Press)"
            required
          />
          
          <div className="stats-grid">
            <div className="stat-input">
              <label>Sets</label>
              <input
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                placeholder="3"
                required
              />
            </div>
            <div className="stat-input">
              <label>Reps</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="10"
                required
              />
            </div>
            <div className="stat-input">
              <label>Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="60"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="save-button"
          >
            {loading ? 'Logging...' : 'Save Workout 💾'}
          </button>
        </form>
      </div>

      <div className="history-section">
        <h3 className="section-title">Workout History</h3>
        {history.length === 0 ? (
          <div className="empty-state">
            <p>No workouts logged yet. Start training! 🏋️</p>
          </div>
        ) : (
          <div className="workout-list">
            {history.map((w) => (
              <div key={w.id} className="workout-card">
                <div className="workout-info">
                  <p className="exercise-name">{w.exercise}</p>
                  <p className="workout-stats">{w.sets} sets × {w.reps} reps</p>
                </div>
                <div className="weight-display">
                  <span className="weight-number">{w.weight}</span>
                  <span className="weight-unit">kg</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
