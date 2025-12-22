import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

/* ----------------------------------
   Config
----------------------------------- */
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

const parseNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/* ----------------------------------
   Dashboard
----------------------------------- */
const Dashboard = ({ currentUser, onLogout }) => {
  const [history, setHistory] = useState([]);
  const [draftExercises, setDraftExercises] = useState([]);

  const [exercise, setExercise] = useState('Bench Press');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  /* ----------------------------------
     Load history
  ----------------------------------- */
  useEffect(() => {
    if (!currentUser?.email) return;

    const controller = new AbortController();

    const loadData = async () => {
      try {
        const res = await fetch(
          `/.netlify/functions/database?user=${encodeURIComponent(
            currentUser.email
          )}`,
          { signal: controller.signal }
        );

        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch error:', err);
        }
      }
    };

    loadData();
    return () => controller.abort();
  }, [currentUser]);

  /* ----------------------------------
     Handlers
  ----------------------------------- */
  const addToDraft = () => {
    if (!sets || !reps) return;

    const entry = {
      name: exercise,
      sets: parseNumber(sets),
      reps: parseNumber(reps),
      weight: parseNumber(weight),
      group: ACTIVITY_CONFIG[exercise]?.group ?? 'Other'
    };

    setDraftExercises(prev => [...prev, entry]);
    setSets('');
    setReps('');
    setWeight('');
  };

  const handleFinishWorkout = async () => {
    if (!draftExercises.length) return;

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
        // reload history
        const reload = await fetch(
          `/.netlify/functions/database?user=${encodeURIComponent(
            currentUser.email
          )}`
        );
        const data = await reload.json();
        setHistory(Array.isArray(data) ? data : []);
      } else {
        alert('Failed to save workout');
      }
    } catch {
      alert('Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  /* ----------------------------------
     Chart Data
  ----------------------------------- */
  const volumeData = useMemo(() => {
    const recent = history.slice(0, 5).reverse();
    return {
      labels: recent.map(w =>
        new Date(w.created_at).toLocaleDateString()
      ),
      datasets: [
        {
          label: 'Total Volume (kg)',
          data: recent.map(w => Number(w.total_volume) || 0),
          backgroundColor: '#38bdf8',
          borderRadius: 8
        }
      ]
    };
  }, [history]);

  /* ----------------------------------
     Render
  ----------------------------------- */
  return (
    <div style={theme.wrapper}>
      <header style={theme.header}>
        <div style={theme.profileSection}>
          <div style={theme.avatar}>
            {currentUser.email[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>
              {currentUser.email.split('@')[0]}
            </h2>
            <span style={theme.badge}>
              {history.length} SESSIONS LOGGED
            </span>
          </div>
        </div>
        <button onClick={onLogout} style={theme.logoutBtn}>
          Sign Out
        </button>
      </header>

      <div style={theme.dashboardGrid}>
        {/* LEFT COLUMN */}
        <div>
          <div style={theme.glassCard}>
            <h3 style={theme.cardTitle}>Volume Progress</h3>
            <div style={{ height: 200 }}>
              <Bar
                data={volumeData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }}
              />
            </div>
          </div>

          <div style={{ ...theme.glassCard, marginTop: 20 }}>
            <h3 style={theme.cardTitle}>Recent Sessions</h3>

            {history.slice(0, 4).map((session, i) => (
              <div key={i} style={theme.historyItem}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(session.created_at).toLocaleDateString(
                      undefined,
                      { month: 'short', day: 'numeric' }
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {session.exercise_count} exercises
                  </div>
                </div>
                <div style={{ color: '#38bdf8', fontWeight: 700 }}>
                  {Math.round(session.total_volume || 0)}kg
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <div style={theme.actionCard}>
            <h3 style={{ color: '#fff', marginTop: 0 }}>
              Record Workout
            </h3>

            <div style={theme.inputGroup}>
              <label style={theme.label}>Exercise</label>
              <select
                value={exercise}
                onChange={e => setExercise(e.target.value)}
                style={theme.input}
              >
                {Object.keys(ACTIVITY_CONFIG).map(name => (
                  <option key={name}>{name}</option>
                ))}
              </select>

              <div style={theme.row}>
                <input
                  type="number"
                  placeholder="Sets"
                  value={sets}
                  onChange={e => setSets(e.target.value)}
                  style={theme.input}
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={reps}
                  onChange={e => setReps(e.target.value)}
                  style={theme.input}
                />
                <input
                  type="number"
                  placeholder="kg"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  style={theme.input}
                />
              </div>

              <button
                onClick={addToDraft}
                disabled={!sets || !reps}
                style={{
                  ...theme.secondaryBtn,
                  opacity: !sets || !reps ? 0.5 : 1
                }}
              >
                + Add Exercise
              </button>
            </div>

            {draftExercises.length > 0 && (
              <div style={theme.draftList}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>
                  Current Session
                </h4>

                {draftExercises.map((ex, i) => (
                  <div key={i} style={theme.draftItem}>
                    <span>{ex.name}</span>
                    <span>
                      {ex.sets} × {ex.reps}
                      {ex.weight > 0 && ` (${ex.weight}kg)`}
                    </span>
                  </div>
                ))}

                <button
                  onClick={handleFinishWorkout}
                  disabled={saving}
                  style={theme.primaryBtn}
                >
                  {saving ? 'Saving…' : 'Finish Workout'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------
   Theme
----------------------------------- */
const theme = Object.freeze({
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#020617',
    color: '#f8fafc',
    padding: 40,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 15
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: '#38bdf8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    color: '#020617'
  },
  badge: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: 'bold'
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 24
  },
  glassCard: {
    background: '#1e293b',
    borderRadius: 24,
    padding: 24,
    border: '1px solid #334155'
  },
  actionCard: {
    background: 'linear-gradient(145deg, #4f46e5, #3730a3)',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 20px 25px -5px rgba(0,0,0,.2)'
  },
  cardTitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,.8)',
    fontWeight: 500
  },
  input: {
    padding: 12,
    borderRadius: 12,
    border: 'none',
    backgroundColor: 'rgba(255,255,255,.1)',
    color: '#fff',
    fontSize: 14
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 10
  },
  secondaryBtn: {
    padding: 12,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,.3)',
    background: 'rgba(255,255,255,.05)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600
  },
  primaryBtn: {
    marginTop: 15,
    padding: 14,
    borderRadius: 12,
    border: 'none',
    backgroundColor: '#fff',
    color: '#4338ca',
    fontWeight: 800,
    cursor: 'pointer',
    width: '100%'
  },
  draftList: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,.2)',
    borderRadius: 16
  },
  draftItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,.05)',
    fontSize: 13
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
    borderRadius: 10,
    fontSize: 13,
    cursor: 'pointer'
  }
});

export default Dashboard;
