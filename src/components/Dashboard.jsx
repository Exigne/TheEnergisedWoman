// Dashboard.jsx - Updated with workout names and day streak
import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Dumbbell, TrendingUp, Calendar, Heart, Sparkles } from 'lucide-react';

// Move EXERCISES outside component to avoid re-declaration
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

// Separate component for authentication to avoid circular issues
const AuthForm = ({ email, setEmail, password, setPassword, isRegistering, setIsRegistering, handleAuth, loading }) => (
  <div style={styles.authCard}>
    <div style={styles.authHeader}>
      <div style={styles.logoContainer}>
        <Sparkles size={40} color="#6366f1" />
      </div>
      <h1 style={styles.authTitle}>Fit as a Fiddle</h1>
      <p style={styles.authSubtitle}>Your Personal Fitness Journey</p>
    </div>
    <div style={styles.authForm}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={styles.authInput}
        disabled={loading}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && !loading && handleAuth()}
        style={styles.authInput}
        disabled={loading}
      />
      <button onClick={handleAuth} style={styles.authButton} disabled={loading}>
        {loading ? 'Loading...' : (isRegistering ? 'Create Account' : 'Sign In')}
      </button>
      <button
        onClick={() => setIsRegistering(!isRegistering)}
        style={styles.toggleButton}
        disabled={loading}
      >
        {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
      </button>
    </div>
  </div>
);

// Separate workout panel component
const WorkoutPanel = ({ workoutType, setIsLoggingWorkout, setWorkoutType, currentExercises, setCurrentExercises, finishWorkout, loading }) => {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (workoutType && EXERCISES[workoutType]) {
      const exercises = Object.keys(EXERCISES[workoutType]);
      if (exercises.length > 0) {
        setSelectedExercise(exercises[0]);
      }
    }
  }, [workoutType]);

  const addExercise = () => {
    if (!workoutType || !selectedExercise) return;
    
    const exercises = EXERCISES[workoutType];
    const exerciseData = exercises[selectedExercise];
    
    if (!exerciseData) return;
    
    let newExercise;
    
    if (workoutType === 'cardio' || workoutType === 'stretch') {
      if (!duration || isNaN(duration) || parseInt(duration) <= 0) {
        alert('Please enter a valid duration (minutes)');
        return;
      }
      
      newExercise = {
        name: selectedExercise,
        sets: 1,
        reps: parseInt(duration),
        weight: 0,
        group: exerciseData.group,
        type: workoutType
      };
      
      setDuration('');
    } else {
      if (!sets || !reps || isNaN(sets) || isNaN(reps) || parseInt(sets) <= 0 || parseInt(reps) <= 0) {
        alert('Please enter valid sets and reps');
        return;
      }
      
      const weightValue = parseFloat(weight) || 0;
      
      newExercise = {
        name: selectedExercise,
        sets: parseInt(sets),
        reps: parseInt(reps),
        weight: weightValue,
        group: exerciseData.group,
        type: workoutType
      };
      
      setSets('');
      setReps('');
      setWeight('');
    }
    
    setCurrentExercises(prev => [...prev, newExercise]);
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
              <option key={name} value={name}>
                {EXERCISES[workoutType][name]?.icon} {name}
              </option>
            ))}
          </select>
        </div>
        
        {workoutType === 'strength' ? (
          <div style={styles.inputRow}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Sets</label>
              <input type="number" value={sets} onChange={e => setSets(e.target.value)} style={styles.input} min="1" placeholder="0" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Reps</label>
              <input type="number" value={reps} onChange={e => setReps(e.target.value)} style={styles.input} min="1" placeholder="0" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Weight (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={styles.input} step="0.5" min="0" placeholder="0" />
            </div>
          </div>
        ) : (
          <div style={styles.inputGroup}>
            <label style={styles.label}>Duration (minutes)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} style={styles.input} min="1" placeholder="0" />
          </div>
        )}
        
        <button onClick={addExercise} style={styles.addButton}>+ Add Exercise</button>
      </div>

      {currentExercises.length > 0 && (
        <div style={styles.exerciseList}>
          <h4 style={styles.listTitle}>Current Session</h4>
          {currentExercises.map((exercise, i) => (
            <div key={i} style={styles.exerciseItem}>
              <span>{EXERCISES[exercise.type]?.[exercise.name]?.icon} {exercise.name}</span>
              <span style={styles.exerciseDetails}>
                {exercise.type === 'strength' 
                  ? `${exercise.sets} × ${exercise.reps}${exercise.weight > 0 ? ` @ ${exercise.weight}kg` : ''}`
                  : `${exercise.reps} min`
                }
              </span>
            </div>
          ))}
          {workoutType === 'strength' && (
            <div style={styles.totalVolume}>
              Total: {currentExercises.reduce((sum, e) => sum + (e.sets * e.reps * e.weight), 0).toFixed(1)}kg
            </div>
          )}
          <button onClick={finishWorkout} disabled={loading} style={styles.finishButton}>
            {loading ? 'Saving...' : '✓ Finish Workout'}
          </button>
        </div>
      )}
    </div>
  );
};

