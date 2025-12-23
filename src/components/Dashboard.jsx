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

const FitnessDashboard = () => {
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false);
  const [workoutType, setWorkoutType] = useState(null);
  const [currentExercises, setCurrentExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user from localStorage
  useEffect(() => {
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
  }, []);

  // Load workouts when user is available
  useEffect(() => {
    if (user?.email) {
      loadWorkouts();
    }
  }, [user]);

  // Set default exercise when workout type changes
  useEffect(() => {
    if (workoutType && EXERCISES[workoutType]) {
      const exercises = Object.keys(EXERCISES[workoutType]);
      if (exercises.length > 0) {
        setSelectedExercise(exercises[0]);
      }
    }
  }, [workoutType]);

  const loadWorkouts = useCallback(async () => {
    if (!user?.email) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const res = await fetch(`/.netlify/functions/database?user=${encodeURIComponent(user.email)}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
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
    setError(null);
    
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

  const finishWorkout = async () => {
    if (!user?.email || currentExercises.length === 0) return;
    
    setLoading(true);
    setError(null);
    
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
        // Reset workout state
        setCurrentExercises([]);
        setIsLoggingWorkout(false);
        setWorkoutType(null);
        
        // Reload workouts
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
      return { totalSessions: 0, totalVolume: 0, last7Days: [] };
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

    return { totalSessions, totalVolume, last7Days };
  }, [workouts]);

  const handleLogout = () => {
    setUser(null);
    setWorkouts([]);
    localStorage.removeItem('fitnessUser');
  };

  // Show loading state
  if (loading && !user) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication form
  if (!user) {
    return (
      <div style={styles.container}>
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
            {error && <div style={styles.errorMessage}>{error}</div>}
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
      </div>
    );
  }

  const stats = calculateStats();
  const avgVolume = stats.totalSessions > 0 ? Math.round(stats.totalVolume / stats.totalSessions) : 0;
  const maxVolume = Math.max(...stats.last7Days.map(d => d.volume), 1);

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
        <button onClick={handleLogout} style={styles.logoutBtn}>
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
            <div style={styles.statValue}>{stats.last7Days.length}</div>
            <div style={styles.statLabel}>This Week</div>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>📊 Weekly Progress</h3>
          </div>
          <div style={styles.chartContainer}>
            {stats.last7Days.length > 0 ? (
              stats.last7Days.map((day, i) => (
                <div key={i} style={styles.barWrapper}>
                  <div style={styles.barContainer}>
                    <div 
                      style={{
                        ...styles.bar,
                        height: `${(day.volume / maxVolume) * 100}%`,
                        background: `linear-gradient(to top, ${['#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'][i % 7]}, ${['#be185d', '#d97706', '#059669', '#1d4ed8', '#6366f1', '#dc2626', '#0891b2'][i % 7]})`
                      }}
                    >
                      <span style={styles.barValue}>{Math.round(day.volume)}</span>
                    </div>
                  </div>
                  <div style={styles.barLabel}>{day.date.toLocaleDateString('en-US', { weekday: 'short' })[0]}</div>
                </div>
              ))
            ) : (
              <div style={styles.noDataMessage}>No workout data available</div>
            )}
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
                
                return (
                  <div key={workout.id || i} style={styles.sessionItem}>
                    <div style={styles.sessionIcon}>
                      <Calendar size={16} color="#6366f1" />
                    </div>
                    <div style={styles.sessionInfo}>
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
                  <input 
                    type="number" 
                    value={sets} 
                    onChange={e => setSets(e.target.value)} 
                    style={styles.input}
                    min="1"
                    placeholder="0"
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Reps</label>
                  <input 
                    type="number" 
                    value={reps} 
                    onChange={e => setReps(e.target.value)} 
                    style={styles.input}
                    min="1"
                    placeholder="0"
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Weight (kg)</label>
                  <input 
                    type="number" 
                    value={weight} 
                    onChange={e => setWeight(e.target.value)} 
                    style={styles.input} 
                    step="0.5"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
            ) : (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Duration (minutes)</label>
                <input 
                  type="number" 
                  value={duration} 
                  onChange={e => setDuration(e.target.value)} 
                  style={styles.input}
                  min="1"
                  placeholder="0"
                />
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
      )}
    </div>
  );
};

// Add these new styles to your existing styles object
const additionalStyles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '20px'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255, 255, 255, 0.1)',
    borderLeft: '4px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
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
  errorMessage: {
    color: '#ef4444',
    fontSize: '14px'
  },
  closeError: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0'
  },
  noDataMessage: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px',
    padding: '20px'
  }
};

// Merge with existing styles
const styles = {
  ...styles,
  ...additionalStyles
};

export default FitnessDashboard;
