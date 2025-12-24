import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Calendar, Heart, Sparkles, Trash2, X, Trophy, User, Target, Zap, Wind, LogOut, Settings, Plus, Edit3, Clock, ChevronDown } from 'lucide-react';

const EXERCISE_TYPES = ['strength', 'cardio', 'stretch'];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EXERCISES = {
  strength: { 'Bench Press': 'Chest', 'Squat': 'Legs', 'Deadlift': 'Back', 'Overhead Press': 'Shoulders', 'Rows': 'Back', 'Bicep Curls': 'Arms' },
  cardio: { 'Running': 'Cardio', 'Stair Climbing': 'Cardio', 'Cycling': 'Cardio', 'Swimming': 'Cardio', 'Walking': 'Cardio', 'HIIT': 'Cardio', 'Sport-Based': 'Cardio' },
  stretch: { 'Yoga': 'Flexibility', 'Calisthenics': 'Flexibility', 'Pilates': 'Flexibility', 'Tai Chi': 'Flexibility' }
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

const WorkoutPlanner = ({ userEmail, workoutLogs = [] }) => {
  const [weekPlan, setWeekPlan] = useState({
    Monday: { workout: false, exercises: [], type: 'strength' },
    Tuesday: { workout: false, exercises: [], type: 'strength' },
    Wednesday: { workout: false, exercises: [], type: 'strength' },
    Thursday: { workout: false, exercises: [], type: 'strength' },
    Friday: { workout: false, exercises: [], type: 'strength' },
    Saturday: { workout: false, exercises: [], type: 'strength' },
    Sunday: { workout: false, exercises: [], type: 'strength' }
  });

  const [availableExercises, setAvailableExercises] = useState({
    strength: [],
    cardio: [],
    stretch: []
  });

  const [selectedDay, setSelectedDay] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [exerciseDetails, setExerciseDetails] = useState({
    sets: '',
    reps: '',
    weight: '',
    minutes: '',
    distance: ''
  });

  // Extract unique exercises from workout history
  useEffect(() => {
    const exercises = {
      strength: new Set(),
      cardio: new Set(),
      stretch: new Set()
    };

    workoutLogs.forEach(log => {
      if (log.exercise_name) {
        const type = log.workout_type || 'strength';
        if (exercises[type]) {
          exercises[type].add(log.exercise_name);
        }
      }
    });

    setAvailableExercises({
      strength: Array.from(exercises.strength),
      cardio: Array.from(exercises.cardio),
      stretch: Array.from(exercises.stretch)
    });
  }, [workoutLogs]);

  const toggleWorkoutDay = (day) => {
    setWeekPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        workout: !prev[day].workout,
        exercises: prev[day].workout ? [] : prev[day].exercises
      }
    }));
  };

  const addExerciseToDay = (day) => {
    if (!selectedExercise) return;

    const exerciseConfig = WORKOUT_CONFIGS[weekPlan[day].type];
    const newExercise = {
      name: selectedExercise,
      type: weekPlan[day].type,
      ...exerciseDetails
    };

    setWeekPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        exercises: [...prev[day].exercises, newExercise]
      }
    }));

    // Reset form
    setSelectedExercise('');
    setExerciseDetails({
      sets: '',
      reps: '',
      weight: '',
      minutes: '',
      distance: ''
    });
    setShowExerciseModal(false);
  };

  const removeExercise = (day, exerciseIndex) => {
    setWeekPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        exercises: prev[day].exercises.filter((_, index) => index !== exerciseIndex)
      }
    }));
  };

  const saveWeekPlan = async () => {
    // Here you could save to database
    console.log('Saving week plan:', weekPlan);
    alert('Week plan saved successfully!');
  };

  return (
    <div style={styles.plannerContainer}>
      <div style={styles.plannerHeader}>
        <h2>Weekly Workout Planner</h2>
        <button style={styles.savePlanBtn} onClick={saveWeekPlan}>
          <Calendar size={16} /> Save Week Plan
        </button>
      </div>

      <div style={styles.weekGrid}>
        {DAYS_OF_WEEK.map(day => (
          <div key={day} style={styles.dayCard}>
            <div style={styles.dayHeader}>
              <h3>{day}</h3>
              <button 
                style={{
                  ...styles.workoutToggle,
                  background: weekPlan[day].workout ? '#6366f1' : '#1e293b'
                }}
                onClick={() => toggleWorkoutDay(day)}
              >
                {weekPlan[day].workout ? 'Workout Day' : 'Rest Day'}
              </button>
            </div>

            {weekPlan[day].workout && (
              <div style={styles.workoutContent}>
                <select 
                  style={styles.typeSelect}
                  value={weekPlan[day].type}
                  onChange={(e) => setWeekPlan(prev => ({
                    ...prev,
                    [day]: { ...prev[day], type: e.target.value }
                  }))}
                >
                  {EXERCISE_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>

                <div style={styles.exercisesList}>
                  {weekPlan[day].exercises.map((exercise, index) => (
                    <div key={index} style={styles.exerciseItem}>
                      <span>{exercise.name}</span>
                      <div style={styles.exerciseDetails}>
                        {exercise.type === 'strength' ? (
                          <>
                            {exercise.sets && <span>{exercise.sets} sets</span>}
                            {exercise.reps && <span>{exercise.reps} reps</span>}
                            {exercise.weight && <span>{exercise.weight}kg</span>}
                          </>
                        ) : exercise.type === 'cardio' ? (
                          <>
                            {exercise.minutes && <span>{exercise.minutes} min</span>}
                            {exercise.distance && <span>{exercise.distance} km</span>}
                          </>
                        ) : (
                          exercise.minutes && <span>{exercise.minutes} min</span>
                        )}
                      </div>
                      <button 
                        style={styles.removeExerciseBtn}
                        onClick={() => removeExercise(day, index)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  style={styles.addExerciseBtn}
                  onClick={() => {
                    setSelectedDay(day);
                    setShowExerciseModal(true);
                  }}
                >
                  <Plus size={14} /> Add Exercise
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showExerciseModal && selectedDay && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>Add Exercise to {selectedDay}</h3>
              <X onClick={() => setShowExerciseModal(false)} style={{cursor:'pointer'}}/>
            </div>

            <label style={styles.label}>Select Exercise</label>
            <select 
              style={styles.input}
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
            >
              <option value="">Choose an exercise...</option>
              {availableExercises[weekPlan[selectedDay].type].map(exercise => (
                <option key={exercise} value={exercise}>
                  {exercise}
                </option>
              ))}
            </select>

            {weekPlan[selectedDay].type === 'strength' && (
              <div style={styles.inputGrid}>
                <div>
                  <label style={styles.label}>Sets</label>
                  <input 
                    style={styles.input}
                    type="number"
                    value={exerciseDetails.sets}
                    onChange={(e) => setExerciseDetails(prev => ({...prev, sets: e.target.value}))}
                    placeholder="3"
                  />
                </div>
                <div>
                  <label style={styles.label}>Reps</label>
                  <input 
                    style={styles.input}
                    type="number"
                    value={exerciseDetails.reps}
                    onChange={(e) => setExerciseDetails(prev => ({...prev, reps: e.target.value}))}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label style={styles.label}>Weight (kg)</label>
                  <input 
                    style={styles.input}
                    type="number"
                    value={exerciseDetails.weight}
                    onChange={(e) => setExerciseDetails(prev => ({...prev, weight: e.target.value}))}
                    placeholder="20"
                  />
                </div>
              </div>
            )}

            {weekPlan[selectedDay].type === 'cardio' && (
              <>
                <label style={styles.label}>Minutes</label>
                <input 
                  style={styles.input}
                  type="number"
                  value={exerciseDetails.minutes}
                  onChange={(e) => setExerciseDetails(prev => ({...prev, minutes: e.target.value}))}
                  placeholder="30"
                />
                <label style={styles.label}>Distance (km)</label>
                <input 
                  style={styles.input}
                  type="number"
                  value={exerciseDetails.distance}
                  onChange={(e) => setExerciseDetails(prev => ({...prev, distance: e.target.value}))}
                  placeholder="5"
                />
              </>
            )}

            {weekPlan[selectedDay].type === 'stretch' && (
              <>
                <label style={styles.label}>Minutes</label>
                <input 
                  style={styles.input}
                  type="number"
                  value={exerciseDetails.minutes}
                  onChange={(e) => setExerciseDetails(prev => ({...prev, minutes: e.target.value}))}
                  placeholder="15"
                />
              </>
            )}

            <button 
              style={styles.mainBtn}
              onClick={() => addExerciseToDay(selectedDay)}
              disabled={!selectedExercise}
            >
              Add Exercise
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
  const [activeTab, setActiveTab] = useState('dashboard');

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('=== DASHBOARD LOAD DATA START ===');
      console.log('Fetching data for user:', user.email);
      
      const res = await fetch(`/.netlify/functions/database`);
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Raw data received:', data);
      console.log('WorkoutLogs received:', data.workoutLogs);
      console.log('WorkoutLogs length:', data.workoutLogs?.length);
      console.log('First workout log:', data.workoutLogs?.[0]);
      
      setAllData({
        workouts: data.workouts || [],
        workoutLogs: data.workoutLogs || [],
        users: data.users || []
      });
      
      console.log('=== DASHBOARD LOAD DATA END ===');
    } catch (e) {
      console.error('Load data error:', e);
      setError('Failed to load workout data: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('fitnessUser');
    if (saved) {
      const userData = JSON.parse(saved);
      console.log('Loaded user from localStorage:', userData);
      setUser(userData);
      setProfileForm({
        displayName: userData.display_name || userData.email.split('@')[0],
        profilePic: userData.profile_pic || ''
      });
    }
  }, []);

  useEffect(() => { 
    if (user) loadData(); 
  }, [user, loadData]);

  useEffect(() => {
    setFormData({ sets: '', reps: '', weight: '', minutes: '', distance: '' });
    const firstExercise = Object.keys(EXERCISES[workoutType])[0];
    setSelectedEx(firstExercise);
  }, [workoutType]);

  // Rest of your existing Dashboard component code (finishWorkout, handleAuth, updateProfile, etc.)
  // ... [Keep all your existing methods here]

  const stats = (() => {
    if (!user || !allData?.workoutLogs) {
      return { myLogs: [], muscleSplit: {}, pbs: {}, league: [], profile: { totalWorkouts: 0, thisWeek: 0, favoriteExercise: {}, totalWeight: 0 } };
    }

    const myLogs = allData.workoutLogs.filter(log => log.user_email === user.email) || [];
    const muscleSplit = { Chest: 0, Legs: 0, Back: 0, Shoulders: 0, Arms: 0, Cardio: 0, Flexibility: 0 };
    const pbs = {};

    myLogs.forEach(log => {
      const exerciseName = log.exercise_name || 'Unknown';
      const muscleGroup = log.muscle_group || 'Other';
      
      if (muscleGroup && muscleSplit.hasOwnProperty(muscleGroup)) {
        muscleSplit[muscleGroup] = (muscleSplit[muscleGroup] || 0) + 1;
      }
      
      const weight = log.weight || 0;
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
        const exercise = log.exercise_name || 'Unknown';
        acc[exercise] = (acc[exercise] || 0) + 1;
        return acc;
      }, {}),
      totalWeight: myLogs.reduce((sum, log) => sum + (log.weight || 0), 0)
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
          onKeyPress={e => e.key === 'Enter' && handleAuth()}
        />
        <input 
          style={styles.input} 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={e => setPassword(e.target.value)} 
          disabled={loading}
          onKeyPress={e => e.key === 'Enter' && handleAuth()}
        />
        <button 
          style={styles.mainBtn} 
          onClick={handleAuth}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Sign In / Register'}
        </button>
        <p style={{marginTop:'20px', color:'#94a3b8', fontSize:'13px'}}>
          Don't have an account? Just enter your email and password to create one!
        </p>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.brandTitle}>Fit as a Fiddle</h1>
        <div style={styles.tabContainer}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            style={{
              ...styles.tabButton,
              ...(activeTab === 'dashboard' ? styles.activeTab : {})
            }}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('planner')} 
            style={{
              ...styles.tabButton,
              ...(activeTab === 'planner' ? styles.activeTab : {})
            }}
          >
            Weekly Planner
          </button>
        </div>
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

      {activeTab === 'dashboard' ? (
        <>
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
                    const exerciseName = log.exercise_name || 'Unknown Exercise';
                    const muscleGroup = log.muscle_group || 'Other';
                    const weight = log.weight || 0;
                    const sets = log.sets || 0;
                    const reps = log.reps || 0;
                    
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
              onClick={() => {setWorkoutType('strength'); setIsLogging(true);}} 
              style={{...styles.fab, background:'#6366f1'}}
              disabled={loading}
            >
              <Dumbbell size={18}/> Strength
            </button>
            <button 
              onClick={() => {setWorkoutType('cardio'); setIsLogging(true);}} 
              style={{...styles.fab, background:'#ec4899'}}
              disabled={loading}
            >
              <Heart size={18}/> Cardio
            </button>
            <button 
              onClick={() => {setWorkoutType('stretch'); setIsLogging(true);}} 
              style={{...styles.fab, background:'#10b981'}}
              disabled={loading}
            >
              <Wind size={18}/> Stretch
            </button>
          </div>
        </>
      ) : (
        <WorkoutPlanner userEmail={user?.email} workoutLogs={allData.workoutLogs} />
      )}

      {/* Keep your existing modals for logging workouts and profile */}
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
              placeholder="https://example.com/avatar.jpg "
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

// Add these new styles to your existing styles object:
const newStyles = {
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  dayCard: {
    background: '#161d2f',
    padding: '25px',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.05)',
    minHeight: '200px'
  },
  dayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  workoutToggle: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease'
  },
  workoutContent: {
    marginTop: '15px'
  },
  typeSelect: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    background: '#0a0f1d',
    color: '#fff',
    border: '1px solid #1e293b',
    marginBottom: '15px'
  },
  exercisesList: {
    marginBottom: '15px'
  },
  exerciseItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  exerciseDetails: {
    display: 'flex',
    gap: '10px',
    fontSize: '12px',
    color: '#94a3b8'
  },
  removeExerciseBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '4px'
  },
  addExerciseBtn: {
    width: '100%',
    padding: '12px',
    background: 'rgba(99, 102, 241, 0.1)',
    color: '#6366f1',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  savePlanBtn: {
    background: '#6366f1',
    color: '#fff',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 'bold'
  }
};

// Merge new styles with existing styles
const styles = {
  ...existingStyles, // Your existing styles
  ...newStyles
};

export default Dashboard;
