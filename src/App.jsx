import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  AppBar, Toolbar, Typography, Container, Paper, Button, 
  TextField, Card, CardContent, Grid, Box, Tabs, Tab,
  CircularProgress, Alert, IconButton, MenuItem
} from '@mui/material';
import { 
  FitnessCenter, Timer, TrendingUp, ExitToApp, 
  AddCircle, History, BarChart, MusicNote
} from '@mui/icons-material';
import { Line, Doughnut } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import './App.css';

// Modern theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

// Simple auth component
const AuthForm = ({ isLogin, onSuccess, onSwitch }) => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

// In your AuthForm component, update handleSubmit:
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (!isLogin && formData.password !== formData.confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  try {
    if (isLogin) {
      // LOGIN - check database
      const user = await databaseAPI.getUser(formData.email, formData.password);
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify({ id: user.id, email: user.email }));
        onSuccess();
      } else {
        setError('Invalid credentials');
      }
    } else {
      // REGISTER - create in database
      const newUser = await databaseAPI.createUser(formData.email, formData.password);
      localStorage.setItem('currentUser', JSON.stringify({ id: newUser.id, email: newUser.email }));
      onSuccess();
    }
  } catch (err) {
    setError(err.message || 'Database connection failed');
  }
};

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', padding: '3rem', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
                   textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <h2 style={{ color: '#4a5568', marginBottom: '0.5rem' }}>{isLogin ? 'Login to FitFiddle' : 'Join FitFiddle'}</h2>
        <p style={{ color: '#718096', marginBottom: '2rem' }}>Musical Fitness App</p>
        
        {error && <div style={{ background: '#fed7d7', color: '#c53030', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            style={{ padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            style={{ padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }}
          />
          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
              style={{ padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }}
            />
          )}
          <button type="submit" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', border: 'none', padding: '1rem', borderRadius: '12px',
            fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer'
          }}>
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', color: '#718096' }}>
          {isLogin ? (
            <p>Don't have an account? <button onClick={onSwitch} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontWeight: '600' }}>Register</button></p>
          ) : (
            <p>Already have an account? <button onClick={onSwitch} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontWeight: '600' }}>Login</button></p>
          )}
        </div>
      </div>
    </div>
  );
};

// Modern Dashboard
const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [newWorkout, setNewWorkout] = useState({
    exercise: '',
    sets: 3,
    reps: 10,
    weight: 0
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      const userWorkouts = JSON.parse(localStorage.getItem('workouts') || '[]')
        .filter(w => w.userId === JSON.parse(storedUser).id);
      setWorkouts(userWorkouts);
    }
  }, []);

  const addWorkout = () => {
    if (!newWorkout.exercise || newWorkout.weight <= 0) {
      alert('Please fill in all fields');
      return;
    }

    const workout = {
      id: Date.now().toString(),
      userId: user.id,
      ...newWorkout,
      date: new Date().toISOString()
    };

    const updatedWorkouts = [...workouts, workout];
    localStorage.setItem('workouts', JSON.stringify(updatedWorkouts));
    setWorkouts(updatedWorkouts);
    
    // Reset form
    setNewWorkout({ exercise: '', sets: 3, reps: 10, weight: 0 });
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.reload();
  };

  const getWorkoutStats = () => {
    const totalWorkouts = workouts.length;
    const thisWeek = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return workoutDate >= weekAgo;
    }).length;
    
    return { totalWorkouts, thisWeek };
  };

  const stats = getWorkoutStats();

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>FitFiddle Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {user?.email}</span>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>
      
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <h3>Total Workouts</h3>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: '#667eea', margin: 0 }}>{stats.totalWorkouts}</p>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <h3>This Week</h3>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: '#667eea', margin: 0 }}>{stats.thisWeek}</p>
          </div>
        </div>

        {/* Log Workout Section */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h3>Log New Workout</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <select 
              value={newWorkout.exercise}
              onChange={(e) => setNewWorkout({...newWorkout, exercise: e.target.value})}
              style={{ padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }}
            >
              <option value="">Select Exercise</option>
              <option value="Bench Press">Bench Press</option>
              <option value="Squats">Squats</option>
              <option value="Deadlifts">Deadlifts</option>
              <option value="Pull-ups">Pull-ups</option>
              <option value="Shoulder Press">Shoulder Press</option>
              <option value="Bicep Curls">Bicep Curls</option>
            </select>
            <input 
              type="number"
              placeholder="Sets"
              value={newWorkout.sets}
              onChange={(e) => setNewWorkout({...newWorkout, sets: parseInt(e.target.value) || 1})}
              style={{ padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }}
            />
            <input 
              type="number"
              placeholder="Reps"
              value={newWorkout.reps}
              onChange={(e) => setNewWorkout({...newWorkout, reps: parseInt(e.target.value) || 1})}
              style={{ padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }}
            />
            <input 
              type="number"
              placeholder="Weight (lbs)"
              value={newWorkout.weight}
              onChange={(e) => setNewWorkout({...newWorkout, weight: parseInt(e.target.value) || 0})}
              style={{ padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }}
            />
          </div>
          <button onClick={addWorkout} style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '12px',
            fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer'
          }}>
            Log Workout
          </button>
        </div>

        {/* Recent Workouts */}
        {workouts.length > 0 && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3>Recent Workouts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {workouts.slice(-5).reverse().map(workout => (
                <div key={workout.id} style={{ 
                  background: '#f7fafc', border: '2px solid #e2e8f0', borderRadius: '12px', 
                  padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                }}>
                  <div>
                    <h4 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>{workout.exercise}</h4>
                    <p style={{ color: '#718096', margin: 0 }}>{workout.sets} sets × {workout.reps} reps</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '800', color: '#667eea' }}>{workout.weight}</span>
                    <span style={{ fontSize: '1rem', color: '#a0aec0', marginLeft: '0.25rem' }}>lbs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    setIsAuthenticated(!!user);
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'register') {
      setIsLogin(false);
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const switchToRegister = () => {
    setIsLogin(false);
    window.history.pushState({}, '', '?view=register');
  };

  const switchToLogin = () => {
    setIsLogin(true);
    window.history.pushState({}, '', '?view=login');
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <AuthForm 
          isLogin={isLogin} 
          onSuccess={handleAuthSuccess}
          onSwitch={isLogin ? switchToRegister : switchToLogin}
        />
      )}
    </div>
  );
}

export default App;
