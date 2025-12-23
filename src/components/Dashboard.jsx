import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Calendar, Heart, Sparkles, Trash2, X, Trophy, Medal, Sun, User, Camera, Settings, Target, Zap, Wind } from 'lucide-react';

const EXERCISES = {
  strength: { 'Bench Press': 'Chest', 'Squat': 'Legs', 'Deadlift': 'Back', 'Overhead Press': 'Shoulders', 'Rows': 'Back', 'Bicep Curls': 'Arms' },
  cardio: { 'Running': 'Cardio', 'Cycling': 'Cardio', 'Swimming': 'Cardio' },
  stretch: { 'Yoga': 'Flexibility', 'Mobility Work': 'Flexibility' }
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [allData, setAllData] = useState({ workouts: [], users: [] });
  const [isLogging, setIsLogging] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [workoutType, setWorkoutType] = useState('strength');
  const [loading, setLoading] = useState(true);
  
  // Profile/Auth Inputs
  const [profileName, setProfileName] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isReg, setIsReg] = useState(false);

  // Workout Inputs
  const [selectedEx, setSelectedEx] = useState('');
  const [weight, setWeight] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/.netlify/functions/database`);
      const data = await res.json();
      setAllData(data);
      // Sync local user data if updated on server
      const currentUser = data.users.find(u => u.email === user?.email);
      if (currentUser) {
        setProfileName(currentUser.display_name || '');
        setProfilePic(currentUser.profile_pic || '');
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('fitnessUser');
    if (saved) setUser(JSON.parse(saved));
    else setLoading(false);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const updateProfile = async () => {
    await fetch('/.netlify/functions/database', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_profile', email: user.email, displayName: profileName, profilePic })
    });
    setShowProfile(false);
    loadData();
  };

  const finishWorkout = async () => {
    setLoading(true);
    await fetch('/.netlify/functions/database', {
      method: 'POST',
      body: JSON.stringify({ 
        userEmail: user.email, 
        exercises: [{ exercise_name: selectedEx, weight: Number(weight) || 0 }] 
      })
    });
    setIsLogging(false);
    loadData();
  };

  const stats = (() => {
    const myLogs = allData.workouts.filter(w => w.user_email === user?.email);
    const league = Object.entries(allData.workouts.reduce((acc, w) => {
      acc[w.user_email] = (acc[w.user_email] || 0) + 1;
      return acc;
    }, {})).map(([email, count]) => {
      const u = allData.users.find(usr => usr.email === email);
      return { email, count, name: u?.display_name || email.split('@')[0], pic: u?.profile_pic };
    }).sort((a,b) => b.count - a.count);

    return { myLogs, league };
  })();

  if (!user) return (
    <div style={styles.container}>
      <div style={styles.authCard}>
        <Sparkles size={40} color="#6366f1" />
        <h2>Workout League</h2>
        <input style={styles.input} placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button style={styles.mainBtn} onClick={handleAuth}>Log In</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.brandTitle}>Fit as a Fiddle</h1>
        <div style={styles.profileTrigger} onClick={() => setShowProfile(true)}>
          <div style={styles.profileText}>
            <div style={styles.smallLabel}>WELCOME BACK</div>
            <div style={{fontWeight:'bold'}}>{profileName || user.email.split('@')[0]}</div>
          </div>
          {profilePic ? <img src={profilePic} style={styles.avatar} /> : <div style={styles.avatar}><User size={20}/></div>}
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* HISTORY */}
        <div style={styles.card}>
          <div style={styles.cardHeader}><Calendar size={18} color="#6366f1" /><h3>Your History</h3></div>
          <div style={styles.scrollArea}>
            {stats.myLogs.map((w, i) => (
              <div key={i} style={styles.historyItem}>
                <span style={styles.dateText}>{new Date(w.created_at).toLocaleDateString(undefined, {day:'numeric', month:'short'})}</span>
                <span style={{flex:1}}>{w.exercises?.[0]?.exercise_name || 'Workout'}</span>
                <span style={{color:'#6366f1', fontWeight:'bold'}}>{w.exercises?.[0]?.weight}kg</span>
              </div>
            ))}
          </div>
        </div>

        {/* LEAGUE */}
        <div style={styles.card}>
          <div style={styles.cardHeader}><Trophy size={18} color="#fbbf24" /><h3>Global League</h3></div>
          <div style={styles.scrollArea}>
            {stats.league.map((entry, i) => (
              <div key={i} style={styles.leagueItem}>
                <div style={styles.rankCircle}>{i+1}</div>
                {entry.pic ? <img src={entry.pic} style={styles.smallAvatar} /> : <div style={styles.smallAvatar}><User size={12}/></div>}
                <div style={{flex:1}}>
                  <div>{entry.name}</div>
                  <small style={{color:'#94a3b8'}}>{entry.count} Workouts</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showProfile && (
        <div style={styles.modalOverlay}>
          <div style={styles.profileModal}>
            <div style={styles.modalHeader}><h3>Profile Settings</h3><X onClick={()=>setShowProfile(false)} style={{cursor:'pointer'}}/></div>
            <div style={styles.profileSetupBody}>
              <div style={styles.avatarLarge}>
                {profilePic ? <img src={profilePic} style={styles.fullImg} /> : <Camera size={40} color="#334155"/>}
              </div>
              <input style={styles.input} placeholder="Display Name" value={profileName} onChange={e=>setProfileName(e.target.value)} />
              <input style={styles.input} placeholder="Profile Image URL" value={profilePic} onChange={e=>setProfilePic(e.target.value)} />
              <button style={styles.mainBtn} onClick={updateProfile}>Save Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div style={styles.fabContainer}>
        <button onClick={() => {setWorkoutType('strength'); setIsLogging(true); setSelectedEx('Bench Press')}} style={{...styles.fab, background: '#6366f1'}}><Dumbbell size={18}/> Strength</button>
        <button onClick={() => {setWorkoutType('cardio'); setIsLogging(true); setSelectedEx('Running')}} style={{...styles.fab, background: '#ec4899'}}><Heart size={18}/> Cardio</button>
        <button onClick={() => {setWorkoutType('stretch'); setIsLogging(true); setSelectedEx('Yoga')}} style={{...styles.fab, background: '#10b981'}}><Wind size={18}/> Stretch</button>
      </div>

      {isLogging && (
         <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
               <div style={styles.modalHeader}><h3>New {workoutType}</h3><X onClick={()=>setIsLogging(false)}/></div>
               <select style={styles.input} onChange={e=>setSelectedEx(e.target.value)}>
                  {Object.keys(EXERCISES[workoutType]).map(ex => <option key={ex}>{ex}</option>)}
               </select>
               <input style={styles.input} type="number" placeholder="Weight (kg)" onChange={e=>setWeight(e.target.value)} />
               <button style={styles.mainBtn} onClick={finishWorkout}>Finish & Save</button>
            </div>
         </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#0a0f1d', color: '#f8fafc', padding: '40px', fontFamily: 'sans-serif' },
  header: { display:'flex', justifyContent:'space-between', marginBottom:'40px' },
  brandTitle: { color:'#6366f1', margin:0, fontWeight:'800' },
  profileTrigger: { display:'flex', alignItems:'center', gap:'15px', cursor:'pointer', background:'rgba(255,255,255,0.03)', padding:'8px 15px', borderRadius:'15px' },
  avatar: { width:'40px', height:'40px', borderRadius:'50%', background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', objectFit:'cover' },
  smallAvatar: { width:'30px', height:'30px', borderRadius:'50%', background:'#0a0f1d', objectFit:'cover', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' },
  avatarLarge: { width:'100px', height:'100px', borderRadius:'50%', background:'#0a0f1d', margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  fullImg: { width:'100%', height:'100%', objectFit:'cover' },
  mainGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px' },
  card: { background:'#161d2f', padding:'25px', borderRadius:'25px' },
  cardHeader: { display:'flex', gap:'10px', alignItems:'center', marginBottom:'20px' },
  historyItem: { display:'flex', padding:'15px', background:'rgba(255,255,255,0.02)', borderRadius:'15px', marginBottom:'10px', alignItems:'center' },
  dateText: { color:'#6366f1', fontWeight:'bold', width:'60px', fontSize:'13px' },
  leagueItem: { display:'flex', alignItems:'center', gap:'15px', padding:'12px', background:'rgba(255,255,255,0.02)', borderRadius:'15px', marginBottom:'10px' },
  rankCircle: { width:'24px', height:'24px', background:'#0a0f1d', borderRadius:'50%', textAlign:'center', fontSize:'11px', lineHeight:'24px' },
  fabContainer: { position:'fixed', bottom:'30px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'15px' },
  fab: { padding:'15px 25px', borderRadius:'20px', color:'#fff', border:'none', cursor:'pointer', display:'flex', gap:'10px', fontWeight:'bold' },
  modalOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 },
  profileModal: { background:'#161d2f', padding:'35px', borderRadius:'30px', width:'350px', textAlign:'center' },
  modalContent: { background:'#161d2f', padding:'30px', borderRadius:'25px', width:'350px' },
  modalHeader: { display:'flex', justifyContent:'space-between', marginBottom:'20px' },
  input: { width:'100%', padding:'14px', borderRadius:'12px', background:'#0a0f1d', color:'#fff', border:'1px solid #1e293b', marginBottom:'15px', boxSizing:'border-box' },
  mainBtn: { width:'100%', padding:'16px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'15px', fontWeight:'bold', cursor:'pointer' },
  textBtn: { background:'none', border:'none', color:'#94a3b8', cursor:'pointer' },
  authCard: { maxWidth:'350px', margin:'100px auto', background:'#161d2f', padding:'40px', borderRadius:'30px', textAlign:'center' }
};

export default Dashboard;
