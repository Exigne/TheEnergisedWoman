import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const Dashboard = ({ currentUser, onLogout }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Visual & Interaction State ---
  const [exercise, setExercise] = useState('Bench Press');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`/.netlify/functions/database?user=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // --- Chart Data Preparation ---
  const volumeData = {
    labels: workouts.slice(0, 7).map(w => new Date(w.created_at).toLocaleDateString()).reverse(),
    datasets: [{
      label: 'Volume (kg)',
      data: workouts.slice(0, 7).map(w => w.weight * w.reps * w.sets).reverse(),
      backgroundColor: 'rgba(56, 189, 248, 0.6)',
      borderColor: '#38bdf8',
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  return (
    <div style={theme.wrapper}>
      {/* HEADER SECTION */}
      <header style={theme.header}>
        <div style={theme.profileSection}>
          <div style={theme.avatar}>JD</div>
          <div>
            <h2 style={{ margin: 0 }}>Welcome, {currentUser.email.split('@')[0]}</h2>
            <span style={theme.badge}>Level 12 • 5 Day Streak 🔥</span>
          </div>
        </div>
        <button onClick={onLogout} style={theme.logoutBtn}>Sign Out</button>
      </header>

      {/* DASHBOARD GRID */}
      <div style={theme.dashboardGrid}>
        
        {/* COLUMN 1: ANALYTICS */}
        <div style={theme.column}>
          <div style={theme.glassCard}>
            <h3 style={theme.cardTitle}>Weekly Progress</h3>
            <Bar data={volumeData} options={chartOptions} />
          </div>
          <div style={{ ...theme.glassCard, marginTop: '20px' }}>
            <h3 style={theme.cardTitle}>Muscle Distribution</h3>
            <div style={{ maxWidth: '200px', margin: 'auto' }}>
               <Doughnut data={donutData} options={{ cutout: '70%' }} />
            </div>
          </div>
        </div>

        {/* COLUMN 2: WORKOUT LOGGING */}
        <div style={theme.column}>
          <div style={theme.actionCard}>
            <h3 style={{ color: '#fff' }}>Log New Session</h3>
            <div style={theme.inputGroup}>
              <select value={exercise} onChange={e => setExercise(e.target.value)} style={theme.input}>
                <option>Bench Press</option>
                <option>Squat</option>
                <option>Deadlift</option>
                <option>Overhead Press</option>
              </select>
              <div style={theme.row}>
                <input placeholder="Sets" type="number" value={sets} onChange={e => setSets(e.target.value)} style={theme.input} />
                <input placeholder="Reps" type="number" value={reps} onChange={e => setReps(e.target.value)} style={theme.input} />
                <input placeholder="kg" type="number" value={weight} onChange={e => setWeight(e.target.value)} style={theme.input} />
              </div>
              <button style={theme.primaryBtn}>Complete Lift</button>
            </div>
          </div>
        </div>

        {/* COLUMN 3: ACTIVITY FEED */}
        <div style={theme.column}>
          <div style={theme.glassCard}>
            <h3 style={theme.cardTitle}>Recent Activity</h3>
            {workouts.slice(0, 5).map((w, i) => (
              <div key={i} style={theme.activityItem}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{w.exercise}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>{new Date(w.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ color: '#10b981' }}>+{w.weight * w.reps * w.sets}kg</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

// --- STYLES (Modern Dark Theme) ---
const theme = {
  wrapper: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: '40px', fontFamily: '"Inter", sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  profileSection: { display: 'flex', alignItems: 'center', gap: '15px' },
  avatar: { width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  badge: { backgroundColor: '#1e293b', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: '#38bdf8', border: '1px solid #38bdf8' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' },
  glassCard: { background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' },
  actionCard: { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '24px', padding: '24px' },
  cardTitle: { fontSize: '18px', marginBottom: '20px', color: '#94a3b8' },
  input: { width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', marginBottom: '10px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' },
  primaryBtn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#fff', color: '#4f46e5', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  activityItem: { display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  logoutBtn: { background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }
};

const chartOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: { y: { display: false }, x: { grid: { display: false }, ticks: { color: '#64748b' } } }
};

const donutData = {
  labels: ['Chest', 'Back', 'Legs'],
  datasets: [{
    data: [40, 30, 30],
    backgroundColor: ['#38bdf8', '#fbbf24', '#f87171'],
    borderWidth: 0,
  }]
};

export default Dashboard;
