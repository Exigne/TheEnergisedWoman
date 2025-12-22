import React, { useState, useEffect } from 'react';

const EXERCISES = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Pull-ups', 'Rows', 'Dips'];

const Dashboard = ({ currentUser, onLogout }) => {
  const [workouts, setWorkouts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [exercise, setExercise] = useState(EXERCISES[0]);
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [histRes, leadRes] = await Promise.all([
        fetch(`/.netlify/functions/database?user=${encodeURIComponent(currentUser.email)}`),
        fetch(`/.netlify/functions/database?action=leaderboard`)
      ]);
      const history = await histRes.json();
      const leaders = await leadRes.json();
      setWorkouts(Array.isArray(history) ? history : []);
      setLeaderboard(Array.isArray(leaders) ? leaders : []);
    } catch (err) {
      setError('Connection failed. Check your database settings.');
    } finally {
      setLoading(false);
    }
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
          sets: parseInt(sets) || 0,
          reps: parseInt(reps) || 0,
          weight: parseFloat(weight) || 0
        })
      });
      setSets(''); setReps(''); setWeight('');
      loadData();
    } catch (err) { setError('Failed to save.'); }
    finally { setSaving(false); }
  };

  const chartWorkouts = [...workouts].reverse().slice(-7);
  const maxVolume = Math.max(...chartWorkouts.map(w => w.weight * w.reps * w.sets), 100);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1>FitFiddle</h1>
        <button onClick={onLogout} style={btnSecondary}>Sign Out</button>
      </header>

      <div style={gridStyle}>
        {/* LEFT COLUMN: Input & Chart */}
        <div>
          <div style={cardStyle}>
            <h3>Log Workout</h3>
            <form onSubmit={handleSave} style={formStyle}>
              <select value={exercise} onChange={e => setExercise(e.target.value)} style={inputStyle}>
                {EXERCISES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
              <div style={rowStyle}>
                <input type="number" placeholder="Sets" value={sets} onChange={e => setSets(e.target.value)} style={inputStyle} />
                <input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} style={inputStyle} />
                <input type="number" placeholder="kg" value={weight} onChange={e => setWeight(e.target.value)} style={inputStyle} />
              </div>
              <button disabled={saving} style={btnPrimary}>{saving ? 'Saving...' : 'Add to Journal'}</button>
            </form>
          </div>

          <div style={{ ...cardStyle, marginTop: '20px' }}>
            <h3>Volume Graph (Last 7)</h3>
            <div style={chartContainer}>
              {chartWorkouts.map((w, i) => (
                <div key={i} style={barWrapper}>
                  <div style={{ ...barStyle, height: `${((w.weight * w.reps * w.sets) / maxVolume) * 100}%` }} />
                  <span style={barLabel}>{w.exercise.substring(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Leaderboard */}
        <div style={cardStyle}>
          <h3>League Table (Total Volume)</h3>
          <table style={tableStyle}>
            <thead><tr style={tableHeader}><th>User</th><th>Total kg</th></tr></thead>
            <tbody>
              {leaderboard.map((u, i) => (
                <tr key={i} style={u.user_email === currentUser.email ? activeRow : rowItem}>
                  <td>{u.user_email.split('@')[0]}</td>
                  <td>{Math.round(u.total_volume).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#1a1a1a' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };
const cardStyle = { background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '10px' };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' };
const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #ddd' };
const btnPrimary = { background: '#4f46e5', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const btnSecondary = { background: '#f3f4f6', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const tableHeader = { textAlign: 'left', borderBottom: '2px solid #f3f4f6', height: '40px' };
const rowItem = { height: '40px', borderBottom: '1px solid #f9fafb' };
const activeRow = { ...rowItem, backgroundColor: '#f5f3ff', color: '#4f46e5', fontWeight: 'bold' };
const chartContainer = { display: 'flex', alignItems: 'flex-end', height: '150px', gap: '10px', paddingBottom: '20px' };
const barWrapper = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' };
const barStyle = { width: '100%', background: '#4f46e5', borderRadius: '4px 4px 0 0' };
const barLabel = { fontSize: '10px', marginTop: '5px', color: '#666' };

export default Dashboard;
