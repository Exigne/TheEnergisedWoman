// Dashboard.jsx - Restored with Fixes
import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Dumbbell, TrendingUp, Calendar, Heart, Sparkles } from 'lucide-react';

const EXERCISES = {
  strength: {
    'Bench Press': { group: 'Chest', icon: '💪' },
    'Squat': { group: 'Legs', icon: '🦵' },
    'Deadlift': { group: 'Back', icon: '🏋️' },
    'Overhead Press': { group: 'Shoulders', icon: '💪' },
    'Pull-ups': { group: 'Back', icon: '🔝' },
    'Rows': { group: 'Back', icon: '⬅️' },
    'Bicep Curls': { group: 'Arms', icon: '💪' },
    'Tricep Dips': { group: 'Arms', icon: '💪' },
    'Lunges': { group: 'Legs', icon: '🦵' }
  },
  cardio: {
    'Running': { group: 'Cardio', icon: '🏃' },
    'Cycling': { group: 'Cardio', icon: '🚴' },
    'Swimming': { group: 'Cardio', icon: '🏊' },
    'Rowing': { group: 'Cardio', icon: '🚣' },
    'Jump Rope': { group: 'Cardio', icon: '🪢' },
    'Elliptical': { group: 'Cardio', icon: '⚡' },
    'Stair Climbing': { group: 'Cardio', icon: '🪜' }
  },
  stretch: {
    'Yoga': { group: 'Flexibility', icon: '🧘' },
    'Pilates': { group: 'Core', icon: '🧘' },
    'Dynamic Stretching': { group: 'Flexibility', icon: '🤸' },
    'Foam Rolling': { group: 'Recovery', icon: '🔄' },
    'Static Stretching': { group: 'Flexibility', icon: '🤸' },
    'Mobility Work': { group: 'Flexibility', icon: '🔄' }
  }
};

const AuthForm = ({ email, setEmail, password, setPassword, isRegistering, setIsRegistering, handleAuth, loading }) => (
  <div style={styles.authCard}>
    <div style={styles.authHeader}>
      <div style={styles.logoContainer}><Sparkles size={40} color="#6366f1" /></div>
      <h1 style={styles.authTitle}>Fit as a Fiddle</h1>
      <p style={styles.authSubtitle}>Your Personal Fitness Journey</p>
    </div>
    <div style={styles.authForm}>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={styles.authInput} disabled={loading} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && !loading && handleAuth()} style={styles.authInput} disabled={loading} />
      <button onClick={handleAuth} style={styles.authButton} disabled={loading}>{loading ? 'Loading...' : (isRegistering ? 'Create Account' : 'Sign In')}</button>
      <button onClick={() => setIsRegistering(!isRegistering)} style={styles.toggleButton} disabled={loading}>{isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}</button>
    </div>
  </div>
);

