import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Dumbbell, TrendingUp, Calendar, Heart, Sparkles, CheckCircle2, Trash2, Plus, X, Wind } from 'lucide-react';

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
    'Swimming': { group: 'Cardio', icon: '🏊' },
    'Jump Rope': { group: 'Cardio', icon: '🪢' }
  },
  stretch: {
    'Yoga': { group: 'Flexibility', icon: '🧘' },
    'Pilates': { group: 'Core', icon: '🧘' },
    'Mobility Work': { group: 'Flexibility', icon: '🔄' },
    'Static Stretching': { group: 'Flexibility', icon: '🤸' }
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
      <button onClick={() => setIsRegistering(!isRegistering)} style={styles.toggleButton}>{isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}</button>
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
    if (isStrength && (!sets || !reps)) return alert('Please enter sets and reps');
    if (!isStrength && !reps) return alert('Please enter duration');

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
             {workoutType === 'strength' ? <Dumbbell size={24} color="#6366f1" /> : workoutType === 'cardio' ? <Heart size={24} color="#ec4899" /> : <Wind size={24} color="#10b981" />}
             <h3 style={styles.workoutTitle}>New {workoutType.charAt(0).toUpperCase() + workoutType.slice(1)}</h3>
          </div>
          <button onClick={() => {setIsLoggingWorkout(false); setCurrentExercises([])}} style={styles.closeBtn}><X /></button>
        </div>

        <div style={styles.inputGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Exercise</label>
            <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} style={styles.select}>
              {Object.keys(EXERCISES[workoutType] || {}).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          
          <div style={styles.threeColRow}>
            {workoutType === 'strength' ? (
              <>
                <div style={styles.inputGroup}><label style={styles.label}>Sets</label><input type="number" value={sets} onChange={e => setSets(e.target.value)} style={styles.input} placeholder="0" /></div>
                <div style={styles.inputGroup}><label style={styles.label}>Reps</label><input type="number" value={reps} onChange={e => setReps(e.target.value)} style={styles.input} placeholder="0" /></div>
                <div style={styles.inputGroup}><label style={styles.label}>kg</label><input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={styles.input} placeholder="0" /></div>
              </>
            ) : (
              <div style={{...styles.inputGroup, gridColumn: 'span 3'}}><label style={styles.label}>Duration (min)</label><input type="number" value={reps} onChange={e => setReps(e.target.value)} style={styles.input} placeholder="0" /></div>
            )}
          </div>
          <button onClick={addExercise} style={styles.addButton}>Add to Session</button>
        </div>

        {currentExercises.length > 0 && (
          <div style={styles.exerciseListContainer}>
            <div style={styles.listScroll}>
              {currentExercises.map((ex, i) => (
                <div key={i} style={styles.exerciseItem}>
                  <span>{ex.exercise_name}</span>
                  <span style={styles.exerciseDetails}>{workoutType === 'strength' ? `${ex.sets}x${ex.reps} @${ex.weight}kg` : `${ex.reps} min`}</span>
                </div>
              ))}
            </div>
            <button onClick={finishWorkout} style={styles.finishButton} disabled={loading}>{loading ? 'Saving...' : 'Complete Workout'}</button>
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
    } catch (e) { console.error("Load error:", e); }
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
    } catch (e) { alert("Auth failed"); }
    finally { setLoading(false); }
  };

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

  const deleteWorkout = async (id) => {
    if (!window.confirm("Delete this session forever?")) return;
    await fetch(`/.netlify/functions/database?workoutId=${id}`, { method: 'DELETE' });
    loadWorkouts(user.email);
  };

  const stats = (() => {
    const uniqueDates = [...new Set(workouts.map(w => new Date(w.created_at).toDateString()))];
    const totalVol = workouts.reduce((s, w) => s + (w.exercises?.reduce((exS, ex) => exS + (ex.sets * ex.reps * (ex.weight || 0)), 0) || 0), 0);
    
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const dayVol = workouts.filter(w => new Date(w.created_at).toDateString() === d.toDateString())
        .reduce((s, w) => s + (w.exercises?.reduce((exS, ex) => exS + (ex.sets * ex.reps * (ex.weight || 0)), 0) || 0), 0);
      return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), value: dayVol };
    });

    return { count: workouts.length, volume: Math.round(totalVol), streak: uniqueDates.length, activeDates: uniqueDates, chartData };
  })();

  if (!user) return <div style={styles.container}><AuthForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} isRegistering={isRegistering} setIsRegistering={setIsRegistering} handleAuth={handleAuth} loading={loading} /></div>;

  const maxVol = Math.max(...stats.chartData.map(d => d.value), 1);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.brandContainer}><Sparkles size={24} color="#6366f1" /><h1 style={styles.brandTitle}>Fit as a Fiddle</h1></div>
          <p style={styles.greeting}>Hey {user.email.split('@')[0]}, let's get moving!</p>
        </div>
        <button onClick={() => { setUser(null); localStorage.removeItem('fitnessUser'); }} style={styles.logoutBtn}>Sign Out</button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}><div style={{...styles.statIcon, background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899'}}><Dumbbell size={20}/></div><div><h3>{stats.count}</h3><p>Sessions</p></div></div>
        <div style={styles.statCard}><div style={{...styles.statIcon, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981'}}><TrendingUp size={20}/></div><div><h3>{stats.volume}kg</h3><p>Volume</p></div></div>
        <div style={styles.statCard}><div style={{...styles.statIcon, background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1'}}><CheckCircle2 size={20}/></div><div><h3>{stats.streak}</h3><p>Streak</p></div></div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📈 Weekly Volume</h3>
          <div style={styles.chartContainer}>
            {stats.chartData.map((d, i) => (
              <div key={i} style={styles.chartBarCol}>
                <div style={{...styles.chartBar, height: `${(d.value / maxVol) * 100}%`}}>
                   {d.value > 0 && <span style={styles.barTooltip}>{Math.round(d.value)}</span>}
                </div>
                <span style={styles.chartLabel}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🔥 Consistency</h3>
          <div style={styles.calendarGrid}>
            {Array.from({ length: 28 }).map((_, i) => {
              const d = new Date(); d.setDate(d.getDate() - (27 - i));
              const active = stats.activeDates.includes(d.toDateString());
              return <div key={i} style={{...styles.calendarDot, background: active ? '#6366f1' : 'rgba(255,255,255,0.05)'}} />;
            })}
          </div>
        </div>

        <div style={{...styles.card, gridColumn: '1 / -1'}}>
          <h3 style={styles.cardTitle}>📅 Workout History</h3>
          <div style={styles.sessionList}>
            {workouts.map((w, i) => (
              <div key={i} style={styles.sessionItem}>
                <div style={styles.sessionInfo}>
                  <span style={styles.sessionDate}>{new Date(w.created_at).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                  <span style={styles.sessionContent}>{w.exercises?.map(ex => ex.exercise_name).join(', ')}</span>
                </div>
                <button onClick={() => deleteWorkout(w.id)} style={styles.deleteBtn}><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.fabContainer}>
        <button onClick={() => {setWorkoutType('strength'); setIsLoggingWorkout(true)}} style={{...styles.fab, background: '#6366f1'}}><Plus size={16}/> Strength</button>
        <button onClick={() => {setWorkoutType('cardio'); setIsLoggingWorkout(true)}} style={{...styles.fab, background: '#ec4899'}}><Plus size={16}/> Cardio</button>
        <button onClick={() => {setWorkoutType('stretch'); setIsLoggingWorkout(true)}} style={{...styles.fab, background: '#10b981'}}><Plus size={16}/> Stretch</button>
      </div>

      {isLoggingWorkout && <WorkoutPanel workoutType={workoutType} setIsLoggingWorkout={setIsLoggingWorkout} setCurrentExercises={setCurrentExercises} currentExercises={currentExercises} finishWorkout={finishWorkout} loading={loading} />}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '30px', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  brandContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
  brandTitle: { fontSize: '28px', color: '#6366f1', margin: 0, fontWeight: '800' },
  greeting: { margin: '5px 0 0 0', color: '#94a3b8' },
  logoutBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' },
  statCard: { background: '#1e293b', padding: '20px', borderRadius: '20px', display: 'flex', gap: '15px', alignItems: 'center' },
  statIcon: { width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', paddingBottom: '100px' },
  card: { background: '#1e293b', padding: '25px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' },
  cardTitle: { fontSize: '18px', margin: '0 0 20px 0', fontWeight: '600' },
  chartContainer: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px' },
  chartBarCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' },
  chartBar: { width: '40%', background: 'linear-gradient(to top, #6366f1, #a855f7)', borderRadius: '6px 6px 0 0' },
  barTooltip: { position: 'absolute', top: '-22px', fontSize: '10px', color: '#94a3b8' },
  chartLabel: { fontSize: '11px', marginTop: '10px', color: '#64748b' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' },
  calendarDot: { aspectRatio: '1/1', borderRadius: '5px' },
  sessionList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  sessionItem: { background: 'rgba(255,255,255,0.03)', padding: '15px 20px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sessionInfo: { display: 'flex', gap: '20px', alignItems: 'center' },
  sessionDate: { color: '#6366f1', fontWeight: '700', minWidth: '60px' },
  sessionContent: { color: '#94a3b8', fontSize: '14px' },
  deleteBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  fabContainer: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10, width: 'max-content' },
  fab: { padding: '12px 20px', borderRadius: '30px', border: 'none', color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.4)', fontSize: '14px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  workoutPanel: { background: '#1e293b', padding: '30px', borderRadius: '28px', width: '90%', maxWidth: '450px' },
  workoutHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  headerInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  workoutTitle: { margin: 0, fontSize: '20px' },
  closeBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  inputGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  threeColRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', width: '100%' }, // FIXED GRID
  label: { fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' },
  input: { padding: '12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '12px', width: '100%', boxSizing: 'border-box' },
  select: { padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '12px', width: '100%' },
  addButton: { padding: '14px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid #6366f1', borderRadius: '12px', fontWeight: '600' },
  finishButton: { width: '100%', padding: '16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '700', fontSize: '16px', marginTop: '10px' },
  exerciseListContainer: { marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '20px' },
  listScroll: { maxHeight: '120px', overflowY: 'auto', marginBottom: '15px' },
  exerciseItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' },
  exerciseDetails: { color: '#94a3b8' },
  authCard: { maxWidth: '400px', margin: '100px auto', background: '#1e293b', padding: '40px', borderRadius: '30px', textAlign: 'center' },
  authInput: { width: '100%', padding: '14px', margin: '10px 0', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff', boxSizing: 'border-box' },
  authButton: { width: '100%', padding: '16px', background: '#6366f1', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', fontSize: '16px', marginTop: '15px' },
  toggleButton: { background: 'none', border: 'none', color: '#6366f1', marginTop: '20px', cursor: 'pointer' }
};

export default Dashboard;
