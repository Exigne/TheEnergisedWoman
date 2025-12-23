import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Dumbbell, TrendingUp, Calendar, Heart, Sparkles, CheckCircle2, Trash2, Plus, X, Wind, Target, Zap } from 'lucide-react';

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

  // ACTIONABLE STATS: PBs and Muscle Balance
  const fitnessInsights = (() => {
    const pbs = {};
    const muscleSplit = { Chest: 0, Legs: 0, Back: 0, Shoulders: 0, Arms: 0, Cardio: 0, Flexibility: 0 };
    
    workouts.forEach(w => {
      w.exercises?.forEach(ex => {
        // Track Personal Bests
        if (!pbs[ex.exercise_name] || ex.weight > pbs[ex.exercise_name]) {
          pbs[ex.exercise_name] = ex.weight;
        }
        // Track Muscle Balance
        if (muscleSplit[ex.group] !== undefined) muscleSplit[ex.group]++;
      });
    });

    const topPBs = Object.entries(pbs)
      .filter(([_, weight]) => weight > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { topPBs, muscleSplit };
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

  if (!user) return <div style={styles.container}><AuthForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} isRegistering={isRegistering} setIsRegistering={setIsRegistering} handleAuth={() => {}} loading={loading} /></div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.brandTitle}>Fit as a Fiddle</h1>
          <p style={styles.greeting}>Training for results, {user.email.split('@')[0]}</p>
        </div>
        <button onClick={() => { setUser(null); localStorage.removeItem('fitnessUser'); }} style={styles.logoutBtn}>Sign Out</button>
      </div>

      <div style={styles.mainGrid}>
        {/* NEW: PROGRESSIVE OVERLOAD SECTION (Personal Bests) */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Target size={20} color="#6366f1" />
            <h3 style={styles.cardTitle}>Personal Bests</h3>
          </div>
          <div style={styles.pbList}>
            {fitnessInsights.topPBs.length > 0 ? fitnessInsights.topPBs.map(([name, weight]) => (
              <div key={name} style={styles.pbItem}>
                <span style={styles.pbName}>{name}</span>
                <span style={styles.pbWeight}>{weight} <small>kg</small></span>
              </div>
            )) : <p style={styles.emptyMsg}>Lift heavy to set your first PB!</p>}
          </div>
        </div>

        {/* NEW: TRAINING BALANCE SECTION */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Zap size={20} color="#fbbf24" />
            <h3 style={styles.cardTitle}>Training Balance</h3>
          </div>
          <div style={styles.balanceGrid}>
            {Object.entries(fitnessInsights.muscleSplit).map(([group, count]) => {
              const max = Math.max(...Object.values(fitnessInsights.muscleSplit), 1);
              return (
                <div key={group} style={styles.balanceRow}>
                  <span style={styles.balanceLabel}>{group}</span>
                  <div style={styles.barContainer}>
                    <div style={{...styles.barFill, width: `${(count / max) * 100}%`}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* REDUCED HISTORY SECTION */}
        <div style={{...styles.card, gridColumn: '1 / -1'}}>
          <h3 style={styles.cardTitle}>Recent Sessions</h3>
          <div style={styles.sessionList}>
            {workouts.slice(0, 5).map((w, i) => (
              <div key={i} style={styles.sessionItem}>
                <span style={styles.sessionDate}>{new Date(w.created_at).toLocaleDateString()}</span>
                <span style={styles.sessionContent}>{w.exercises?.[0]?.exercise_name} (+{w.exercises?.length - 1} more)</span>
                <button onClick={() => {}} style={styles.deleteBtn}><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FABs & MODAL */}
      <div style={styles.fabContainer}>
        <button onClick={() => {setWorkoutType('strength'); setIsLoggingWorkout(true)}} style={{...styles.fab, background: '#6366f1'}}><Dumbbell size={18}/> Strength</button>
        <button onClick={() => {setWorkoutType('cardio'); setIsLoggingWorkout(true)}} style={{...styles.fab, background: '#ec4899'}}><Heart size={18}/> Cardio</button>
        <button onClick={() => {setWorkoutType('stretch'); setIsLoggingWorkout(true)}} style={{...styles.fab, background: '#10b981'}}><Wind size={18}/> Stretch</button>
      </div>

      {isLoggingWorkout && <WorkoutPanel workoutType={workoutType} setIsLoggingWorkout={setIsLoggingWorkout} setCurrentExercises={setCurrentExercises} currentExercises={currentExercises} finishWorkout={finishWorkout} loading={loading} />}
    </div>
  );
};

// ... WorkoutPanel and AuthForm components stay identical to the previous version ...

const styles = {
  container: { minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '30px', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px' },
  brandTitle: { fontSize: '26px', color: '#6366f1', margin: 0, fontWeight: '800' },
  greeting: { color: '#94a3b8', margin: '5px 0' },
  logoutBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' },
  
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', paddingBottom: '100px' },
  card: { background: '#1e293b', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  cardTitle: { fontSize: '18px', margin: 0, fontWeight: '600' },

  // PB Styles
  pbList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  pbItem: { display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.2)' },
  pbName: { fontWeight: '600' },
  pbWeight: { color: '#6366f1', fontWeight: '800', fontSize: '18px' },

  // Balance Styles
  balanceGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  balanceRow: { display: 'flex', alignItems: 'center', gap: '15px' },
  balanceLabel: { width: '80px', fontSize: '12px', color: '#94a3b8' },
  barContainer: { flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' },
  barFill: { height: '100%', background: '#fbbf24', borderRadius: '4px' },

  sessionList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  sessionItem: { background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sessionDate: { color: '#6366f1', fontWeight: '600', fontSize: '14px' },
  sessionContent: { color: '#94a3b8', fontSize: '13px' },
  deleteBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },

  fabContainer: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', z_index: 10 },
  fab: { padding: '14px 22px', borderRadius: '30px', border: 'none', color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', fontSize: '14px' },
  
  // (Include previous Modal and Auth styles here...)
};

export default Dashboard;