const WorkoutPanel = ({ workoutType, setIsLoggingWorkout, setWorkoutType, currentExercises, setCurrentExercises, finishWorkout, loading }) => {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (workoutType && EXERCISES[workoutType]) {
      const exercises = Object.keys(EXERCISES[workoutType]);
      if (exercises.length > 0) setSelectedExercise(exercises[0]);
    }
  }, [workoutType]);

  const addExercise = () => {
    if (!workoutType || !selectedExercise) return;
    const exercises = EXERCISES[workoutType];
    const exerciseData = exercises[selectedExercise];
    if (!exerciseData) return;
    
    let newExercise;
    if (workoutType === 'cardio' || workoutType === 'stretch') {
      if (!duration || isNaN(duration) || parseInt(duration) <= 0) { alert('Please enter valid duration'); return; }
      newExercise = { exercise_name: selectedExercise, sets: 1, reps: parseInt(duration), weight: 0, group: exerciseData.group, type: workoutType };
    } else {
      if (!sets || !reps || isNaN(sets) || isNaN(reps)) { alert('Please enter valid sets and reps'); return; }
      newExercise = { exercise_name: selectedExercise, sets: parseInt(sets), reps: parseInt(reps), weight: parseFloat(weight) || 0, group: exerciseData.group, type: workoutType };
    }
    setCurrentExercises(prev => [...prev, newExercise]);
    setSets(''); setReps(''); setWeight(''); setDuration('');
  };

  return (
    <div style={styles.workoutPanel}>
      <div style={styles.workoutHeader}>
        <h3 style={styles.workoutTitle}>
          {workoutType === 'strength' ? '💪 Strength Training' : workoutType === 'cardio' ? '❤️ Cardio Session' : '🧘 Stretch & Recovery'}
        </h3>
        <button onClick={() => {setIsLoggingWorkout(false); setWorkoutType(null); setCurrentExercises([]);}} style={styles.closeBtn}>✕</button>
      </div>
      <div style={styles.inputGrid}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Exercise</label>
          <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} style={styles.select}>
            {Object.keys(EXERCISES[workoutType] || {}).map(name => (
              <option key={name} value={name}>{EXERCISES[workoutType][name]?.icon} {name}</option>
            ))}
          </select>
        </div>
        {workoutType === 'strength' ? (
          <div style={styles.inputRow}>
            <div style={styles.inputGroup}><label style={styles.label}>Sets</label><input type="number" value={sets} onChange={e => setSets(e.target.value)} style={styles.input} placeholder="0" /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Reps</label><input type="number" value={reps} onChange={e => setReps(e.target.value)} style={styles.input} placeholder="0" /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Weight</label><input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={styles.input} placeholder="0" /></div>
          </div>
        ) : (
          <div style={styles.inputGroup}><label style={styles.label}>Duration (min)</label><input type="number" value={duration} onChange={e => setDuration(e.target.value)} style={styles.input} placeholder="0" /></div>
        )}
        <button onClick={addExercise} style={styles.addButton}>+ Add Exercise</button>
      </div>
      {currentExercises.length > 0 && (
        <div style={styles.exerciseList}>
          <h4 style={styles.listTitle}>Current Session</h4>
          {currentExercises.map((ex, i) => (
            <div key={i} style={styles.exerciseItem}>
              <span>{EXERCISES[ex.type]?.[ex.exercise_name]?.icon} {ex.exercise_name}</span>
              <span style={styles.exerciseDetails}>{ex.type === 'strength' ? `${ex.sets} × ${ex.reps} @ ${ex.weight}kg` : `${ex.reps} min`}</span>
            </div>
          ))}
          <button onClick={finishWorkout} disabled={loading} style={styles.finishButton}>{loading ? 'Saving...' : '✓ Finish Workout'}</button>
        </div>
      )}
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
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('fitnessUser');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const loadWorkouts = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const res = await fetch(`/.netlify/functions/database?user=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setWorkouts(Array.isArray(data.workouts) ? data.workouts : []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (user) loadWorkouts(); }, [user, loadWorkouts]);

  const handleAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth', email, password, isRegistering })
      });
      const data = await res.json();
      if (res.ok) { setUser(data); localStorage.setItem('fitnessUser', JSON.stringify(data)); }
      else { alert(data.error); }
    } catch (err) { alert('Auth failed'); }
    finally { setLoading(false); }
  };

  const startWorkout = (type) => { setWorkoutType(type); setIsLoggingWorkout(true); setCurrentExercises([]); setSaveError(null); };

  const finishWorkout = async () => {
    if (!user?.email || currentExercises.length === 0) return;
    setLoading(true);
    setSaveError(null);
    try {
      // THE FIX: Included 'action' and ensured strict data types
      const workoutData = {
        action: 'saveWorkout', 
        userEmail: user.email,
        exercises: currentExercises.map(ex => ({
          ...ex,
          sets: Number(ex.sets),
          reps: Number(ex.reps),
          weight: Number(ex.weight)
        })),
        type: workoutType,
        created_at: new Date().toISOString()
      };

      const res = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData)
      });

      if (res.ok) {
        setIsLoggingWorkout(false);
        setCurrentExercises([]);
        await loadWorkouts();
      } else {
        const data = await res.json();
        setSaveError(data.error || "Failed to save");
      }
    } catch (err) { setSaveError(err.message); }
    finally { setLoading(false); }
  };

  const calculateStats = useCallback(() => {
    const totalSessions = workouts.length;
    const totalVolume = workouts.reduce((sum, w) => sum + (w.exercises?.reduce((s, e) => s + (e.sets * e.reps * e.weight), 0) || 0), 0);
    
    // Streak logic
    let currentStreak = 0;
    const uniqueDates = [...new Set(workouts.map(w => new Date(w.created_at).toDateString()))];
    const today = new Date().toDateString();
    if (uniqueDates.includes(today)) {
        // simplified streak count for example
        currentStreak = uniqueDates.length; 
    }

    return { totalSessions, totalVolume, currentStreak };
  }, [workouts]);

  const getWorkoutInfo = (workout) => {
    const type = workout.type || 'strength';
    const firstEx = workout.exercises?.[0]?.exercise_name || 'Workout';
    const icon = EXERCISES[type]?.[firstEx]?.icon || '💪';
    return { name: firstEx, icon, color: type === 'strength' ? '#6366f1' : '#ec4899' };
  };

  if (!user) return <div style={styles.container}><AuthForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} isRegistering={isRegistering} setIsRegistering={setIsRegistering} handleAuth={handleAuth} loading={loading} /></div>;

  const stats = calculateStats();

  return (
    <div style={styles.container}>
      {saveError && <div style={styles.errorBanner}><span>{saveError}</span><button onClick={() => setSaveError(null)}>✕</button></div>}
      
      <div style={styles.header}>
        <div>
          <div style={styles.brandContainer}><Sparkles size={24} color="#6366f1" /><h1 style={styles.brandTitle}>Fit as a Fiddle</h1></div>
          <p style={styles.greeting}>Hello, {user.email.split('@')[0]}!</p>
        </div>
        <button onClick={() => { setUser(null); localStorage.removeItem('fitnessUser'); }} style={styles.logoutBtn}>Sign Out</button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}><div style={styles.statIcon}><Dumbbell /></div><div><div style={styles.statValue}>{stats.totalSessions}</div><div style={styles.statLabel}>Sessions</div></div></div>
        <div style={styles.statCard}><div style={{...styles.statIcon, background: '#10b981'}}><Activity /></div><div><div style={styles.statValue}>{stats.currentStreak}</div><div style={styles.statLabel}>Streak</div></div></div>
      </div>

      <div style={styles.mainGrid}>
         <div style={styles.card}>
            <h3 style={styles.cardTitle}>🔥 Day Streak</h3>
            <div style={styles.streakBar}>
                {Array.from({length: 15}).map((_, i) => (
                    <div key={i} style={{...styles.streakDay, background: i < stats.currentStreak ? '#6366f1' : 'rgba(255,255,255,0.1)'}}></div>
                ))}
            </div>
         </div>

         <div style={styles.card}>
            <h3 style={styles.cardTitle}>📅 Recent Sessions</h3>
            <div style={styles.sessionList}>
                {workouts.slice(0, 4).map((w, i) => {
                    const info = getWorkoutInfo(w);
                    return (
                        <div key={i} style={styles.sessionItem}>
                            <div style={{...styles.sessionIcon, background: info.color}}>{info.icon}</div>
                            <div style={styles.sessionInfo}>
                                <div style={styles.sessionWorkoutName}>{info.name}</div>
                                <div style={styles.sessionDate}>{new Date(w.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
         </div>
      </div>

      {!isLoggingWorkout ? (
        <div style={styles.fabContainer}>
          <button onClick={() => startWorkout('strength')} style={{...styles.fabButton, background: '#6366f1'}}><Dumbbell size={20} /> Strength</button>
          <button onClick={() => startWorkout('cardio')} style={{...styles.fabButton, background: '#ec4899'}}><Heart size={20} /> Cardio</button>
        </div>
      ) : (
        <WorkoutPanel workoutType={workoutType} setIsLoggingWorkout={setIsLoggingWorkout} setWorkoutType={setWorkoutType} currentExercises={currentExercises} setCurrentExercises={setCurrentExercises} finishWorkout={finishWorkout} loading={loading} />
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#f8fafc', padding: '24px', fontFamily: 'sans-serif' },
  authCard: { maxWidth: '400px', margin: '80px auto', background: 'rgba(30, 27, 75, 0.8)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' },
  authHeader: { textAlign: 'center', marginBottom: '32px' },
  logoContainer: { display: 'flex', justifyContent: 'center', marginBottom: '16px' },
  authTitle: { fontSize: '28px', fontWeight: '700', color: '#6366f1' },
  authSubtitle: { color: '#94a3b8' },
  authForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  authInput: { padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' },
  authButton: { padding: '14px', background: '#6366f1', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  toggleButton: { background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '32px' },
  brandContainer: { display: 'flex', alignItems: 'center', gap: '8px' },
  brandTitle: { fontSize: '24px', fontWeight: 'bold', color: '#6366f1' },
  logoutBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255,255,255,0.1)' },
  statIcon: { width: '48px', height: '48px', borderRadius: '12px', background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: '24px', fontWeight: 'bold' },
  statLabel: { fontSize: '12px', color: '#94a3b8' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '100px' },
  card: { background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' },
  cardTitle: { fontSize: '18px', marginBottom: '16px' },
  streakBar: { display: 'flex', gap: '4px', marginTop: '12px' },
  streakDay: { flex: 1, height: '8px', borderRadius: '4px' },
  sessionList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  sessionItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' },
  sessionIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  sessionWorkoutName: { fontWeight: 'bold' },
  sessionDate: { fontSize: '12px', color: '#94a3b8' },
  fabContainer: { position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', zIndex: 100 },
  fabButton: { padding: '12px 24px', borderRadius: '30px', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
  workoutPanel: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1e1b4b', padding: '24px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 101, boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' },
  workoutHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' },
  inputGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputRow: { display: 'flex', gap: '12px' },
  inputGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '12px', color: '#94a3b8' },
  input: { padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' },
  select: { padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' },
  addButton: { padding: '12px', background: '#6366f1', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold' },
  exerciseList: { marginTop: '20px', maxHeight: '200px', overflowY: 'auto' },
  exerciseItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  finishButton: { width: '100%', padding: '14px', background: '#10b981', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', marginTop: '16px' },
  errorBanner: { background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }
};

export default Dashboard;
