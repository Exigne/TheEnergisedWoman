import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Dumbbell, TrendingUp, Calendar, Heart, Sparkles, CheckCircle2, Trash2, Plus, X, Wind, Target, Zap, Info } from 'lucide-react';

const EXERCISES = {
  strength: {
    'Bench Press': { group: 'Chest', icon: '💪' },
    'Squat': { group: 'Legs', icon: '🦵' },
    'Deadlift': { group: 'Back', icon: '🏋️' },
    'Overhead Press': { group: 'Shoulders', icon: '💪' },
    'Pull-ups': { group: 'Back', icon: '🔝' },
    'Rows': { group: 'Back', icon: '⬅️' },
    'Bicep Curls': { group: 'Arms', icon: '💪' },
    'Tricep Dips': { group: 'Arms', icon: '💪' }
  },
  cardio: {
    'Running': { group: 'Cardio', icon: '🏃' },
    'Cycling': { group: 'Cardio', icon: '🚴' },
    'Swimming': { group: 'Cardio', icon: '🏊' }
  },
  stretch: {
    'Yoga': { group: 'Flexibility', icon: '🧘' },
    'Pilates': { group: 'Core', icon: '🧘' },
    'Mobility Work': { group: 'Flexibility', icon: '🔄' }
  }
};

const AuthForm = ({ email, setEmail, password, setPassword, isRegistering, setIsRegistering, handleAuth, loading }) => (
  <div style={styles.authCard}>
    <div style={styles.authHeader}>
      <div style={styles.logoContainer}><Sparkles size={40} color="#6366f1" /></div>
      <h1 style={styles.authTitle}>Fit as a Fiddle</h1>
      <p style={styles.authSubtitle}>Your fitness journey starts here</p>
    </div>
    <div style={styles.authForm}>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={styles.authInput} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={styles.authInput} />
      <button onClick={handleAuth} style={styles.authButton} disabled={loading}>{loading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}</button>
      <button onClick={() => setIsRegistering(!isRegistering)} style={styles.toggleButton}>{isRegistering ? 'Back to login' : "Don't have an account? Register"}</button>
    </div>
  </div>
);

