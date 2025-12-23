import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Calendar, Heart, Sparkles, Trash2, X, Trophy, User, Target, Zap, Wind, LogOut } from 'lucide-react';

const EXERCISES = {
  strength: { 'Bench Press': 'Chest', 'Squat': 'Legs', 'Deadlift': 'Back', 'Overhead Press': 'Shoulders', 'Rows': 'Back', 'Bicep Curls': 'Arms' },
  cardio: { 'Running': 'Cardio', 'Cycling': 'Cardio', 'Swimming': 'Cardio' },
  stretch: { 'Yoga': 'Flexibility', 'Mobility Work': 'Flexibility' }
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [allData, setAllData] = useState({ workouts: [], users: [] });
  const [isLogging, setIsLogging] = useState(false);
  const [workoutType, setWorkoutType] = useState('strength');
  const [selectedEx, setSelectedEx] = useState('Bench Press');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/.netlify/functions/database`);
      if (!res.ok) throw new Error('Failed to fetch data');
      
      const data = await res.json();
      setAllData(data || { workouts: [], users: [] });
    } catch (e) {
      console.error('Load data error:', e);
      setError('Failed to load workout data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('fitnessUser');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const finishWorkout = async () => {
    if (!sets || !reps || !weight) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const payload = [{ 
        exercise_name: selectedEx, 
        sets: Number(sets), 
        reps: Number(reps), 
        weight: Number(weight) 
      }];
      
      const res = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, exercises: payload })
      });
      
      if (!res.ok) throw new Error('Failed to save workout');
      
      setIsLogging(false);
      setSets(''); 
      setReps(''); 
      setWeight('');
      await loadData();
      
    } catch (e) {
      console.error('Save workout error:', e);
      setError('Failed to save workout');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/.netlify/functions/database', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth', email, password }) 
      });
      
      if (!res.ok) throw new Error('Authentication failed');
      
      const data = await res.json();
      const userData = { email: data.email };
      setUser(userData);
      localStorage.setItem('fitnessUser', JSON.stringify(userData));
      
    } catch (e) {
      console.error('Auth error:', e);
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (workoutId) => {
    if (!confirm('Delete this workout?')) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/.netlify/functions/database?workoutId=${workoutId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) throw new Error('Failed to delete workout');
      
      await loadData();
      
    } catch (e) {
      console.error('Delete error:', e);
      setError('Failed to delete workout');
    } finally {
      setLoading(false);
    }
  };

  const stats = (() => {
    if (!user || !allData?.workouts) {
      return { myLogs: [], muscleSplit: {}, pbs: {}, league: [] };
    }

    const myLogs = allData.workouts.filter(w => w.user_email === user.email) || [];
    const muscleSplit = { Chest: 0, Legs: 0, Back: 0, Shoulders: 0, Arms: 0, Cardio: 0, Flexibility: 0 };
    const pbs = {};

    myLogs.forEach(w => {
      // Use ex_name which is the flattened field from your function
      const group = EXERCISES.strength[w.ex_name] || EXERCISES.cardio[w.ex_name] || EXERCISES.stretch[w.ex_name];
      if (group) muscleSplit[group]++;
      if (w.ex_weight > (pbs[w.ex_name] || 0)) pbs[w.ex_name] = w.ex_weight;
    });

    const league = Object.entries((allData.workouts || []).reduce((acc, w) => {
      acc[w.user_email] = (acc[w.user_email] || 0) + 1;
      return acc;
    }, {})).map(([email, count]) => {
      const u = allData.users?.find(usr => usr.email === email);
      return { name: u?.display_name || email.split('@')[0], count };
    }).sort((a,b) => b.count - a.count);

    return { myLogs, muscleSplit, pbs, league };
  })();

  if (!user) return (
    <div style={styles.container}>
      <div style={styles.authCard}>
        <Sparkles size={40} color="#6366f1" />
        <h2 style={{margin:'20px 0'}}>Fit as a Fiddle</h2>
        {error && <div style={styles.error}>{error}</div>}
        <input 
          style={styles.input} 
          placeholder="Email" 
          value={email}
          onChange={e => setEmail(e.target.value)} 
          disabled={loading}
        />
        <input 
          style={styles.input} 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={e => setPassword(e.target.value)} 
          disabled={loading}
        />
        <button 
          style={styles.mainBtn} 
          onClick={handleAuth}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Enter Dashboard'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.brandTitle}>Fit as a Fiddle</h1>
        <button 
          onClick={() => {setUser(null); localStorage.removeItem('fitnessUser');}} 
          style={styles.logoutBtn}
          disabled={loading}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}
      {loading && <div style={styles.loadingBanner}>Loading...</div>}

      <div style={styles.gridTop}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Target size={18} color="#6366f1" />
            <h3>Personal Bests</h3>
          </div>
          {Object.entries(stats.pbs).length === 0 ? (
            <div style={styles.emptyState}>No personal bests yet</div>
          ) : (
            Object.entries(stats.pbs).map(([name, val]) => (
              <div key={name} style={styles.row}>
                <span>{name}</span>
                <span style={{color:'#6366f1', fontWeight:'bold'}}>{val}kg</span>
              </div>
            ))
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Zap size={18} color="#fbbf24" />
            <h3>Muscle Balance</h3>
          </div>
          {Object.entries(stats.muscleSplit).map(([group, count]) => (
            <div key={group} style={styles.balanceRow}>
              <span style={styles.groupLabel}>{group}</span>
              <div style={styles.barBg}>
                <div style={{...styles.barFill, width: `${Math.min(100, count * 20)}%`}} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.gridBottom}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Calendar size={18} color="#6366f1" />
            <h3>Workout History</h3>
          </div>
          <div style={styles.scrollArea}>
            {stats.myLogs.length === 0 ? (
              <div style={styles.emptyState}>No workouts logged yet</div>
            ) : (
              stats.myLogs.map((w, i) => (
                <div key={i} style={styles.historyItem}>
                  <span style={styles.dateText}>
                    {new Date(w.created_at).toLocaleDateString(undefined, {day:'numeric', month:'short'})}
                  </span>
                  <span style={{flex:1, fontWeight:'600'}}>{w.ex_name}</span>
                  <div style={{textAlign:'right', marginRight:'15px'}}>
                     <div style={{fontWeight:'bold', color:'#6366f1'}}>{w.ex_weight}kg</div>
                     <div style={{fontSize:'10px', color:'#94a3b8'}}>{w.ex_sets} x {w.ex_reps}</div>
                  </div>
                  <Trash2 
                    size={16} 
                    color="#ef4444" 
                    style={{cursor:'pointer', opacity: loading ? 0.5 : 1}} 
                    onClick={() => deleteWorkout(w.id)}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Trophy size={18} color="#fbbf24" />
            <h3>League Standings</h3>
          </div>
          <div style={styles.scrollArea}>
            {stats.league.length === 0 ? (
              <div style={styles.emptyState}>No league data available</div>
            ) : (
              stats.league.map((entry, i) => (
                <div key={i} style={styles.leagueItem}>
                  <div style={styles.rankCircle}>{i+1}</div>
                  <div style={{flex:1}}>{entry.name}</div>
                  <div style={{fontSize:'12px', fontWeight:'bold', color:'#fbbf24'}}>{entry.count} sessions</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={styles.fabContainer}>
        <button 
          onClick={() => {
            setWorkoutType('strength'); 
            setIsLogging(true); 
            setSelectedEx('Bench Press');
          }} 
          style={{...styles.fab, background:'#6366f1'}}
          disabled={loading}
        >
          <Dumbbell size={18}/> Strength
        </button>
        <button 
          onClick={() => {
            setWorkoutType('cardio'); 
            setIsLogging(true); 
            setSelectedEx('Running');
          }} 
          style={{...styles.fab, background:'#ec4899'}}
          disabled={loading}
        >
          <Heart size={18}/> Cardio
        </button>
        <button 
          onClick={() => {
            setWorkoutType('stretch'); 
            setIsLogging(true); 
            setSelectedEx('Yoga');
          }} 
          style={{...styles.fab, background:'#10b981'}}
          disabled={loading}
        >
          <Wind size={18}/> Stretch
        </button>
      </div>

      {isLogging && (
         <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
               <div style={styles.modalHeader}>
                 <h3>Log {workoutType}</h3>
                 <X onClick={()=>setIsLogging(false)} style={{cursor:'pointer'}}/>
               </div>
               <select 
                 style={styles.input} 
                 value={selectedEx} 
                 onChange={e=>setSelectedEx(e.target.value)}
                 disabled={loading}
               >
                  {Object.keys(EXERCISES[workoutType]).map(ex => 
                    <option key={ex} value={ex}>{ex}</option>
                  )}
               </select>
               <div style={styles.inputGrid}>
                  <div>
                    <label style={styles.label}>SETS</label>
                    <input 
                      style={styles.input} 
                      type="number" 
                      value={sets} 
                      onChange={e=>setSets(e.target.value)} 
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>REPS</label>
                    <input 
                      style={styles.input} 
                      type="number" 
                      value={reps} 
                      onChange={e=>setReps(e.target.value)} 
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>KG</label>
                    <input 
                      style={styles.input} 
                      type="number" 
                      value={weight} 
                      onChange={e=>setWeight(e.target.value)} 
                      disabled={loading}
                    />
                  </div>
               </div>
               <button 
                 style={styles.mainBtn} 
                 onClick={finishWorkout}
                 disabled={loading}
               >
                 {loading ? 'Saving...' : 'Save Workout'}
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

// Add new styles for error/loading states
const additionalStyles = {
  error: { color: '#ef4444', fontSize: '14px', marginBottom: '15px', textAlign: 'center' },
  errorBanner: { 
    background: 'rgba(239, 68, 68, 0.1)', 
    color: '#ef4444', 
    padding: '12px', 
    borderRadius: '12px', 
    marginBottom: '20px',
    textAlign: 'center'
  },
  loadingBanner: { 
    background: 'rgba(99, 102, 241, 0.1)', 
    color: '#6366f1', 
    padding: '12px', 
    borderRadius: '12px', 
    marginBottom: '20px',
    textAlign: 'center'
  },
  emptyState: { 
    textAlign: 'center', 
    color: '#94a3b8', 
    padding: '40px 20px', 
    fontSize: '14px' 
  }
};

// Merge styles
const styles = {
  ...originalStyles,
  ...additionalStyles
};

const originalStyles = {
  container: { minHeight: '100vh', background: '#0a0f1d', color: '#f8fafc', padding: '40px', fontFamily: 'sans-serif' },
  header: { display:'flex', justifyContent:'space-between', marginBottom:'40px', alignItems:'center' },
  brandTitle: { color:'#6366f1', margin:0, fontWeight:'900', fontSize:'28px' },
  gridTop: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'25px', marginBottom:'25px' },
  gridBottom: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'25px', paddingBottom:'100px' },
  card: { background:'#161d2f', padding:'25px', borderRadius:'24px', border:'1px solid rgba(255,255,255,0.05)' },
  cardHeader: { display:'flex', gap:'10px', alignItems:'center', marginBottom:'20px' },
  row: { display:'flex', justifyContent:'space-between', padding:'12px', background:'rgba(255,255,255,0.02)', borderRadius:'12px', marginBottom:'8px' },
  balanceRow: { display:'flex', alignItems:'center', gap:'15px', marginBottom:'12px' },
  groupLabel: { width:'80px', fontSize:'11px', color:'#94a3b8' },
  barBg: { flex:1, height:'8px', background:'#0a0f1d', borderRadius:'10px' },
  barFill: { height:'100%', background:'#6366f1', borderRadius:'10px' },
  scrollArea: { maxHeight:'400px', overflowY:'auto' },
  historyItem: { display:'flex', padding:'18px', background:'rgba(255,255,255,0.03)', borderRadius:'18px', marginBottom:'12px', alignItems:'center' },
  dateText: { color:'#6366f1', fontWeight:'bold', width:'65px', fontSize:'12px' },
  leagueItem: { display:'flex', alignItems:'center', gap:'15px', padding:'14px', background:'rgba(255,255,255,0.02)', borderRadius:'14px', marginBottom:'10px' },
  rankCircle: { width:'24px', height:'24px', background:'#0a0f1d', borderRadius:'50%', textAlign:'center', fontSize:'11px', lineHeight:'24px' },
  fabContainer: { position:'fixed', bottom:'30px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'15px', zIndex: 100 },
  fab: { padding:'16px 28px', borderRadius:'22px', color:'#fff', border:'none', cursor:'pointer', display:'flex', gap:'10px', fontWeight:'bold' },
  modalOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 },
  modalContent: { background:'#161d2f', padding:'35px', borderRadius:'32px', width:'90%', maxWidth:'420px' },
  modalHeader: { display:'flex', justifyContent:'space-between', marginBottom:'25px', alignItems:'center' },
  label: { fontSize:'10px', color:'#94a3b8', marginBottom:'5px', display:'block' },
  inputGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px' },
  input: { width:'100%', padding:'16px', borderRadius:'16px', background:'#0a0f1d', color:'#fff', border:'1px solid #1e293b', marginBottom:'20px', boxSizing:'border-box' },
  mainBtn: { width:'100%', padding:'18px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'18px', fontWeight:'bold', cursor:'pointer' },
  logoutBtn: { background:'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', display:'flex', alignItems:'center', gap:'8px', fontSize:'14px', fontWeight:'bold' },
  authCard: { maxWidth:'400px', margin:'100px auto', background:'#161d2f', padding:'50px', borderRadius:'40px', textAlign:'center' }
};

export default Dashboard;
