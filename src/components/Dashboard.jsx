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
      setError('Connection failed. Check Netlify Environment Variables.');
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

  // Simple Graph Logic (Volume of last 7 workouts)
  const chartWorkouts = [...workouts].reverse().slice(-7);
  const maxVolume = Math.max(...chartWorkouts.map(w => w.weight * w.reps * w.sets), 100);

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui', backgroundColor: '#f9fafb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>FitFiddle Dashboard</h1>
        <button onClick={onLogout} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}>Sign Out</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
        
        {/* COLUMN 1: Log & Graphs */}
        <div>
          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Log Exercise</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <select value={exercise} onChange={e => setExercise(e.target.value)} style={inputStyle}>
                {EXERCISES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
              <input type="number" placeholder="Sets" value={sets} onChange={e => setSets(e.target.value)} style={{...inputStyle, width: '70px'}} />
              <input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} style={{...inputStyle, width: '70px'}} />
              <input type="number" placeholder="kg" value={weight} onChange={e => setWeight(e.target.value)} style={{...inputStyle, width: '70px'}} />
              <button disabled={saving} style={btnStyle}>{saving ? '...' : 'Add'}</button>
            </form>
          </section>

          <section style={{ ...cardStyle, marginTop: '20px' }}>
            <h3>Progress (Volume per Session)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '8px', padding: '10px 0' }}>
              {chartWorkouts.map((w, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ 
                    width: '100%', 
                    backgroundColor: '#4f46e5', 
                    borderRadius: '4px 4px 0 0',
                    height: `${((w.weight * w.reps * w.sets) / maxVolume) * 100}%` 
                  }} />
                  <span style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>{new Date(w.created_at).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* COLUMN 2: League Table */}
        <div>
          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Global League Table</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}><th>User</th><th>Total Vol</th></tr></thead>
              <tbody>
                {leaderboard.map((user, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f9f9f9', height: '40px' }}>
                    <td style={{ fontSize: '14px' }}>{user.user_email.split('@')[0]}</td>
                    <td style={{ fontWeight: 'bold' }}>{Math.round(user.total_volume).toLocaleString()} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

      </div>
    </div>
  );
};

const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' };
const btnStyle = { backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

export default Dashboard;
