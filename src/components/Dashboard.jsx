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
  const [loading, setLoading] = useState(true);
  
  // Form Inputs
  const [selectedEx, setSelectedEx] = useState('Bench Press');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/.netlify/functions/database`);
      const data = await res.json();
      setAllData(data || { workouts: [], users: [] });
    } catch (e) { console.error("Load Error:", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('fitnessUser');
    if (saved) setUser(JSON.parse(saved));
    else setLoading(false);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleLogout = () => {
    localStorage.removeItem('fitnessUser');
    setUser(null);
  };

  const finishWorkout = async () => {
    if (!selectedEx) return;
    setIsLogging(false);
    
    // We explicitly name this exercise_name for the history list to find
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
    
    setSets(''); setReps(''); setWeight('');
    loadData();
  };

  const stats = (() => {
    const myLogs = allData?.workouts?.filter(w => w.user_email === user?.email) || [];
    const muscleSplit = { Chest: 0, Legs: 0, Back: 0, Shoulders: 0, Arms: 0, Cardio: 0, Flexibility: 0 };
    const pbs = {};

    myLogs.forEach(w => {
      // Access the first exercise in the array
      const ex = w.exercises?.[0];
      if (ex) {
        const name = ex.exercise_name || "Unknown";
        const group = EXERCISES.strength[name] || EXERCISES.cardio[name] || EXERCISES.stretch[name];
        if (group) muscleSplit[group]++;
        if (ex.weight > (pbs[name] || 0)) pbs[name] = ex.weight;
      }
    });

    const league = Object.entries((allData?.workouts || []).reduce((acc, w) => {
      acc[w.user_email] = (acc[w.user_email] || 0) + 1;
      return acc;
    }, {})).map(([email, count]) => {
      const u = allData?.users?.find(usr => usr.email === email);
      return { name: u?.display_name || email.split('@')[0], count };
    }).sort((a,b) => b.count - a.count);

    return { myLogs, muscleSplit, pbs, league };
  })();

  if (!user) return (
    <div style={styles.container}>
      <div style={styles.authCard}>
        <Sparkles size={40} color="#6366f1" />
        <h2 style={{margin:'20px 0'}}>Fit as a Fiddle</h2>
        <input style={styles.input} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button style={styles.mainBtn} onClick={async () => {
            const res = await fetch('/.netlify/functions/database', { method: 'POST', body: JSON.stringify({ action: 'auth', email, password }) });
            if (res.ok) { 
              const d = await res.json(); 
              setUser({email: d.email}); 
              localStorage.setItem('fitnessUser', JSON.stringify({email: d.email})); 
            }
        }}>Enter App</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.brandTitle}>Fit as a Fiddle</h1>
          <div style={{fontSize: '12px', color: '#6366f1', marginTop: '4px'}}>Focus: Chest</div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div style={styles.gridTop}>
        <div style={styles.card}>
          <div style={styles.cardHeader}><Target size={18} color="#6366f1" /><h3>Personal Bests</h3></div>
          {Object.entries(stats.pbs).length > 0 ? Object.entries(stats.pbs).map(([name, val]) => (
            <div key={name} style={styles.row}><span>{name}</span><span style={{color:'#6366f1', fontWeight:'bold'}}>{val}kg</span></div>
          )) : <div style={styles.empty}>No logs yet.</div>}
        </div>
        <div style={styles.card}>
          <div style={styles.cardHeader}><Zap size={18} color="#fbbf24" /><h3>Muscle Balance</h3></div>
          {Object.entries(stats.muscleSplit).map(([group, count]) => (
            <div key={group} style={styles.balanceRow}>
              <span style={styles.groupLabel}>{group}</span>
              <div style={styles.barBg}><div style={{...styles.barFill, width: `${Math.min(100, count * 20)}%`}} /></div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.gridBottom}>
        <div style={styles.card}>
          <div style={styles.cardHeader}><Calendar size={18} color="#6366f1" /><h3>Your History</h3></div>
          <div style={styles.scrollArea}>
            {stats.myLogs.map((w, i) => {
              const ex = w.exercises?.[0] || {};
              return (
                <div key={i} style={styles.historyItem}>
                  <span style={styles.dateText}>{new Date(w.created_at).toLocaleDateString(undefined, {day:'numeric', month:'short'})}</span>
                  <span style={{flex:1, fontWeight:'600'}}>{ex.exercise_name || "Workout"}</span>
                  <div style={{textAlign:'right', marginRight:'15px'}}>
                     <div style={{fontWeight:'bold', color:'#6366f1'}}>{ex.weight || 0}kg</div>
                     <div style={{fontSize:'10px', color:'#94a3b8'}}>{ex.sets || 0} x {ex.reps || 0}</div>
                  </div>
                  <Trash2 size={16} color="#ef4444" style={{cursor:'pointer'}} onClick={async () => {
                     await fetch(`/.netlify/functions/database?workoutId=${w.id}`, { method: 'DELETE' });
                     loadData();
                  }} />
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}><Trophy size={18} color="#fbbf24" /><h3>Global League</h3></div>
          <div style={styles.scrollArea}>
            {stats.league.map((entry, i) => (
              <div key={i} style={styles.leagueItem}>
                <div style={styles.rankCircle}>{i+1}</div>
                <div style={{flex:1, fontWeight:'500'}}>{entry.name}</div>
                <div style={{fontSize:'12px', color:'#94a3b8'}}>{entry.count} Workouts</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.fabContainer}>
        <button onClick={() => {setWorkoutType('strength'); setIsLogging(true); setSelectedEx('Bench Press')}} style={{...styles.fab, background:'#6366f1'}}><Dumbbell size={18}/> Strength</button>
        <button onClick={() => {setWorkoutType('cardio'); setIsLogging(true); setSelectedEx('Running')}} style={{...styles.fab, background:'#ec4899'}}><Heart size={18}/> Cardio</button>
        <button onClick={() => {setWorkoutType('stretch'); setIsLogging(true); setSelectedEx('Yoga')}} style={{...styles.fab, background:'#10b981'}}><Wind size={18}/> Stretch</button>
      </div>

      {isLogging && (
         <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
               <div style={styles.modalHeader}><h3>Log {workoutType}</h3><X onClick={()=>setIsLogging(false)} style={{cursor:'pointer'}}/></div>
               <label style={styles.label}>SELECT EXERCISE</label>
               <select style={styles.input} value={selectedEx} onChange={e=>setSelectedEx(e.target.value)}>
                  {Object.keys(EXERCISES[workoutType]).map(ex => <option key={ex} value={ex}>{ex}</option>)}
               </select>
               <div style={styles.inputGrid}>
                  <div><label style={styles.label}>SETS</label><input style={styles.input} type="number" value={sets} onChange={e=>setSets(e.target.value)} /></div>
                  <div><label style={styles.label}>REPS</label><input style={styles.input} type="number" value={reps} onChange={e=>setReps(e.target.value)} /></div>
                  <div><label style={styles.label}>WEIGHT (KG)</label><input style={styles.input} type="number" value={weight} onChange={e=>setWeight(e.target.value)} /></div>
               </div>
               <button style={styles.mainBtn} onClick={finishWorkout}>Finish & Save to Neon</button>
            </div>
         </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#0a0f1d', color: '#f8fafc', padding: '40px', fontFamily: 'sans-serif' },
  header: { display:'flex', justifyContent:'space-between', marginBottom:'40px', alignItems:'flex-start' },
  brandTitle: { color:'#6366f1', margin:0, fontWeight:'900', fontSize:'32px', letterSpacing: '-1px' },
  gridTop: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'25px', marginBottom:'25px' },
  gridBottom: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'25px', paddingBottom:'100px' },
  card: { background:'#161d2f', padding:'25px', borderRadius:'24px', border:'1px solid rgba(255,255,255,0.05)' },
  cardHeader: { display:'flex', gap:'10px', alignItems:'center', marginBottom:'20px' },
  row: { display:'flex', justifyContent:'space-between', padding:'12px', background:'rgba(255,255,255,0.02)', borderRadius:'12px', marginBottom:'8px' },
  balanceRow: { display:'flex', alignItems:'center', gap:'15px', marginBottom:'12px' },
  groupLabel: { width:'80px', fontSize:'11px', color:'#94a3b8', fontWeight: 'bold' },
  barBg: { flex:1, height:'8px', background:'#0a0f1d', borderRadius:'10px' },
  barFill: { height:'100%', background:'#6366f1', borderRadius:'10px', transition: 'width 0.4s ease' },
  scrollArea: { maxHeight:'400px', overflowY:'auto' },
  historyItem: { display:'flex', padding:'18px', background:'rgba(255,255,255,0.03)', borderRadius:'18px', marginBottom:'12px', alignItems:'center', border: '1px solid rgba(255,255,255,0.03)' },
  dateText: { color:'#6366f1', fontWeight:'bold', width:'65px', fontSize:'12px' },
  leagueItem: { display:'flex', alignItems:'center', gap:'15px', padding:'14px', background:'rgba(255,255,255,0.02)', borderRadius:'14px', marginBottom:'10px' },
  rankCircle: { width:'28px', height:'28px', background:'#0a0f1d', borderRadius:'50%', textAlign:'center', fontSize:'12px', lineHeight:'28px', fontWeight:'bold' },
  fabContainer: { position:'fixed', bottom:'30px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'15px', zIndex: 100 },
  fab: { padding:'16px 28px', borderRadius:'24px', color:'#fff', border:'none', cursor:'pointer', display:'flex', gap:'10px', fontWeight:'bold', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' },
  modalOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 },
  modalContent: { background:'#161d2f', padding:'35px', borderRadius:'32px', width:'92%', maxWidth:'420px', border: '1px solid rgba(255,255,255,0.1)' },
  modalHeader: { display:'flex', justifyContent:'space-between', marginBottom:'25px', alignItems:'center' },
  label: { fontSize:'10px', color:'#94a3b8', marginBottom:'6px', display:'block', fontWeight: 'bold', letterSpacing: '1px' },
  inputGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px' },
  input: { width:'100%', padding:'16px', borderRadius:'16px', background:'#0a0f1d', color:'#fff', border:'1px solid #1e293b', marginBottom:'20px', boxSizing:'border-box', outline: 'none' },
  mainBtn: { width:'100%', padding:'18px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'18px', fontWeight:'bold', cursor:'pointer', fontSize: '16px' },
  logoutBtn: { background:'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 18px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', display:'flex', alignItems:'center', gap:'8px', fontSize:'14px', fontWeight:'bold' },
  authCard: { maxWidth:'400px', margin:'100px auto', background:'#161d2f', padding:'50px', borderRadius:'40px', textAlign:'center', border: '1px solid rgba(255,255,255,0.05)' },
  empty: { textAlign: 'center', padding: '40px', color: '#475569', fontSize: '14px' }
};

export default Dashboard;
