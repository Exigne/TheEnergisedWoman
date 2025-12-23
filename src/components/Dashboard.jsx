import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const ACTIVITY_CONFIG = {
  'Bench Press': { group: 'Chest' },
  'Squat': { group: 'Legs' },
  'Deadlift': { group: 'Back' },
  'Rows': { group: 'Back' },
  'Pull-ups': { group: 'Back' },
  'Overhead Press': { group: 'Shoulders' },
  'Bicep Curls': { group: 'Arms' },
  'Tricep Extensions': { group: 'Arms' },
  'Running': { group: 'Cardio' },
  'Swimming': { group: 'Full Body' },
  'Pilates': { group: 'Core' }
};

const Dashboard = ({ currentUser, onLogout }) => {
  const [workouts, setWorkouts] = useState([]);
  const [draftExercises, setDraftExercises] = useState([]);
  const [exercise, setExercise] = useState('Bench Press');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { 
    if (currentUser?.email) {
      loadData(); 
    }
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/.netlify/functions/database?user=${encodeURIComponent(currentUser.email)}`);
      
      if (!res.ok) {
        throw new Error(`Failed to load data: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Handle the new response format from improved database handler
      if (data.workouts && Array.isArray(data.workouts)) {
        setWorkouts(data.workouts);
      } else {
        setWorkouts([]);
      }
    } catch (e) { 
      console.error("Fetch error", e);
      setError("Failed to load workout history");
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  const addToDraft = () => {
    if (!sets || !reps) {
      alert("Please enter sets and reps");
      return;
    }

    const setsNum = parseInt(sets);
    const repsNum = parseInt(reps);
    const weightNum = parseFloat(weight) || 0;

    if (setsNum <= 0 || repsNum <= 0) {
      alert("Sets and reps must be greater than 0");
      return;
    }

    const newEntry = {
      name: exercise,
      sets: setsNum,
      reps: repsNum,
      weight: weightNum,
      group: ACTIVITY_CONFIG[exercise].group
    };

    setDraftExercises([...draftExercises, newEntry]);
    setSets('');
    setReps('');
    setWeight('');
  };

  const removeDraftExercise = (index) => {
    setDraftExercises(draftExercises.filter((_, i) => i !== index));
  };

  const handleFinishWorkout = async () => {
    if (draftExercises.length === 0) {
      alert("Add at least one exercise before finishing workout");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          exercises: draftExercises
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save workout');
      }

      const result = await res.json();
      
      if (result.success) {
        setDraftExercises([]);
        await loadData();
        alert('Workout saved successfully!');
      }
    } catch (err) { 
      console.error('Save error:', err);
      setError(err.message || 'Failed to save workout');
      alert('Failed to save workout: ' + err.message);
    } finally { 
      setSaving(false); 
    }
  };

  // Calculate statistics from workouts
  const calculateStats = () => {
    if (!workouts || workouts.length === 0) {
      return { totalVolume: 0, totalExercises: 0, recentWorkouts: [] };
    }

    const recentWorkouts = workouts.slice(0, 5).map(workout => {
      // Parse exercises from JSON if needed
      const exercises = Array.isArray(workout.exercises) 
        ? workout.exercises 
        : [];

      const totalVolume = exercises.reduce((sum, ex) => {
        return sum + ((ex.sets || 0) * (ex.reps || 0) * (ex.weight || 0));
      }, 0);

      return {
        date: workout.created_at,
        exerciseCount: exercises.length,
        totalVolume: totalVolume
      };
    });

    const totalExercises = workouts.reduce((sum, w) => {
      const exercises = Array.isArray(w.exercises) ? w.exercises : [];
      return sum + exercises.length;
    }, 0);

    return { recentWorkouts, totalExercises };
  };

  const stats = calculateStats();

  // Chart data
  const volumeData = {
    labels: stats.recentWorkouts.map(w => 
      new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ).reverse(),
    datasets: [{
      label: 'Total Volume (kg)',
      data: stats.recentWorkouts.map(w => Math.round(w.totalVolume)).reverse(),
      backgroundColor: '#38bdf8',
      borderRadius: 8
    }]
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        padding: 12,
        displayColors: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#334155' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  if (loading) {
    return (
      <div style={theme.wrapper}>
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <div style={theme.spinner}></div>
          <p style={{ color: '#94a3b8', marginTop: '20px' }}>Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={theme.wrapper}>
      <header style={theme.header}>
        <div style={theme.profileSection}>
          <div style={theme.avatar}>{currentUser.email[0].toUpperCase()}</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>{currentUser.email.split('@')[0]}</h2>
            <span style={theme.badge}>{workouts.length} SESSIONS LOGGED</span>
          </div>
        </div>
        <button onClick={onLogout} style={theme.logoutBtn}>Sign Out</button>
      </header>

      {error && (
        <div style={theme.errorBanner}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} style={theme.dismissBtn}>✕</button>
        </div>
      )}

      <div style={theme.dashboardGrid}>
        <div style={theme.column}>
          <div style={theme.glassCard}>
            <h3 style={theme.cardTitle}>Volume Progress</h3>
            {stats.recentWorkouts.length > 0 ? (
              <div style={{ height: '200px' }}>
                <Bar data={volumeData} options={chartOptions} />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                <p>No workout data yet</p>
                <p style={{ fontSize: '14px' }}>Start logging workouts to see your progress!</p>
              </div>
            )}
          </div>
          
          <div style={{...theme.glassCard, marginTop: '20px'}}>
            <h3 style={theme.cardTitle}>Recent Sessions</h3>
            {stats.recentWorkouts.length > 0 ? (
              stats.recentWorkouts.slice(0, 4).map((session, i) => (
                <div key={i} style={theme.historyItem}>
                  <div>
                    <div style={{ fontWeight: '600' }}>
                      {new Date(session.date).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {session.exerciseCount} exercise{session.exerciseCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                    {Math.round(session.totalVolume)}kg
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: '14px' }}>
                No sessions yet
              </div>
            )}
          </div>
        </div>

        <div style={theme.column}>
          <div style={theme.actionCard}>
            <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '20px' }}>Record Workout</h3>
            
            <div style={theme.inputGroup}>
              <label style={theme.label}>Exercise</label>
              <select 
                value={exercise} 
                onChange={e => setExercise(e.target.value)} 
                style={theme.input}
              >
                {Object.keys(ACTIVITY_CONFIG).map(name => 
                  <option key={name} value={name}>{name}</option>
                )}
              </select>
              
              <div style={theme.row}>
                <div>
                  <label style={{...theme.label, fontSize: '10px'}}>Sets</label>
                  <input 
                    type="number" 
                    placeholder="Sets" 
                    value={sets} 
                    onChange={e => setSets(e.target.value)} 
                    style={theme.input}
                    min="1"
                  />
                </div>
                <div>
                  <label style={{...theme.label, fontSize: '10px'}}>Reps</label>
                  <input 
                    type="number" 
                    placeholder="Reps" 
                    value={reps} 
                    onChange={e => setReps(e.target.value)} 
                    style={theme.input}
                    min="1"
                  />
                </div>
                <div>
                  <label style={{...theme.label, fontSize: '10px'}}>Weight (kg)</label>
                  <input 
                    type="number" 
                    placeholder="kg" 
                    value={weight} 
                    onChange={e => setWeight(e.target.value)} 
                    style={theme.input}
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
              <button onClick={addToDraft} style={theme.secondaryBtn}>+ Add Exercise</button>
            </div>

            {draftExercises.length > 0 && (
              <div style={theme.draftList}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Current Session</h4>
                {draftExercises.map((ex, i) => (
                  <div key={i} style={theme.draftItem}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{ex.name}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                        {ex.sets} × {ex.reps} {ex.weight > 0 ? `@ ${ex.weight}kg` : ''}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeDraftExercise(i)} 
                      style={theme.removeBtn}
                      title="Remove exercise"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div style={{ marginTop: '15px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Total Volume</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                    {draftExercises.reduce((sum, ex) => sum + (ex.sets * ex.reps * ex.weight), 0).toFixed(1)}kg
                  </div>
                </div>
                <button 
                  onClick={handleFinishWorkout} 
                  disabled={saving} 
                  style={{...theme.primaryBtn, opacity: saving ? 0.6 : 1}}
                >
                  {saving ? 'Saving...' : 'Finish Workout'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const theme = {
  wrapper: { 
    minHeight: '100vh', 
    backgroundColor: '#020617', 
    color: '#f8fafc', 
    padding: '40px', 
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '40px' 
  },
  profileSection: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '15px' 
  },
  avatar: { 
    width: '42px', 
    height: '42px', 
    borderRadius: '10px', 
    background: '#38bdf8', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontWeight: '800', 
    color: '#020617' 
  },
  badge: { 
    fontSize: '11px', 
    color: '#38bdf8', 
    fontWeight: 'bold' 
  },
  dashboardGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
    gap: '24px' 
  },
  glassCard: { 
    background: '#1e293b', 
    borderRadius: '24px', 
    padding: '24px', 
    border: '1px solid #334155' 
  },
  actionCard: { 
    background: 'linear-gradient(145deg, #4f46e5, #3730a3)', 
    borderRadius: '24px', 
    padding: '24px', 
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' 
  },
  cardTitle: { 
    fontSize: '13px', 
    color: '#94a3b8', 
    marginBottom: '20px', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em',
    marginTop: 0
  },
  inputGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px' 
  },
  label: { 
    fontSize: '12px', 
    color: 'rgba(255,255,255,0.8)', 
    fontWeight: '500',
    marginBottom: '4px'
  },
  input: { 
    padding: '12px', 
    borderRadius: '12px', 
    border: 'none', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    color: '#fff', 
    fontSize: '14px',
    outline: 'none'
  },
  row: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr 1fr', 
    gap: '10px' 
  },
  secondaryBtn: { 
    padding: '12px', 
    borderRadius: '12px', 
    border: '1px solid rgba(255,255,255,0.3)', 
    background: 'rgba(255,255,255,0.05)', 
    color: '#fff', 
    cursor: 'pointer', 
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  primaryBtn: { 
    marginTop: '15px', 
    padding: '14px', 
    borderRadius: '12px', 
    border: 'none', 
    backgroundColor: '#fff', 
    color: '#4338ca', 
    fontWeight: '800', 
    cursor: 'pointer', 
    width: '100%',
    transition: 'all 0.2s'
  },
  draftList: { 
    marginTop: '20px', 
    padding: '15px', 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    borderRadius: '16px' 
  },
  draftItem: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: '12px', 
    borderBottom: '1px solid rgba(255,255,255,0.05)', 
    fontSize: '13px' 
  },
  historyItem: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '12px 0', 
    borderBottom: '1px solid #334155' 
  },
  logoutBtn: { 
    background: 'transparent', 
    border: '1px solid #334155', 
    color: '#94a3b8', 
    padding: '8px 16px', 
    borderRadius: '10px', 
    fontSize: '13px', 
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  removeBtn: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '4px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  errorBanner: {
    background: '#7f1d1d',
    border: '1px solid #991b1b',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#fecaca'
  },
  dismissBtn: {
    background: 'transparent',
    border: 'none',
    color: '#fecaca',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0 4px'
  },
  spinner: {
    border: '4px solid #334155',
    borderTop: '4px solid #38bdf8',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto'
  }
};

export default Dashboard;
