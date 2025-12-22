import React, { useState, useEffect } from 'react';

const Dashboard = ({ currentUser, onLogout }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/.netlify/functions/workouts?user=${encodeURIComponent(currentUser.email)}`);
      if (!response.ok) throw new Error('Failed to load workouts');
      const data = await response.json();
      setWorkouts(data || []);
    } catch (err) {
      console.error('Error loading workouts:', err);
      setError('Failed to load workout history');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkout = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/.netlify/functions/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          exercise: exercise.trim(),
          sets: parseInt(sets) || 0,
          reps: parseInt(reps) || 0,
          weight: parseFloat(weight) || 0
        })
      });

      if (!response.ok) throw new Error('Failed to save workout');

      setExercise('');
      setSets('');
      setReps('');
      setWeight('');
      await loadWorkouts();
      
    } catch (err) {
      console.error('Error saving workout:', err);
      setError('Failed to save workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#fafafa',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '2rem', 
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              color: '#111827', 
              margin: 0, 
              marginBottom: '0.25rem',
              fontSize: '1.875rem',
              fontWeight: '700',
              letterSpacing: '-0.025em'
            }}>
              FitFiddle
            </h1>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
              {currentUser?.email}
            </p>
          </div>
          <button 
            onClick={onLogout} 
            style={{ 
              background: 'white',
              color: '#6b7280', 
              border: '1px solid #e5e7eb', 
              padding: '0.625rem 1.25rem', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f9fafb';
              e.target.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            Sign out
          </button>
        </div>

        {/* Log Workout Section */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '2rem', 
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ 
            color: '#111827', 
            marginBottom: '1.5rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            letterSpacing: '-0.015em'
          }}>
            Log Exercise
          </h2>
          
          {error && (
            <div style={{ 
              background: '#fef2f2', 
              color: '#991b1b', 
              padding: '0.875rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              border: '1px solid #fee2e2'
            }}>
              {error}
            </div>
          )}

          <div>
            <input
              type="text"
              placeholder="Exercise name"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '0.9375rem',
                marginBottom: '1rem',
                background: '#fafafa',
                color: '#111827',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#9ca3af';
              }}
              onBlur={(e) => {
                e.target.style.background = '#fafafa';
                e.target.style.borderColor = '#e5e7eb';
              }}
            />

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.875rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{ 
                  fontSize: '0.8125rem', 
                  fontWeight: '500', 
                  color: '#6b7280', 
                  marginBottom: '0.5rem',
                  display: 'block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em'
                }}>
                  Sets
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '0.9375rem',
                    textAlign: 'center',
                    background: '#fafafa',
                    color: '#111827',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#9ca3af';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = '#fafafa';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  fontSize: '0.8125rem', 
                  fontWeight: '500', 
                  color: '#6b7280', 
                  marginBottom: '0.5rem',
                  display: 'block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em'
                }}>
                  Reps
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '0.9375rem',
                    textAlign: 'center',
                    background: '#fafafa',
                    color: '#111827',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#9ca3af';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = '#fafafa';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  fontSize: '0.8125rem', 
                  fontWeight: '500', 
                  color: '#6b7280', 
                  marginBottom: '0.5rem',
                  display: 'block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em'
                }}>
                  Weight
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="0"
                  step="0.5"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '0.9375rem',
                    textAlign: 'center',
                    background: '#fafafa',
                    color: '#111827',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#9ca3af';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = '#fafafa';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleSaveWorkout}
              disabled={saving || !exercise || !sets || !reps || !weight}
              style={{
                width: '100%',
                background: (saving || !exercise || !sets || !reps || !weight) ? '#f3f4f6' : '#111827',
                color: (saving || !exercise || !sets || !reps || !weight) ? '#9ca3af' : 'white',
                border: 'none',
                padding: '0.875rem 1.5rem',
                borderRadius: '10px',
                fontSize: '0.9375rem',
                fontWeight: '500',
                cursor: (saving || !exercise || !sets || !reps || !weight) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!saving && exercise && sets && reps && weight) {
                  e.target.style.background = '#1f2937';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving && exercise && sets && reps && weight) {
                  e.target.style.background = '#111827';
                }
              }}
            >
              {saving ? 'Saving...' : 'Save Exercise'}
            </button>
          </div>
        </div>

        {/* Workout History */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem' 
          }}>
            <h2 style={{ 
              color: '#111827', 
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: '600',
              letterSpacing: '-0.015em'
            }}>
              History
            </h2>
            <span style={{ 
              color: '#9ca3af', 
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {workouts.length} {workouts.length === 1 ? 'exercise' : 'exercises'}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #f3f4f6',
                borderTop: '3px solid #9ca3af',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }}></div>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>Loading...</p>
            </div>
          ) : workouts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              color: '#9ca3af', 
              fontSize: '0.875rem' 
            }}>
              <svg style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p style={{ margin: 0 }}>No exercises logged yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {workouts.map((workout, index) => (
                <div
                  key={workout.id || index}
                  style={{
                    background: '#fafafa',
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.borderColor = '#f3f4f6';
                  }}
                >
                  <div>
                    <div style={{ 
                      fontSize: '0.9375rem', 
                      fontWeight: '600', 
                      color: '#111827',
                      textTransform: 'capitalize',
                      marginBottom: '0.375rem'
                    }}>
                      {workout.exercise}
                    </div>
                    <div style={{ 
                      color: '#6b7280', 
                      fontSize: '0.8125rem',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center'
                    }}>
                      <span>{workout.sets} × {workout.reps}</span>
                      <span style={{ color: '#d1d5db' }}>•</span>
                      <span>{new Date(workout.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}</span>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '700', 
                      color: '#111827',
                      letterSpacing: '-0.025em'
                    }}>
                      {workout.weight}
                      <span style={{ 
                        fontSize: '0.875rem', 
                        color: '#9ca3af', 
                        marginLeft: '0.25rem',
                        fontWeight: '500'
                      }}>
                        kg
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input::placeholder {
          color: #d1d5db;
        }
        
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
