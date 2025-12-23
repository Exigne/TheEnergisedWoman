import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Calendar, Heart, Sparkles, Trash2, X, Trophy, Medal, Sun, Loader2, Target, Zap, Wind } from 'lucide-react';

const EXERCISES = {
  strength: { 
    'Bench Press': 'Chest', 'Squat': 'Legs', 'Deadlift': 'Back', 
    'Overhead Press': 'Shoulders', 'Rows': 'Back', 'Bicep Curls': 'Arms' 
  },
  cardio: { 'Running': 'Cardio', 'Cycling': 'Cardio', 'Swimming': 'Cardio' },
  stretch: { 'Yoga': 'Flexibility', 'Mobility Work': 'Flexibility', 'Pilates': 'Core' }
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [isLogging, setIsLogging] = useState(false);
  const [workoutType, setWorkoutType] = useState('strength');
  const [loading, setLoading] = useState(true);
  
  // Logging Inputs
  const [selectedEx, setSelectedEx] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isReg, setIsReg] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/.netlify/functions/database`);
      const data = await res.json();
      setAllWorkouts(data.workouts || []);
    } catch (e) { console.error("Database sync error", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('fitnessUser');
    if (saved) setUser(JSON.parse(saved));
    else setLoading(false);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const finishWorkout = async () => {
    if (!selectedEx) return alert("Please select an exercise");
    setLoading(true);
    
    const payload = [{
      exercise_name: selectedEx,
      sets: Number(sets) || 0,
      reps: Number(reps) || 0,
      weight: Number(weight) || 0
    }];

    await fetch('/.netlify/functions/database', {
      method: 'POST',
      body: JSON.stringify({ userEmail: user.email, exercises: payload })
    });
    
    setIsLogging(false);
    setSelectedEx(''); setSets(''); setReps(''); setWeight('');
    loadData();
  };

  const handleAuth = async () => {
    setLoading(true);
    const res = await fetch('/.netlify/functions/database', {
      method: 'POST',
      body: JSON.stringify({ action: 'auth', email, password, isRegistering: isReg })
    });
    const data = await res.json();
    if (res.ok) {
      setUser({ email: data.email });
      localStorage.setItem('fitnessUser', JSON.stringify({ email: data.email }));
    } else alert(data.error);
    setLoading(false);
  };

  const deleteWorkout = async (id) => {
    if (!window.confirm("Delete this session?")) return;
    await fetch(`/.netlify/functions/database?workoutId=${id}`, { method: 'DELETE' });
    loadData();
  };

  // UI Logic: Stats & Calculations
  const stats = (() => {
    const myLogs = allWorkouts.filter(w => w.user_email === user?.email);
    const muscleSplit = { Chest: 0, Legs: 0, Back: 0, Shoulders: 0, Arms: 0, Cardio: 0, Flexibility: 0 };
    const pbs = {};

    myLogs.forEach(w => {
      w.exercises?.forEach(ex => {
        // Muscle Balance
        const group = EXERCISES.strength[ex.exercise_name] || EXERCISES.cardio[ex.exercise_name] || EXERCISES.stretch[ex.exercise_name];
        if (group) muscleSplit[group]++;

        // Personal Bests
        if (!pbs[ex.exercise_name] || ex.weight > pbs[ex.exercise_name]) {
          pbs[ex.exercise_name] = ex.weight;
        }
      });
    });

    const leagueMap = allWorkouts.reduce((acc, w) => {
      acc[w.user_email] = (acc[w.user_email] || 0) + 1;
      return acc;
    }, {});

    const sortedLeague = Object.entries(leagueMap)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count);

    return { myLogs, muscleSplit, pbs, sortedLeague };
  })();

  if (!user) return (
    <div style={styles.container}>
      <div style={styles.authCard}>
        <Sparkles size={40} color="#6366f1" />
        <h2 style={{margin: '20px 0'}}>Fit as a Fiddle</h2>
        <input style={styles.input} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button style={styles.mainBtn} onClick={handleAuth}>{isReg ? 'Create Account' : 'Sign In'}</button>
        <button style={styles.textBtn} onClick={() => setIsReg(!isReg)}>{isReg ? 'Back' : 'Register'}</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header Widget */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.brandTitle}>Fit as a Fiddle</h1>
          <p style={styles.subtitle}>Focus: {Object.entries(stats.muscleSplit).sort((a,b)=>b[1]-a[1])[0][0]}</p>
        </div>
        <div style={styles.statusWidget}>
           <div style={{textAlign:'right'}}>
              <div style={styles.smallLabel}>{new Date().toLocaleDateString(undefined, {weekday:'long', day:'numeric', month:'short'}).toUpperCase()}</div>
              <div style={styles.statusText}>Peak strength hours</div>
           </div>
           <div style={styles.iconCircle}><Sun size={16} color="#fbbf24" /></div>
           <button onClick={() => {setUser(null); localStorage.removeItem('fitnessUser');}} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </div>

      {/* TOP ROW: PBs & Muscle Balance */}
      <div style={styles.topGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}><Target size={18} color="#6366f1" /><h3>Personal Bests</h3></div>
          <div style={styles.pbList}>
            {Object.entries(stats.pbs).slice(0, 4).map(([name, val]) => (
              <div key={name} style={styles.itemRow}><span>{name}</span><span style={{color:'#6366f1'}}>{val}kg</span></div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}><Zap size={18} color="#fbbf24" /><h3>Muscle Balance</h3></div>
          {Object.entries(stats.muscleSplit).map(([group, count]) => (
            <div key={group} style={styles.balanceRow}>
              <span style={styles.groupName}>{group}</span>
              <div style={styles.barBg}><div style={{...styles.barFill, width: `${Math.min(100, count * 20)}%`}} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM ROW: History & League */}
      <div style={styles.bottomGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}><Calendar size={18} color="#6366f1" /><h3>Your History</h3></div>
          <div style={styles.scrollArea}>
            {stats.myLogs.map((w, i) => (
              <div key={i} style={styles.historyItem}>
                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                   <span style={styles.dateText}>{new Date(w.created_at).toLocaleDateString(undefined, {day:'numeric', month:'short'})}</span>
                   <span style={{fontSize:'14px'}}>{w.exercises?.[0]?.exercise_name || 'Workout'}</span>
                </div>
                <button onClick={() => deleteWorkout(w.id)} style={styles.deleteBtn}><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}><Trophy size={18} color="#fbbf24" /><h3>Global League</h3></div>
          <div style={styles.scrollArea}>
            {stats.sortedLeague.map((entry, i) => (
              <div key={i} style={{...styles.leagueItem, borderLeft: entry.email === user.email ? '3px solid #6366f1' : 'none'}}>
                <div style={styles.rankCircle}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px'}}>{entry.email.split('@')[0]}</div>
                  <small style={{color:'#94a3b8'}}>{entry.count} Workouts</small>
                </div>
                {i === 0 && <Medal size={16} color="#fbbf24" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div style={styles.fabContainer}>
        <button onClick={() => {setWorkoutType('strength'); setIsLogging(true); setSelectedEx('Bench Press')}} style={{...styles.fab, background: '#6366f1'}}><Dumbbell size={18}/> Strength</button>
        <button onClick={() => {setWorkoutType('cardio'); setIsLogging(true); setSelectedEx('Running')}} style={{...styles.fab, background: '#ec4899'}}><Heart size={18}/> Cardio</button>
        <button onClick={() => {setWorkoutType('stretch'); setIsLogging(true); setSelectedEx('Yoga')}} style={{...styles.fab, background: '#10b981'}}><Wind size={18}/> Stretch</button>
      </div>

      {/* Logging Modal */}
      {isLogging && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <Dumbbell size={20} color="#6366f1" /><h3>New {workoutType} Session</h3>
              </div>
              <button onClick={() => setIsLogging(false)} style={styles.textBtn}><X /></button>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <div>
                <label style={styles.label}>EXERCISE</label>
                <select style={styles.input} value={selectedEx} onChange={e => setSelectedEx(e.target.value)}>
                  {Object.keys(EXERCISES[workoutType]).map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
              </div>
              {workoutType === 'strength' ? (
                <div style={styles.inputGrid}>
                  <div><label style={styles.label}>SETS</label><input type="number" style={styles.input} value={sets} onChange={e=>setSets(e.target.value)} /></div>
                  <div><label style={styles.label}>REPS</label><input type="number" style={styles.input} value={reps} onChange={e=>setReps(e.target.value)} /></div>
                  <div><label style={styles.label}>KG</label><input type="number" style={styles.input} value={weight} onChange={e=>setWeight(e.target.value)} /></div>
                </div>
              ) : (
                <div><label style={styles.label}>DURATION (MIN)</label><input type="number" style={styles.input} value={reps} onChange={e=>setReps(e.target.value)} /></div>
              )}
              <button style={styles.mainBtn} onClick={finishWorkout}>Finish & Save to Neon</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#0a0f1d', color: '#f8fafc', padding: '40px', fontFamily: 'sans-serif' },
  header: { display:'flex', justifyContent:'space-between', marginBottom:'40px', alignItems:'center' },
  brandTitle: { color:'#6366f1', margin:0, fontWeight:'800', fontSize:'28px' },
  subtitle: { color:'#94a3b8', fontSize:'14px', margin:0 },
  statusWidget: { display:'flex', alignItems:'center', gap:'15px', background:'rgba(255,255,255,0.03)', padding:'10px 20px', borderRadius:'15px', border:'1px solid rgba(255,255,255,0.05)' },
  smallLabel: { fontSize:'9px', color:'#94a3b8' },
  statusText: { fontSize:'12px', color:'#fff' },
  iconCircle: { background:'rgba(255,255,255,0.05)', padding:'8px', borderRadius:'50%' },
  logoutBtn: { color:'#ef4444', background:'none', border:'none', cursor:'pointer', fontWeight:'bold', marginLeft:'10px' },
  topGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px', marginBottom:'30px' },
  bottomGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px', paddingBottom:'100px' },
  card: { background:'#161d2f', padding:'25px', borderRadius:'25px', border:'1px solid rgba(255,255,255,0.03)' },
  cardHeader: { display:'flex', gap:'10px', alignItems:'center', marginBottom:'20px' },
  itemRow: { display:'flex', justifyContent:'space-between', padding:'12px', borderBottom:'1px solid rgba(255,255,255,0.02)' },
  balanceRow: { display:'flex', alignItems:'center', gap:'15px', marginBottom:'12px' },
  groupName: { width:'80px', fontSize:'11px', color:'#94a3b8' },
  barBg: { flex:1, height:'6px', background:'#0a0f1d', borderRadius:'10px' },
  barFill: { height:'100%', background:'#6366f1', borderRadius:'10px', transition:'width 0.3s' },
  scrollArea: { maxHeight:'400px', overflowY:'auto' },
  historyItem: { display:'flex', justifyContent:'space-between', padding:'15px', background:'rgba(255,255,255,0.02)', borderRadius:'15px', marginBottom:'10px' },
  dateText: { color:'#6366f1', fontWeight:'bold', width:'60px' },
  deleteBtn: { background:'none', border:'none', color:'#ef4444', cursor:'pointer' },
  leagueItem: { display:'flex', alignItems:'center', gap:'15px', padding:'15px', background:'rgba(255,255,255,0.02)', borderRadius:'15px', marginBottom:'10px' },
  rankCircle: { width:'30px', height:'30px', background:'#0a0f1d', borderRadius:'50%', textAlign:'center', lineHeight:'30px' },
  fabContainer: { position:'fixed', bottom:'30px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'15px', zIndex:50 },
  fab: { padding:'15px 25px', borderRadius:'20px', color:'#fff', border:'none', cursor:'pointer', display:'flex', gap:'10px', fontWeight:'bold', boxShadow:'0 10px 15px rgba(0,0,0,0.3)' },
  modalOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 },
  modalContent: { background:'#161d2f', padding:'35px', borderRadius:'30px', width:'90%', maxWidth:'450px' },
  modalHeader: { display:'flex', justifyContent:'space-between', marginBottom:'30px' },
  label: { fontSize:'10px', color:'#64748b', fontWeight:'bold', marginBottom:'8px', display:'block' },
  inputGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px' },
  input: { width:'100%', padding:'15px', borderRadius:'15px', background:'#0a0f1d', color:'#fff', border:'1px solid #1e293b', boxSizing:'border-box' },
  mainBtn: { width:'100%', padding:'18px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'15px', fontWeight:'bold', cursor:'pointer' },
  textBtn: { background:'none', border:'none', color:'#94a3b8', cursor:'pointer' },
  authCard: { maxWidth:'400px', margin:'100px auto', background:'#161d2f', padding:'50px', borderRadius:'40px', textAlign:'center' }
};

export default Dashboard;
