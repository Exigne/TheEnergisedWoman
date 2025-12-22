import React from 'react';

const Dashboard = ({ currentUser, onLogout }) => {
  // Using React.useState directly to prevent ReferenceErrors in production
  const [workouts, setWorkouts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  
  const [exercise, setExercise] = React.useState('');
  const [sets, setSets] = React.useState('');
  const [reps, setReps] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    setLoading(true);
    try {
      // Updated to match your database function endpoint
      const response = await fetch(`/.netlify/functions/database?user=${encodeURIComponent(currentUser.email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to load history');
      const data = await response.json();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading workouts:', err);
      setError('Could not connect to database to fetch history.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkout = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createWorkout', // Added action for your switch/case logic
          userEmail: currentUser.email,
          exercise: exercise.trim(),
          sets: parseInt(sets) || 0,
          reps: parseInt(reps) || 0,
          weight: parseFloat(weight) || 0
        })
      });

      if (!response.ok) throw new Error('Failed to save');

      // Reset form
      setExercise('');
      setSets('');
      setReps('');
      setWeight('');
      
      // Refresh list
      await loadWorkouts();
      
    } catch (err) {
      setError('Failed to save workout. Check your database connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header Card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, color: '#111827', fontSize: '1.5rem' }}>FitFiddle</h1>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>{currentUser?.email}</p>
            </div>
            <button onClick={onLogout} style={secondaryButtonStyle}>Sign out</button>
          </div>
        </div>

        {/* Input Card */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Log Exercise</h2>
          {error && <div style={errorBannerStyle}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Exercise name (e.g. Bench Press)"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              style={inputStyle}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Sets</label>
                <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Reps</label>
                <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Weight (kg)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
            </div>

            <button
              onClick={handleSaveWorkout}
              disabled={saving || !exercise}
              style={{
                ...primaryButtonStyle,
                opacity: (saving || !exercise) ? 0.6 : 1,
                cursor: (saving || !exercise) ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Save Exercise'}
            </button>
          </div>
        </div>

        {/* History Card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={sectionTitleStyle}>History</h2>
            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{workouts.length} entries</span>
          </div>

          {loading ? (
             <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading your progress...</p>
          ) : workouts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No exercises logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {workouts.map((w, i) => (
                <div key={w.id || i} style={historyItemStyle}>
                  <div>
                    <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{w.exercise}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {w.sets} sets × {w.reps} reps • {new Date(w.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>{w.weight}<small style={{fontSize: '0.7rem', color: '#9ca3af'}}>kg</small></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Styles ---
const cardStyle = {
  background: 'white',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '1rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '1rem',
  boxSizing: 'border-box'
};

const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.4rem' };
const labelStyle = { fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' };
const sectionTitleStyle = { fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', marginTop: 0 };
const primaryButtonStyle = { background: '#111827', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', fontWeight: '600' };
const secondaryButtonStyle = { background: 'none', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', color: '#4b5563' };
const errorBannerStyle = { background: '#fef2f2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' };
const historyItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6' };

export default Dashboard;
