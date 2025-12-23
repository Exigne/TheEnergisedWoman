import React, { useState, useEffect } from 'react';
import { Activity, Dumbbell, TrendingUp, Calendar } from 'lucide-react';

const EXERCISES = {
  'Bench Press': { group: 'Chest', icon: '💪' },
  'Squat': { group: 'Legs', icon: '🦵' },
  'Deadlift': { group: 'Back', icon: '🏋️' },
  'Overhead Press': { group: 'Shoulders', icon: '💪' },
  'Pull-ups': { group: 'Back', icon: '🔝' },
  'Rows': { group: 'Back', icon: '⬅️' },
  'Bicep Curls': { group: 'Arms', icon: '💪' },
  'Tricep Dips': { group: 'Arms', icon: '💪' },
  'Lunges': { group: 'Legs', icon: '🦵' },
  'Planks': { group: 'Core', icon: '🧘' }
};

const FitnessDashboard = () => {
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false);
  const [currentExercises, setCurrentExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('Bench Press');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('fitnessUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadWorkouts();
    }
  }, [user]);

  const loadWorkouts = async () => {
    try {
      const res = await fetch(`/.netlify/functions/database?user=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setWorkouts(data.workouts || []);
    } catch (e) {
      console.error('Failed to load workouts', e);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) return alert('Enter email and password');
    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth', email, password, isRegistering })
      });
      const data = await res.json();
      if (res.ok) {
        const userData = { email: data.email };
        setUser(userData);
        localStorage.setItem('fitnessUser', JSON.stringify(userData));
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Authentication failed');
    }
    setLoading(false);
  };

  const addExercise = () => {
    if (!sets || !reps) return alert('Enter sets and reps');
    setCurrentExercises([...currentExercises, {
      name: selectedExercise,
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: parseFloat(weight) || 0,
      group: EXERCISES[selectedExercise].group
    }]);
    setSets(''); setReps(''); setWeight('');
  };

  const finishWorkout = async () => {
    if (currentExercises.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, exercises: currentExercises })
      });
      if (res.ok) {
        setCurrentExercises([]);
        setIsLoggingWorkout(false);
        await loadWorkouts();
      }
    } catch (err) {
      alert('Failed to save workout');
    }
    setLoading(false);
  };

  const calculateStats = () => {
    const totalSessions = workouts.length;
    const totalVolume = workouts.reduce((sum, w) => {
      const exercises = Array.isArray(w.exercises) ? w.exercises : [];
      return sum + exercises.reduce((s, e) => s + (e.sets * e.reps * e.weight), 0);
    }, 0);
    
    const last7Days = workouts.slice(0, 7).map(w => {
      const exercises = Array.isArray(w.exercises) ? w.exercises : [];
      return {
        date: new Date(w.created_at),
        volume: exercises.reduce((s, e) => s + (e.sets * e.reps * e.weight), 0),
        exercises: exercises.length
      };
    }).reverse();

    return { totalSessions, totalVolume, last7Days };
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.authCard}>
          <div style={styles.authHeader}>
            <Dumbbell size={48} color="#6366f1" />
            <h1 style={styles.authTitle}>FitTrack Pro</h1>
            <p style={styles.authSubtitle}>Your Personal Fitness Journey</p>
          </div>
          <div style={styles.authForm}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.authInput}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAuth()}
              style={styles.authInput}
            />
            <button onClick={handleAuth} style={styles.authButton} disabled={loading}>
              {loading ? 'Loading...' : (isRegistering ? 'Create Account' : 'Sign In')}
            </button>
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              style={styles.toggleButton}
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const avgVolume = stats.totalSessions > 0 ? Math.round(stats.totalVolume / stats.totalSessions) : 0;
  const maxVolume = Math.max(...stats.last7Days.map(d => d.volume), 1);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user.email.split('@')[0]}!</h1>
          <p style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => { setUser(null); localStorage.removeItem('fitnessUser'); }} style={styles.logoutBtn}>
          Sign Out
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <Dumbbell size={24} color="#fff" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalSessions}</div>
            <div style={styles.statLabel}>Total Sessions</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>
            🔥
          </div>
          <div>
            <div style={styles.statValue}>{Math.round(stats.totalVolume)}kg</div>
            <div style={styles.statLabel}>Total Volume</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)'}}>
            <TrendingUp size={24} color="#fff" />
          </div>
          <div>
            <div style={styles.statValue}>{avgVolume}kg</div>
            <div style={styles.statLabel}>Avg Volume</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #10b981, #059669)'}}>
            <Activity size={24} color="#fff" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.last7Days.length}</div>
            <div style={styles.statLabel}>This Week</div>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>📊 Weekly Progress</h3>
          </div>
          <div style={styles.chartContainer}>
            {stats.last7Days.map((day, i) => (
              <div key={i} style={styles.barWrapper}>
                <div style={styles.barContainer}>
                  <div 
                    style={{
                      ...styles.bar,
                      height: `${(day.volume / maxVolume) * 100}%`,
                      background: `linear-gradient(to top, ${['#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'][i % 7]}, ${['#be185d', '#d97706', '#059669', '#1d4ed8', '#6366f1', '#dc2626', '#0891b2'][i % 7]})`
                    }}
                  >
                    <span style={styles.barValue}>{Math.round(day.volume)}</span>
                  </div>
                </div>
                <div style={styles.barLabel}>{day.date.toLocaleDateString('en-US', { weekday: 'short' })[0]}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>📅 Recent Sessions</h3>
          </div>
          <div style={styles.sessionList}>
            {workouts.slice(0, 4).map((w, i) => {
              const exercises = Array.isArray(w.exercises) ? w.exercises : [];
              const volume = exercises.reduce((s, e) => s + (e.sets * e.reps * e.weight), 0);
              return (
                <div key={i} style={styles.sessionItem}>
                  <div style={styles.sessionIcon}>
                    <Calendar size={16} color="#6366f1" />
                  </div>
                  <div style={styles.sessionInfo}>
                    <div style={styles.sessionDate}>
                      {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div style={styles.sessionExercises}>{exercises.length} exercises</div>
                  </div>
                  <div style={styles.sessionVolume}>{Math.round(volume)}kg</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!isLoggingWorkout ? (
        <button onClick={() => setIsLoggingWorkout(true)} style={styles.fabButton}>
          <Dumbbell size={24} />
          <span style={{ marginLeft: '8px' }}>Start Workout</span>
        </button>
      ) : (
        <div style={styles.workoutPanel}>
          <div style={styles.workoutHeader}>
            <h3 style={styles.workoutTitle}>💪 Log Workout</h3>
            <button onClick={() => setIsLoggingWorkout(false)} style={styles.closeBtn}>✕</button>
          </div>
          
          <div style={styles.inputGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Exercise</label>
              <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} style={styles.select}>
                {Object.keys(EXERCISES).map(name => (
                  <option key={name} value={name}>{EXERCISES[name].icon} {name}</option>
                ))}
              </select>
            </div>
            
            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Sets</label>
                <input type="number" value={sets} onChange={e => setSets(e.target.value)} style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Reps</label>
                <input type="number" value={reps} onChange={e => setReps(e.target.value)} style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Weight (kg)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={styles.input} step="0.5" />
              </div>
            </div>
            
            <button onClick={addExercise} style={styles.addButton}>+ Add Exercise</button>
          </div>

          {currentExercises.length > 0 && (
            <div style={styles.exerciseList}>
              <h4 style={styles.listTitle}>Current Session</h4>
              {currentExercises.map((ex, i) => (
                <div key={i} style={styles.exerciseItem}>
                  <span>{EXERCISES[ex.name].icon} {ex.name}</span>
                  <span style={styles.exerciseDetails}>{ex.sets} × {ex.reps} @ {ex.weight}kg</span>
                </div>
              ))}
              <div style={styles.totalVolume}>
                Total: {currentExercises.reduce((s, e) => s + (e.sets * e.reps * e.weight), 0).toFixed(1)}kg
              </div>
              <button onClick={finishWorkout} disabled={loading} style={styles.finishButton}>
                {loading ? 'Saving...' : '✓ Finish Workout'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    color: '#f8fafc',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px'
  },
  greeting: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    background: 'linear-gradient(135deg, #f8fafc, #cbd5e1)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  date: {
    color: '#94a3b8',
    fontSize: '14px'
  },
  logoutBtn: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #ec4899, #be185d)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '100px'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '24px'
  },
  cardHeader: {
    marginBottom: '20px'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0
  },
  chartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    height: '200px'
  },
  barWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  barContainer: {
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end'
  },
  bar: {
    width: '100%',
    borderRadius: '8px 8px 0 0',
    position: 'relative',
    minHeight: '4px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '4px'
  },
  barValue: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#fff'
  },
  barLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600'
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  sessionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  sessionIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(99, 102, 241, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sessionInfo: {
    flex: 1
  },
  sessionDate: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '2px'
  },
  sessionExercises: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  sessionVolume: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#6366f1'
  },
  fabButton: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    border: 'none',
    borderRadius: '16px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
    display: 'flex',
    alignItems: 'center'
  },
  workoutPanel: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '400px',
    maxWidth: 'calc(100vw - 48px)',
    background: 'rgba(30, 27, 75, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
  },
  workoutHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  workoutTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: '#fff',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px'
  },
  inputGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  inputRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px'
  },
  label: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600'
  },
  select: {
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none'
  },
  input: {
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none'
  },
  addButton: {
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer'
  },
  exerciseList: {
    marginTop: '20px',
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '16px'
  },
  listTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '12px'
  },
  exerciseItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    fontSize: '14px'
  },
  exerciseDetails: {
    color: '#94a3b8'
  },
  totalVolume: {
    marginTop: '12px',
    padding: '12px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: '700',
    color: '#6366f1'
  },
  finishButton: {
    marginTop: '12px',
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer'
  },
  authCard: {
    maxWidth: '400px',
    margin: '80px auto',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '40px'
  },
  authHeader: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  authTitle: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '16px 0 8px',
    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  authSubtitle: {
    color: '#94a3b8',
    fontSize: '14px'
  },
  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  authInput: {
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none'
  },
  authButton: {
    padding: '14px',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer'
  },
  toggleButton: {
    padding: '12px',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '14px',
    cursor: 'pointer'
  }
};

export default FitnessDashboard;