const WorkoutPanel = ({ workoutType, setIsLoggingWorkout, currentExercises, setCurrentExercises, finishWorkout, loading }) => {
  const [selectedExercise, setSelectedExercise] = useState(Object.keys(EXERCISES[workoutType] || {})[0] || '');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const addExercise = () => {
    const isStrength = workoutType === 'strength';
    if (isStrength && (!sets || !reps)) return alert('Enter sets/reps');
    if (!isStrength && !reps) return alert('Enter duration');

    const exData = EXERCISES[workoutType][selectedExercise];
    setCurrentExercises([...currentExercises, {
      exercise_name: selectedExercise,
      sets: isStrength ? parseInt(sets) : 1,
      reps: parseInt(reps),
      weight: parseFloat(weight) || 0,
      group: exData.group
    }]);
    setSets(''); setReps(''); setWeight('');
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.workoutPanel}>
        <div style={styles.workoutHeader}>
          <div style={styles.headerInfo}>
             <h3 style={styles.workoutTitle}>New {workoutType}</h3>
          </div>
          <button onClick={() => {setIsLoggingWorkout(false); setCurrentExercises([])}} style={styles.closeBtn}><X /></button>
        </div>
        <div style={styles.inputGrid}>
          <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} style={styles.select}>
            {Object.keys(EXERCISES[workoutType] || {}).map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <div style={styles.threeColRow}>
            {workoutType === 'strength' ? (
              <>
                <input type="number" value={sets} onChange={e => setSets(e.target.value)} style={styles.input} placeholder="Sets" />
                <input type="number" value={reps} onChange={e => setReps(e.target.value)} style={styles.input} placeholder="Reps" />
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={styles.input} placeholder="kg" />
              </>
            ) : (
              <input type="number" value={reps} onChange={e => setReps(e.target.value)} style={{...styles.input, gridColumn: 'span 3'}} placeholder="Duration (min)" />
            )}
          </div>
          <button onClick={addExercise} style={styles.addButton}>Add to Session</button>
        </div>
        {currentExercises.length > 0 && (
          <div style={styles.exerciseListContainer}>
            {currentExercises.map((ex, i) => <div key={i} style={styles.exerciseItem}>{ex.exercise_name} - {ex.reps} {workoutType === 'strength' ? 'reps' : 'min'}</div>)}
            <button onClick={finishWorkout} style={styles.finishButton}>{loading ? 'Saving...' : 'Finish Workout'}</button>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false);
  const [workoutType, setWorkoutType] = useState(null);
  const [currentExercises, setCurrentExercises] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('fitnessUser');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const loadWorkouts = useCallback(async (uEmail) => {
    try {
      const res = await fetch(`/.netlify/functions/database?user=${encodeURIComponent(uEmail)}`);
      const data = await res.json();
      setWorkouts(data.workouts || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { if (user?.email) loadWorkouts(user.email); }, [user, loadWorkouts]);

  const handleAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/database', {
        method: 'POST',
        body: JSON.stringify({ action: 'auth', email, password, isRegistering })
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ email: data.email });
        localStorage.setItem('fitnessUser', JSON.stringify({ email: data.email }));
      } else alert(data.error);
    } catch (e) { alert("Auth error"); }
    finally { setLoading(false); }
  };

  const deleteWorkout = async (id) => {
    if (!window.confirm("Delete?")) return;
    await fetch(`/.netlify/functions/database?workoutId=${id}`, { method: 'DELETE' });
    loadWorkouts(user.email);
  };

  const fitnessInsights = (() => {
    const pbs = {};
    const muscleSplit = { Chest: 0, Legs: 0, Back: 0, Shoulders: 0, Arms: 0, Cardio: 0, Flexibility: 0 };
    workouts.forEach(w => {
      w.exercises?.forEach(ex => {
        if (!pbs[ex.exercise_name] || ex.weight > pbs[ex.exercise_name]) pbs[ex.exercise_name] = ex.weight;
        if (muscleSplit[ex.group] !== undefined) muscleSplit[ex.group]++;
      });
    });
    const topPBs = Object.entries(pbs).filter(([_, w]) => w > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
    
    // Suggest lowest trained muscle group
    const recommendation = Object.entries(muscleSplit).sort((a, b) => a[1] - b[1])[0][0];

    return { topPBs, muscleSplit, recommendation };
  })();

  const finishWorkout = async () => {
    setLoading(true);
    try {
      await fetch('/.netlify/functions/database', {
        method: 'POST',
        body: JSON.stringify({ userEmail: user.email, exercises: currentExercises })
      });
      setIsLoggingWorkout(false);
      setCurrentExercises([]);
      loadWorkouts(user.email);
    } finally { setLoading(false); }
  };

  if (!user) return <div style={styles.container}><AuthForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} isRegistering={isRegistering} setIsRegistering={setIsRegistering} handleAuth={handleAuth} loading={loading} /></div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div><h1 style={styles.brandTitle}>Fit as a Fiddle</h1><p style={styles.greeting}>Focus: {fitnessInsights.recommendation} Today</p></div>
        <button onClick={() => { setUser(null); localStorage.removeItem('fitnessUser'); }} style={styles.logoutBtn}>Sign Out</button>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}><Target size={20} color="#6366f1" /><h3>Personal Bests</h3></div>
          {fitnessInsights.topPBs.map(([name, weight]) => (
            <div key={name} style={styles.pbItem}><span>{name}</span><span style={{color: '#6366f1', fontWeight: 'bold'}}>{weight}kg</span></div>
          ))}
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}><Zap size={20} color="#fbbf24" /><h3>Muscle Balance</h3></div>
          {Object.entries(fitnessInsights.muscleSplit).map(([group, count]) => (
            <div key={group} style={styles.balanceRow}>
              <span style={{fontSize: '11px', width: '70px'}}>{group}</span>
              <div style={styles.barContainer}><div style={{...styles.barFill, width: `${Math.min(100, count * 10)}%`}} /></div>
            </div>
          ))}
        </div>

        <div style={{...styles.card, gridColumn: '1 / -1'}}>
          <h3 style={{marginBottom: '15px'}}>Recent History</h3>
          {workouts.slice(0, 5).map((w, i) => (
            <div key={i} style={styles.sessionItem}>
              <span>{new Date(w.created_at).toLocaleDateString()}</span>
              <span style={{color: '#94a3b8'}}>{w.exercises?.[0]?.exercise_name}...</span>
              <button onClick={() => deleteWorkout(w.id)} style={{background: 'none', border: 'none', color: '#ef4444'}}><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.fabContainer}>
        <button onClick={() => {setWorkoutType('strength'); setIsLoggingWorkout(true)}} style={{...styles.fab, background: '#6366f1'}}><Dumbbell size={18}/> Strength</button>
        <button onClick={() => {setWorkoutType('cardio'); setIsLoggingWorkout(true)}} style={{...styles.fab, background: '#ec4899'}}><Heart size={18}/> Cardio</button>
        <button onClick={() => {setWorkoutType('stretch'); setIsLoggingWorkout(true)}} style={{...styles.fab, background: '#10b981'}}><Wind size={18}/> Stretch</button>
      </div>

      {isLoggingWorkout && <WorkoutPanel workoutType={workoutType} setIsLoggingWorkout={setIsLoggingWorkout} setCurrentExercises={setCurrentExercises} currentExercises={currentExercises} finishWorkout={finishWorkout} loading={loading} />}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '25px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' },
  brandTitle: { color: '#6366f1', margin: 0 },
  greeting: { color: '#94a3b8', margin: '5px 0' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', paddingBottom: '100px' },
  card: { background: '#1e293b', padding: '20px', borderRadius: '20px' },
  cardHeader: { display: 'flex', gap: '10px', marginBottom: '15px' },
  pbItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#0f172a', borderRadius: '10px', marginBottom: '8px' },
  balanceRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  barContainer: { flex: 1, height: '6px', background: '#0f172a', borderRadius: '3px' },
  barFill: { height: '100%', background: '#fbbf24', borderRadius: '3px' },
  sessionItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' },
  fabContainer: { position: 'fixed', bottom: '25px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' },
  fab: { padding: '12px 20px', borderRadius: '25px', border: 'none', color: '#fff', fontWeight: 'bold', display: 'flex', gap: '8px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  workoutPanel: { background: '#1e293b', padding: '25px', borderRadius: '25px', width: '90%', maxWidth: '400px' },
  workoutHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  threeColRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' },
  input: { padding: '10px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '8px' },
  select: { padding: '10px', background: '#0f172a', color: '#fff', borderRadius: '8px', marginBottom: '10px', width: '100%' },
  addButton: { padding: '10px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '10px' },
  finishButton: { width: '100%', padding: '12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '15px' },
  authCard: { maxWidth: '350px', margin: '80px auto', background: '#1e293b', padding: '30px', borderRadius: '25px', textAlign: 'center' },
  authInput: { width: '100%', padding: '12px', margin: '8px 0', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', boxSizing: 'border-box' },
  authButton: { width: '100%', padding: '12px', background: '#6366f1', border: 'none', borderRadius: '10px', color: '#fff', marginTop: '10px' },
  toggleButton: { background: 'none', border: 'none', color: '#6366f1', marginTop: '15px', cursor: 'pointer' },
  logoutBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }
};

export default Dashboard;