// Main component with proper initialization order
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

  // Fixed useEffect with proper async handling
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = localStorage.getItem('fitnessUser');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser?.email) {
            setUser(parsedUser);
          }
        }
      } catch (err) {
        console.error('Failed to parse saved user data:', err);
        localStorage.removeItem('fitnessUser');
      }
    };
    
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.email) {
      loadWorkouts();
    }
  }, [user]);

  const loadWorkouts = useCallback(async () => {
    if (!user?.email) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(`/.netlify/functions/database?user=${encodeURIComponent(user.email)}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      setWorkouts(Array.isArray(data.workouts) ? data.workouts : []);
    } catch (err) {
      console.error('Failed to load workouts:', err);
      setError(err.message);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleAuth = async () => {
    if (!email?.trim() || !password?.trim()) {
      alert('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'auth', 
          email: email.trim(), 
          password, 
          isRegistering 
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data?.email) {
        const userData = { email: data.email };
        setUser(userData);
        localStorage.setItem('fitnessUser', JSON.stringify(userData));
        setEmail('');
        setPassword('');
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      alert('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = (type) => {
    if (!EXERCISES[type]) return;
    setWorkoutType(type);
    setIsLoggingWorkout(true);
    setCurrentExercises([]);
    setError(null);
  };

  const finishWorkout = async () => {
    if (!user?.email || currentExercises.length === 0) return;
    
    setLoading(true);
    
    try {
      const workoutData = {
        userEmail: user.email,
        exercises: currentExercises,
        created_at: new Date().toISOString(),
        type: workoutType
      };
      
      const res = await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData)
      });
      
      if (res.ok) {
        setCurrentExercises([]);
        setIsLoggingWorkout(false);
        setWorkoutType(null);
        await loadWorkouts();
      } else {
        throw new Error('Failed to save workout');
      }
    } catch (err) {
      console.error('Failed to save workout:', err);
      alert('Failed to save workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = useCallback(() => {
    if (!Array.isArray(workouts)) {
      return { totalSessions: 0, totalVolume: 0, last7Days: [], currentStreak: 0 };
    }
    
    const totalSessions = workouts.length;
    
    const totalVolume = workouts.reduce((sum, workout) => {
      if (!workout?.exercises || !Array.isArray(workout.exercises)) {
        return sum;
      }
      
      return sum + workout.exercises.reduce((exerciseSum, exercise) => {
        if (!exercise?.sets || !exercise?.reps) return exerciseSum;
        return exerciseSum + (exercise.sets * exercise.reps * (exercise.weight || 0));
      }, 0);
    }, 0);
    
    // Calculate current streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    const uniqueWorkoutDates = [...new Set(workouts.map(w => {
      const date = new Date(w.created_at);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    }))].sort((a, b) => b - a); // Sort descending

    for (let i = 0; i < uniqueWorkoutDates.length; i++) {
      const workoutDate = new Date(uniqueWorkoutDates[i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (workoutDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    const last7Days = workouts
      .slice(0, 7)
      .map(workout => {
        if (!workout?.created_at || !workout?.exercises) {
          return { date: new Date(), volume: 0, exercises: 0 };
        }
        
        const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
        const volume = exercises.reduce((sum, exercise) => {
          if (!exercise?.sets || !exercise?.reps) return sum;
          return sum + (exercise.sets * exercise.reps * (exercise.weight || 0));
        }, 0);
        
        return {
          date: new Date(workout.created_at),
          volume: volume,
          exercises: exercises.length
        };
      })
      .reverse();

    return { totalSessions, totalVolume, last7Days, currentStreak };
  }, [workouts]);

  if (!user) {
    return (
      <div style={styles.container}>
        <AuthForm 
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          isRegistering={isRegistering}
          setIsRegistering={setIsRegistering}
          handleAuth={handleAuth}
          loading={loading}
        />
      </div>
    );
  }

  const stats = calculateStats();
  const avgVolume = stats.totalSessions > 0 ? Math.round(stats.totalVolume / stats.totalSessions) : 0;

  // Helper function to get workout type name and icon
  const getWorkoutInfo = (workout) => {
    const type = workout.type || 'strength';
    const exercises = workout.exercises || [];
    
    if (exercises.length === 0) {
      return { name: 'Workout', icon: '💪', color: '#6366f1' };
    }
    
    // Get the first exercise to determine the workout type
    const firstExercise = exercises[0];
    const exerciseData = EXERCISES[type]?.[firstExercise.name];
    
    if (exerciseData) {
      return { 
        name: firstExercise.name, 
        icon: exerciseData.icon, 
        color: type === 'strength' ? '#6366f1' : type === 'cardio' ? '#ec4899' : '#10b981' 
      };
    }
    
    return { name: firstExercise.name, icon: '💪', color: '#6366f1' };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.brandContainer}>
            <Sparkles size={24} color="#6366f1" />
            <h1 style={styles.brandTitle}>Fit as a Fiddle</h1>
          </div>
          <p style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user.email.split('@')[0]}!</p>
          <p style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => { setUser(null); localStorage.removeItem('fitnessUser'); }} style={styles.logoutBtn}>
          Sign Out
        </button>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={styles.closeError}>✕</button>
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <Dumbbell size={24} color="#fff" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalSessions}</div>
            <div style={styles.statLabel}>Total Sessions</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>
            🔥
          </div>
          <div>
            <div style={styles.statValue}>{Math.round(stats.totalVolume)}kg</div>
            <div style={styles.statLabel}>Total Volume</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)'}}>
            <TrendingUp size={24} color="#fff" />
          </div>
          <div>
            <div style={styles.statValue}>{avgVolume}kg</div>
            <div style={styles.statLabel}>Avg Volume</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #10b981, #059669)'}}>
            <Activity size={24} color="#fff" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.currentStreak}</div>
            <div style={styles.statLabel}>Day Streak</div>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>🔥 Day Streak</h3>
          </div>
          <div style={styles.streakContainer}>
            <div style={styles.streakDisplay}>
              <div style={styles.streakNumber}>{stats.currentStreak}</div>
              <div style={styles.streakText}>days in a row!</div>
            </div>
            <div style={styles.streakMessage}>
              {stats.currentStreak === 0 
                ? "Start your fitness journey today!" 
                : stats.currentStreak < 7 
                ? "Great consistency! Keep it up!" 
                : stats.currentStreak < 30 
                ? "Amazing dedication! You're building a solid habit!" 
                : "Outstanding commitment! You're a fitness champion!"
              }
            </div>
            <div style={styles.streakBarContainer}>
              <div style={styles.streakBar}>
                {Array.from({ length: Math.min(stats.currentStreak, 30) }, (_, i) => (
                  <div 
                    key={i} 
                    style={{
                      ...styles.streakDay,
                      background: i < stats.currentStreak 
                        ? `linear-gradient(135deg, ${['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'][i % 5]}, ${['#4f46e5', '#be185d', '#059669', '#d97706', '#6366f1'][i % 5]})`
                        : 'rgba(255, 255, 255, 0.1)'
                    }}
                  />
                ))}
              </div>
              <div style={styles.streakLegend}>
                <span>Day 1</span>
                <span>Day 15</span>
                <span>Day 30</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>📅 Recent Sessions</h3>
          </div>
          <div style={styles.sessionList}>
            {workouts.length > 0 ? (
              workouts.slice(0, 4).map((workout, i) => {
                const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
                const volume = exercises.reduce((sum, exercise) => {
                  if (!exercise?.sets || !exercise?.reps) return sum;
                  return sum + (exercise.sets * exercise.reps * (exercise.weight || 0));
                }, 0);
                
                const workoutInfo = getWorkoutInfo(workout);
                
                return (
                  <div key={workout.id || i} style={styles.sessionItem}>
                    <div style={{...styles.sessionIcon, background: `linear-gradient(135deg, ${workoutInfo.color}, ${workoutInfo.color}80)`}}>
                      <span style={styles.workoutIcon}>{workoutInfo.icon}</span>
                    </div>
                    <div style={styles.sessionInfo}>
                      <div style={styles.sessionWorkoutName}>{workoutInfo.name}</div>
                      <div style={styles.sessionDate}>
                        {new Date(workout.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div style={styles.sessionExercises}>{exercises.length} exercises</div>
                    </div>
                    <div style={styles.sessionVolume}>{Math.round(volume)}kg</div>
                  </div>
                );
              })
            ) : (
              <div style={styles.noDataMessage}>No recent sessions</div>
            )}
          </div>
        </div>
      </div>

      {!isLoggingWorkout ? (
        <div style={styles.fabContainer}>
          <button onClick={() => startWorkout('strength')} style={{...styles.fabButton, background: 'linear-gradient(135deg, #6366f1, #4f46e5)'}}>
            <Dumbbell size={20} />
            <span style={{ marginLeft: '8px' }}>Strength</span>
          </button>
          <button onClick={() => startWorkout('cardio')} style={{...styles.fabButton, background: 'linear-gradient(135deg, #ec4899, #be185d)'}}>
            <Heart size={20} />
            <span style={{ marginLeft: '8px' }}>Cardio</span>
          </button>
          <button onClick={() => startWorkout('stretch')} style={{...styles.fabButton, background: 'linear-gradient(135deg, #10b981, #059669)'}}>
            <Activity size={20} />
            <span style={{ marginLeft: '8px' }}>Stretch</span>
          </button>
        </div>
      ) : (
        <WorkoutPanel
          workoutType={workoutType}
          setIsLoggingWorkout={setIsLoggingWorkout}
          setWorkoutType={setWorkoutType}
          currentExercises={currentExercises}
          setCurrentExercises={setCurrentExercises}
          finishWorkout={finishWorkout}
          loading={loading}
        />
      )}
    </div>
  );
};

// Define styles object
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    color: '#f8fafc',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  authCard: {
    maxWidth: '400px',
    margin: '80px auto',
    background: 'rgba(30, 27, 75, 0.8)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
  },
  authHeader: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  authTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  authSubtitle: {
    color: '#94a3b8',
    fontSize: '16px',
    margin: 0
  },
  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  authInput: {
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  authButton: {
    padding: '14px',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    color: '#6366f1',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'center',
    marginTop: '8px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px'
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  brandTitle: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  greeting: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '4px 0',
    color: '#f8fafc'
  },
  date: {
    color: '#94a3b8',
    fontSize: '14px',
    margin: 0
  },
  logoutBtn: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px'
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeError: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #ec4899, #be185d)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '100px'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '24px'
  },
  cardHeader: {
    marginBottom: '20px'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0
  },
  streakContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  },
  streakDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  streakNumber: {
    fontSize: '48px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  streakText: {
    fontSize: '18px',
    color: '#94a3b8',
    fontWeight: '600'
  },
  streakMessage: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  streakBarContainer: {
    width: '100%',
    marginTop: '20px'
  },
  streakBar: {
    display: 'flex',
    gap: '4px',
    marginBottom: '12px',
    padding: '0 8px'
  },
  streakDay: {
    flex: 1,
    height: '8px',
    borderRadius: '4px',
    minWidth: '0'
  },
  streakLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#94a3b8'
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  sessionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  sessionIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px'
  },
  workoutIcon: {
    fontSize: '20px'
  },
  sessionInfo: {
    flex: 1
  },
  sessionWorkoutName: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '2px',
    color: '#f8fafc'
  },
  sessionDate: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '2px'
  },
  sessionExercises: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  sessionVolume: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#6366f1'
  },
  noDataMessage: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px',
    padding: '20px'
  },
  fabContainer: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'flex-end'
  },
  fabButton: {
    padding: '14px 24px',
    border: 'none',
    borderRadius: '16px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.2s'
  },
  workoutPanel: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '400px',
    maxWidth: 'calc(100vw - 48px)',
    background: 'rgba(30, 27, 75, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
  },
  workoutHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  workoutTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: '#fff',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px'
  },
  inputGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  inputRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px'
  },
  label: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600'
  },
  select: {
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none'
  },
  input: {
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none'
  },
  addButton: {
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer'
  },
  exerciseList: {
    marginTop: '20px',
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '16px'
  },
  listTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '12px'
  },
  exerciseItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    fontSize: '14px'
  },
  exerciseDetails: {
    color: '#94a3b8'
  },
  totalVolume: {
    marginTop: '12px',
    padding: '12px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: '700',
    color: '#6366f1'
  },
  finishButton: {
    marginTop: '12px',
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer'
  },
  errorMessage: {
    color: '#ef4444',
    fontSize: '14px'
  }
};

export default Dashboard;
