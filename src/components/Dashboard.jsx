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
  'Running': { group: 'Cardio' },
  'Swimming': { group: 'Full Body' },
  'Pilates': { group: 'Core' }
};

const Dashboard = ({ currentUser, onLogout }) => {
  const [history, setHistory] = useState([]);
  const [draftExercises, setDraftExercises] = useState([]);
  const [exercise, setExercise] = useState('Bench Press');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [currentUser]);

  const loadData = async () => {
    try {
      const res = await fetch(`/.netlify/functions/database?user=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Fetch error", e); }
  };

  const addToDraft = () => {
    if (!sets || !reps) return alert("Please enter sets and reps");
    const newEntry = {
      name: exercise,
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: parseFloat(weight) || 0,
      group: ACTIVITY_CONFIG[exercise].group
    };
    setDraftExercises([...draftExercises, newEntry]);
    setSets(''); setReps(''); setWeight('');
  };

  const handleFinishWorkout = async () => {
    if (draftExercises.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          exercises: draftExercises
        })
      });
      if (res.ok) {
        setDraftExercises([]);
        loadData();
      }
    } catch (err) { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  const volumeData = {
    labels: history.slice(0, 5).map(w => new Date(w.created_at).toLocaleDateString()).reverse(),
    datasets: [{
      label: 'Total Volume (kg)',
      data: history.slice(0, 5).map(w => Number(w.total_volume) || 0).reverse(),
      backgroundColor: '#38bdf8',
      borderRadius: 8
    }]
  };

  return (
    <div style={theme.wrapper}>
      <header style={theme.header}>
        <div style={theme.profileSection}>
          <div style={theme.avatar}>{currentUser.email[0].toUpperCase()}</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>{currentUser.email.split('@')[0]}</h2>
            <span style={theme.badge}>{history.length} SESSIONS LOGGED</span>
          </div>
        </div>
        <button onClick={onLogout} style={theme.logoutBtn}>Sign Out</button>
      </header>

      <div style={theme.dashboardGrid}>
        <div style={theme.column}>
          <div style={theme.glassCard}>
            <h3 style={theme.cardTitle}>Volume Progress</h3>
            <div style={{ height: '200px' }}>
              <Bar data={volumeData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
          </div>
          
          <div style={{...theme.glassCard, marginTop: '20px'}}>
            <h3 style={theme.cardTitle}>Recent Sessions</h3>
            {history.slice(0, 4).map((session, i) => (
              <div key={i} style={theme.historyItem}>
                <div>
                  <div style={{ fontWeight: '600' }}>{new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{session.exercise_count} exercises</div>
                </div>
                <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>{Math.round(session.total_volume || 0)}kg</div>
              </div>
            ))}
          </div>
        </div>

        <div style={theme.column}>
          <div style={theme.actionCard}>
            <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '20px' }}>Record Workout</h3>
            
            <div style={theme.inputGroup}>
              <label style={theme.label}>Exercise</label>
              <select value={exercise} onChange={e => setExercise(e.target.value)} style={theme.input}>
                {Object.keys(ACTIVITY_CONFIG).map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              
              <div style={theme.row}>
                <input type="number" placeholder="Sets" value={sets} onChange={e => setSets(e.target.value)} style={theme.input} />
                <input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} style={theme.input} />
                <input type="number" placeholder="kg" value={weight} onChange={e => setWeight(e.target.value)} style={theme.input} />
              </div>
              <button onClick={addToDraft} style={theme.secondaryBtn}>+ Add Exercise</button>
            </div>

            {draftExercises.length > 0 && (
              <div style={theme.draftList}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Current Session</h4>
                {draftExercises.map((ex, i) => (
                  <div key={i} style={theme.draftItem}>
                    <span>{ex.name}</span>
                    <span>{ex.sets} x {ex.reps} {ex.weight > 0 ? `(${ex.weight}kg)` : ''}</span>
                  </div>
                ))}
                <button onClick={handleFinishWorkout} disabled={saving} style={theme.primaryBtn}>
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
  wrapper: { minHeight: '100vh', backgroundColor: '#020617', color: '#f8fafc', padding: '40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  profileSection: { display: 'flex', alignItems: 'center', gap: '15px' },
  avatar: { width: '42px', height: '42px', borderRadius: '10px', background: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#020617' },
  badge: { fontSize: '11px', color: '#38bdf8', fontWeight: 'bold' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' },
  glassCard: { background: '#1e293b', borderRadius: '24px', padding: '24px', border: '1px solid #334155' },
  actionCard: { background: 'linear-gradient(145deg, #4f46e5, #3730a3)', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' },
  cardTitle: { fontSize: '13px', color: '#94a3b8', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  input: { padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' },
  secondaryBtn: { padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontWeight: '600' },
  primaryBtn: { marginTop: '15px', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#fff', color: '#4338ca', fontWeight: '800', cursor: 'pointer', width: '100%' },
  draftList: { marginTop: '20px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '16px' },
  draftItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #334155' },
  logoutBtn: { background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }
};

export default Dashboard;
