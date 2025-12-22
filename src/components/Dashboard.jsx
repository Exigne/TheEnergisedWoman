import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const ACTIVITY_CONFIG = {
  'Bench Press': { group: 'Chest', label1: 'Sets', label2: 'Reps', label3: 'kg' },
  'Squat': { group: 'Legs', label1: 'Sets', label2: 'Reps', label3: 'kg' },
  'Deadlift': { group: 'Back', label1: 'Sets', label2: 'Reps', label3: 'kg' },
  'Overhead Press': { group: 'Shoulders', label1: 'Sets', label2: 'Reps', label3: 'kg' },
  'Yoga (Vinyasa)': { group: 'Flexibility', label1: 'Session', label2: 'Min', label3: 'Flows' },
  'Running (Distance)': { group: 'Cardio', label1: 'Laps', label2: 'Min', label3: 'km' },
  'Swimming': { group: 'Full Body', label1: 'Laps', label2: 'Min', label3: 'm' },
  'Pilates': { group: 'Core', label1: 'Sets', label2: 'Min', label3: 'Intensity' }
};

const Dashboard = ({ currentUser, onLogout }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState('Bench Press');
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');
  const [val3, setVal3] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`/.netlify/functions/database?user=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (e) { console.error("History fetch failed:", e); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          exercise,
          sets: parseFloat(val1) || 0,
          reps: parseFloat(val2) || 0,
          weight: parseFloat(val3) || 0
        })
      });
      setVal1(''); setVal2(''); setVal3('');
      loadData();
    } catch (err) { alert('Failed to save workout'); }
    finally { setSaving(false); }
  };

  const currentConfig = ACTIVITY_CONFIG[exercise];

  // --- Chart Data Transformation ---
  const volumeData = {
    labels: workouts.slice(0, 7).map(w => new Date(w.created_at).toLocaleDateString()).reverse(),
    datasets: [{
      label: 'Activity Volume',
      data: workouts.slice(0, 7).map(w => w.weight * w.reps * (w.sets || 1)).reverse(),
      backgroundColor: 'rgba(56, 189, 248, 0.6)',
      borderColor: '#38bdf8',
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  const muscleStats = workouts.reduce((acc, w) => {
    const group = w.muscle_group || 'Other';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});

  const donutData = {
    labels: Object.keys(muscleStats),
    datasets: [{
      data: Object.values(muscleStats),
      backgroundColor: ['#38bdf8', '#818cf8', '#fbbf24', '#f87171', '#10b981', '#a855f7'],
      borderWidth: 0,
    }]
  };

  return (
    <div style={theme.wrapper}>
      <header style={theme.header}>
        <div style={theme.profileSection}>
          <div style={theme.avatar}>{currentUser.email[0].toUpperCase()}</div>
          <div>
            <h2 style={{ margin: 0 }}>{currentUser.email.split('@')[0]}</h2>
            <span style={theme.badge}>PRO Athlete • {workouts.length} Workouts</span>
          </div>
        </div>
        <button onClick={onLogout} style={theme.logoutBtn}>Sign Out</button>
      </header>

      <div style={theme.dashboardGrid}>
        <div style={theme.column}>
          <div style={theme.glassCard}>
            <h3 style={theme.cardTitle}>Performance Trend</h3>
            <Bar data={volumeData} options={chartOptions} />
          </div>
          <div style={{ ...theme.glassCard, marginTop: '20px' }}>
            <h3 style={theme.cardTitle}>Activity Split</h3>
            <Doughnut data={donutData} options={{ cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }} />
          </div>
        </div>

        <div style={theme.column}>
          <div style={theme.actionCard}>
            <h3 style={{ color: '#fff', marginTop: 0 }}>Log {currentConfig.group}</h3>
            <form onSubmit={handleSave} style={theme.inputGroup}>
<select 
  value={exercise} 
  onChange={e => setExercise(e.target.value)} 
  style={theme.input}
>
  {/* This line is what generates the list from your config */}
  {Object.keys(ACTIVITY_CONFIG).map(name => (
    <option key={name} value={name}>
      {name}
    </option>
  ))}
</select>
              </select>
              <div style={theme.row}>
                <div><label style={theme.label}>{currentConfig.label1}</label>
                <input type="number" value={val1} onChange={e => setVal1(e.target.value)} style={theme.input} placeholder="0" /></div>
                <div><label style={theme.label}>{currentConfig.label2}</label>
                <input type="number" value={val2} onChange={e => setVal2(e.target.value)} style={theme.input} placeholder="0" /></div>
                <div><label style={theme.label}>{currentConfig.label3}</label>
                <input type="number" value={val3} onChange={e => setVal3(e.target.value)} style={theme.input} placeholder="0" /></div>
              </div>
              <button disabled={saving} style={theme.primaryBtn}>{saving ? 'Syncing...' : 'Complete Session'}</button>
            </form>
          </div>
        </div>

        <div style={theme.column}>
          <div style={theme.glassCard}>
            <h3 style={theme.cardTitle}>Recent Activity</h3>
            {workouts.length === 0 ? <p style={{color: '#64748b'}}>No entries yet.</p> : 
              workouts.slice(0, 6).map((w, i) => (
              <div key={i} style={theme.activityItem}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{w.exercise}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>{new Date(w.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>{w.weight}{ACTIVITY_CONFIG[w.exercise]?.label3 || 'u'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const theme = {
  wrapper: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: '40px', fontFamily: '"Inter", sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  profileSection: { display: 'flex', alignItems: 'center', gap: '15px' },
  avatar: { width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  badge: { backgroundColor: '#1e293b', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', color: '#38bdf8', border: '1px solid #38bdf8', textTransform: 'uppercase' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' },
  glassCard: { background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' },
  actionCard: { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.4)' },
  cardTitle: { fontSize: '16px', marginBottom: '20px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', boxSizing: 'border-box' },
  label: { display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginBottom: '5px', textTransform: 'uppercase', paddingLeft: '4px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' },
  primaryBtn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#fff', color: '#4f46e5', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: 'transform 0.2s' },
  activityItem: { display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  logoutBtn: { background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }
};

const chartOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: { y: { display: false }, x: { grid: { display: false }, ticks: { color: '#64748b' } } }
};

export default Dashboard;
