import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Calendar, Heart, Sparkles, Trash2, X, Trophy, User, Target, Zap, Wind, LogOut, Settings, Camera } from 'lucide-react';

const EXERCISES = {
  strength: { 'Bench Press': 'Chest', 'Squat': 'Legs', 'Deadlift': 'Back', 'Overhead Press': 'Shoulders', 'Rows': 'Back', 'Bicep Curls': 'Arms' },
  cardio: { 'Running': 'Cardio', 'Stair Climbing': 'Cardio', 'Cycling': 'Cardio', 'Swimming': 'Cardio' },
  stretch: { 'Yoga': 'Flexibility', 'Mobility Work': 'Flexibility' }
};

const WORKOUT_CONFIGS = {
  strength: {
    fields: ['sets', 'reps', 'weight'],
    labels: { sets: 'SETS', reps: 'REPS', weight: 'KG' },
    placeholders: { sets: 'Sets', reps: 'Reps', weight: 'Weight (kg)' }
  },
  cardio: {
    fields: ['minutes', 'distance'],
    labels: { minutes: 'MINUTES', distance: 'DISTANCE' },
    placeholders: { minutes: 'Minutes', distance: 'Distance (km)' }
  },
  stretch: {
    fields: ['minutes'],
    labels: { minutes: 'MINUTES' },
    placeholders: { minutes: 'Minutes' }
  }
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [allData, setAllData] = useState({ workouts: [], workoutLogs: [], users: [] });
  const [isLogging, setIsLogging] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [workoutType, setWorkoutType] = useState('strength');
  const [selectedEx, setSelectedEx] = useState('Bench Press');
  const [formData, setFormData] = useState({ sets: '', reps: '', weight: '', minutes: '', distance: '' });
  const [profileForm, setProfileForm] = useState({ displayName: '', profilePic: '' });
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
      console.log('Database response:', data);
      console.log('WorkoutLogs sample:', data.workoutLogs?.[0]);
      
      setAllData({
        workouts: data.workouts || [],
        workoutLogs: data.workoutLogs || [],
        users: data.users || []
      });
    } catch (e) {
      console.error('Load data error:', e);
      setError('Failed to load workout data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('fitnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setProfileForm({
        displayName: userData.display_name || userData.email.split('@')[0],
        profilePic: userData.profile_pic || ''
      });
    }
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  useEffect(() => {
    setFormData({ sets: '', reps: '', weight: '', minutes: '', distance: '' });
    const firstExercise = Object.keys(EXERCISES[workoutType])[0];
    setSelectedEx(firstExercise);
  }, [workoutType]);

  const finishWorkout = async () => {
    const config = WORKOUT_CONFIGS[workoutType];
    const requiredFields = config.fields;
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      alert(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let exerciseData = {
        exercise_name: selectedEx,
        muscle_group: EXERCISES[workoutType][selectedEx] || 'Other',
        workout_type: workoutType
      };

      if (workoutType === 'strength') {
        exerciseData.sets = Number(formData.sets);
        exerciseData.reps = Number(formData.reps);
        exerciseData.weight = Number(formData.weight);
      } else if (workoutType === 'cardio') {
        exerciseData.sets = 1;
        exerciseData.reps = Number(formData.minutes);
        exerciseData.weight = Number(formData.distance) || 0;
      } else if (workoutType === 'stretch') {
        exerciseData.sets = 1;
        exerciseData.reps = Number(formData.minutes);
        exerciseData.weight = 0;
      }

      console.log('Sending exercise data:', exerciseData);
      const payload = [exerciseData];
      
      const res = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, exercises: payload })
      });
      
      if (!res.ok) throw new Error('Failed to save workout');
      
      setIsLogging(false);
      setFormData({ sets: '', reps: '', weight: '', minutes: '', distance: '' });
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
      const userData = { 
        email: data.email,
        display_name: data.display_name || email.split('@')[0],
        profile_pic: data.profile_pic || ''
      };
      setUser(userData);
      localStorage.setItem('fitnessUser', JSON.stringify(userData));
      setProfileForm({
        displayName: userData.display_name,
        profilePic: userData.profile_pic
      });
      
    } catch (e) {
      console.error('Auth error', e);
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateProfile',
          email: user.email,
          displayName: profileForm.displayName,
          profilePic: profileForm.profilePic
        })
      });
      
      if (!res.ok) throw new Error('Failed to update profile');
      
      const updatedUser = {
        ...user,
        display_name: profileForm.displayName,
        profile_pic: profileForm.profilePic
      };
      setUser(updatedUser);
      localStorage.setItem('fitnessUser', JSON.stringify(updatedUser));
      setShowProfile(false);
      await loadData();
      
    } catch (e) {
      console.error('Update profile error:', e);
      setError('Failed to update profile');
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
      console.error('Delete error', e);
      setError('Failed to delete workout');
    } finally {
      setLoading(false);
    }
  };

  const stats = (() => {
    if (!user || !allData?.workoutLogs) {
      return { myLogs: [], muscleSplit: {}, pbs: {}, league: [], profile: null };
    }

    const myLogs = allData.workoutLogs.filter(log => log.user_email === user.email) || [];
    const muscleSplit = { Chest: 0, Legs: 0, Back: 0, Shoulders: 0, Arms: 0, Cardio: 0, Flexibility: 0 };
    const pbs = {};

    myLogs.forEach(log => {
      const exerciseName = log.exercise_name || log.ex_name || 'Unknown';
      const muscleGroup = log.muscle_group || 'Other';
      
      if (muscleGroup) {
        muscleSplit[muscleGroup] = (muscleSplit[muscleGroup] || 0) + 1;
      }
      
      const weight = log.weight || log.ex_weight || 0;
      if (weight > 0 && muscleGroup !== 'Cardio' && muscleGroup !== 'Flexibility') {
        if (weight > (pbs[exerciseName] || 0)) {
          pbs[exerciseName] = weight;
        }
      }
    });

    const league = Object.entries((allData.workoutLogs || []).reduce((acc, log) => {
      acc[log.user_email] = (acc[log.user_email] || 0) + 1;
      return acc;
    }, {})).map(([email, count]) => {
      const u = allData.users?.find(usr => usr.email === email);
      return { name: u?.display_name || email.split('@')[0], count };
    }).sort((a,b) => b.count - a.count);

    const profile = {
      totalWorkouts: myLogs.length,
      thisWeek: myLogs.filter(log => {
        const logDate = new Date(log.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return logDate >= weekAgo;
      }).length,
      favoriteExercise: myLogs.reduce((acc, log) => {
        const exercise = log.exercise_name || log.ex_name || 'Unknown';
        acc[exercise] = (acc[exercise] || 0) + 1;
        return acc;
      }, {}),
      totalWeight: myLogs.reduce((sum, log) => sum + (log.weight || log.ex_weight || 0), 0)
    };

    return { myLogs, muscleSplit, pbs, league, profile };
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
        <div style={{display:'flex', gap:'10px'}}>
          <button 
            onClick={() => setShowProfile(true)} 
            style={styles.profileBtn}
            disabled={loading}
          >
            <Settings size={16} /> Profile
          </button>
          <button 
            onClick={() => {setUser(null); localStorage.removeItem('fitnessUser');}} 
            style={styles.logoutBtn}
            disabled={loading}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}
      {loading && <div style={styles.loadingBanner}>Loading...</div>}

      <div style={styles.profileSection}>
        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <User size={24} color="#6366f1" />
            <h2>Profile Details</h2>
          </div>
          <div style={styles.profileStats}>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{stats.profile.totalWorkouts}</div>
              <div style={styles.statLabel}>Total Workouts</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{stats.profile.thisWeek}</div>
              <div style={styles.statLabel}>This Week</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{Object.keys(stats.profile.favoriteExercise).length}</div>
              <div style={styles.statLabel}>Exercises</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{Math.round(stats.profile.totalWeight)}kg</div>
              <div style={styles.statLabel}>Total Weight</div>
            </div>
          </div>
          {Object.keys(stats.profile.favoriteExercise).length > 0 && (
            <div style={styles.favoriteExercise}>
              <strong>Favorite:</strong> {Object.entries(stats.profile.favoriteExercise).sort((a,b) => b[1] - a[1])[0][0]}
            </div>
          )}
        </div>
      </div>

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
              stats.myLogs.map((log, i) => {
                const exerciseName = log.exercise_name || log.ex_name || 'Unknown Exercise';
                const muscleGroup = log.muscle_group || 'Other';
                const weight = log.weight || log.ex_weight || 0;
                const sets = log.sets || log.ex_sets || 0;
                const reps = log.reps || log.ex_reps || 0;
                
                return (
                  <div key={i} style={styles.historyItem}>
                    <span style={styles.dateText}>
                      {new Date(log.created_at).toLocaleDateString(undefined, {day:'numeric', month:'short'})}
                    </span>
                    <span style={{flex:1, fontWeight:'600'}}>
                      {exerciseName}
                    </span>
                    <div style={{textAlign:'right', marginRight:'15px'}}>
                      {muscleGroup === 'Cardio' ? (
                        <>
                          <div style={{fontWeight:'bold', color:'#ec4899'}}>{reps} min</div>
                          {weight > 0 && <div style={{fontSize:'10px', color:'#94a3b8'}}>{weight} km</div>}
                        </>
                      ) : muscleGroup === 'Flexibility' ? (
                        <div style={{fontWeight:'bold', color:'#10b981'}}>{reps} min</div>
                      ) : (
                        <>
                          <div style={{fontWeight:'bold', color:'#6366f1'}}>{weight}kg</div>
                          <div style={{fontSize:'10px', color:'#94a3b8'}}>{sets} x {reps}</div>
                        </>
                      )}
                    </div>
                    <Trash2 
                      size={16} 
                      color="#ef4444" 
                      style={{cursor:'pointer', opacity: loading ? 0.5 : 1}} 
                      onClick={() => deleteWorkout(log.id)}
                    />
                  </div>
                );
              })
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
                  {WORKOUT_CONFIGS[workoutType].fields.map(field => (
                    <div key={field}>
                      <label style={styles.label}>
                        {WORKOUT_CONFIGS[workoutType].labels[field]}
                      </label>
                      <input 
                        style={styles.input} 
                        type="number" 
                        value={formData[field]} 
                        onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))} 
                        placeholder={WORKOUT_CONFIGS[workoutType].placeholders[field]}
                        disabled={loading}
                      />
                    </div>
                  ))}
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

      {showProfile && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>Edit Profile</h3>
              <X onClick={() => setShowProfile(false)} style={{cursor:'pointer'}}/>
            </div>
            <div style={{textAlign:'center', marginBottom:'20px'}}>
              <div style={styles.avatarCircle}>
                {profileForm.profilePic ? (
                  <img src={profileForm.profilePic} alt="Profile" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                ) : (
                  <User size={40} color="#6366f1" />
                )}
              </div>
            </div>
            <label style={styles.label}>Display Name</label>
            <input 
              style={styles.input}
              value={profileForm.displayName}
              onChange={e => setProfileForm(prev => ({...prev, displayName: e.target.value}))}
              placeholder="Display Name"
              disabled={loading}
            />
            <label style={styles.label}>Profile Picture URL</label>
            <input 
              style={styles.input}
              value={profileForm.profilePic}
              onChange={e => setProfileForm(prev => ({...prev, profilePic: e.target.value}))}
              placeholder="https://example.com/avatar.jpg"
              disabled={loading}
            />
            <button 
              style={styles.mainBtn}
              onClick={updateProfile}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#0a0f1d', color: '#f8fafc', padding: '40px', fontFamily: 'sans-serif' },
  header: { display:'flex', justifyContent:'space-between', marginBottom:'40px', alignItems:'center' },
  brandTitle: { color:'#6366f1', margin:0, fontWeight:'900', fontSize:'28px' },
  
  // Profile Section Styles
  profileSection: { marginBottom: '25px' },
  profileCard: { background:'#161d2f', padding:'30px', borderRadius:'24px', border:'1px solid rgba(255,255,255,0.05)' },
  profileHeader: { display:'flex', gap:'15px', alignItems:'center', marginBottom:'25px' },
  profileStats: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'20px', marginBottom:'20px' },
  statItem: { textAlign:'center', padding:'15px', background:'rgba(255,255,255,0.03)', borderRadius:'12px' },
  statValue: { fontSize:'24px', fontWeight:'bold', color:'#6366f1', marginBottom:'5px' },
  statLabel: { fontSize:'11px', color:'#94a3b8', textTransform:'uppercase' },
  favoriteExercise: { textAlign:'center', color:'#94a3b8', fontSize:'14px', marginTop:'10px' },
  
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
  authCard: { maxWidth:'400px', margin:'100px auto', background:'#161d2f', padding:'50px', borderRadius:'40px', textAlign:'center' },
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

export default Dashboard;
