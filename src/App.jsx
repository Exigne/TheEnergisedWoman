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
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import './App.css';

// Modern theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

// --- MODERN AUTH COMPONENT ---
const ModernAuthForm = ({ isLogin, onSuccess, onSwitch }) => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, use localStorage (we'll replace with real DB calls)
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      if (isLogin) {
        const user = users.find(u => u.email === formData.email && u.password === formData.password);
        if (!user) throw new Error('Invalid credentials');
        localStorage.setItem('currentUser', JSON.stringify({ id: user.id, email: user.email }));
      } else {
        if (users.find(u => u.email === formData.email)) {
          throw new Error('Email already exists');
        }
        const newUser = {
          id: Date.now().toString(),
          email: formData.email,
          password: formData.password, // In production, hash this!
          createdAt: new Date().toISOString(),
          level: 1,
          experience: 0,
          streak: 0
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify({ id: newUser.id, email: newUser.email }));
      }
      
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={10} sx={{ p: 4, width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <FitnessCenter sx={{ fontSize: 60, color: 'white', mb: 2 }} />
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
            {isLogin ? 'Welcome Back' : 'Join FitFiddle'}
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Musical Fitness App
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            type="email"
            label="Email"
            variant="filled"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            sx={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 1 }}
          />
          <TextField
            fullWidth
            type="password"
            label="Password"
            variant="filled"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            sx={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 1 }}
          />
          {!isLogin && (
            <TextField
              fullWidth
              type="password"
              label="Confirm Password"
              variant="filled"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
              sx={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 1 }}
            />
          )}
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ 
              mt: 2, 
              py: 1.5, 
              backgroundColor: 'white', 
              color: '#667eea',
              fontWeight: 600,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' }
            }}
          >
            {loading ? <CircularProgress size={24} /> : (isLogin ? 'Login' : 'Register')}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </Typography>
          <Button onClick={onSwitch} sx={{ color: 'white', fontWeight: 600 }}>
            {isLogin ? 'Register' : 'Login'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

// --- MODERN DASHBOARD ---
const ModernDashboard = () => {
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    exercise: '',
    sets: 3,
    reps: 10,
    weight: 0
  });

  // Load user data
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      const userWorkouts = JSON.parse(localStorage.getItem('workouts') || '[]')
        .filter(w => w.userId === JSON.parse(storedUser).id);
      setWorkouts(userWorkouts);
    }
  }, []);

  // Rest Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerActive && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => prev - 1);
      }, 1000);
    } else if (restTimer === 0 && isTimerActive) {
      setIsTimerActive(false);
      // Play musical notification
      playMusicalNotification();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, restTimer]);

  const playMusicalNotification = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (musical chord)
    
    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + index * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.5);
      
      oscillator.start(audioContext.currentTime + index * 0.1);
      oscillator.stop(audioContext.currentTime + index * 0.1 + 0.5);
    });
  };

  const startRestTimer = (minutes) => {
    setRestTimer(minutes * 60);
    setIsTimerActive(true);
  };

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
    
    // Start rest timer
    startRestTimer(2);
  };

  const getWorkoutStats = () => {
    const totalWorkouts = workouts.length;
    const thisWeek = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return workoutDate >= weekAgo;
    }).length;
    
    const totalVolume = workouts.reduce((sum, w) => sum + (w.weight * w.sets * w.reps), 0);
    const avgVolume = totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0;
    
    return { totalWorkouts, thisWeek, totalVolume, avgVolume };
  };

  const stats = getWorkoutStats();

  const getVolumeChartData = () => {
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayWorkouts = workouts.filter(w => 
        new Date(w.date).toDateString() === date.toDateString()
      );
      const volume = dayWorkouts.reduce((sum, w) => sum + (w.weight * w.sets * w.reps), 0);
      return { date: format(date, 'MMM dd'), volume };
    });

    return {
      labels: last7Days.map(d => d.date),
      datasets: [{
        label: 'Daily Volume (lbs)',
        data: last7Days.map(d => d.volume),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  };

  const getMuscleGroupData = () => {
    const muscleGroups = {};
    workouts.forEach(w => {
      const group = w.exercise.includes('Press') ? 'Chest' : 
                   w.exercise.includes('Curl') ? 'Biceps' :
                   w.exercise.includes('Squat') ? 'Legs' : 'Back';
      muscleGroups[group] = (muscleGroups[group] || 0) + 1;
    });

    return {
      labels: Object.keys(muscleGroups),
      datasets: [{
        data: Object.values(muscleGroups),
        backgroundColor: ['#667eea', '#764ba2', '#f50057', '#ff9800'],
        borderWidth: 0
      }]
    };
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.reload();
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" elevation={0} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Toolbar>
            <FitnessCenter sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              FitFiddle Dashboard
            </Typography>
            <Typography variant="body2" sx={{ mr: 2, color: 'rgba(255,255,255,0.8)' }}>
              Welcome, {user?.email}
            </Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <ExitToApp />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {/* Rest Timer Card */}
          <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #f6e05e 0%, #f6ad55 100%)' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#744210' }}>
                🎵 Rest Timer 🎵
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#744210', my: 2 }}>
                {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                {[1, 2, 3].map(min => (
                  <Button
                    key={min}
                    variant="outlined"
                    onClick={() => startRestTimer(min)}
                    disabled={isTimerActive}
                    sx={{ borderColor: '#744210', color: '#744210' }}
                  >
                    {min} min
                  </Button>
                ))}
                <Button
                  variant="contained"
                  onClick={() => setIsTimerActive(false)}
                  sx={{ backgroundColor: '#744210' }}
                >
                  Stop
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              { title: 'Total Workouts', value: stats.totalWorkouts, icon: <FitnessCenter /> },
              { title: 'This Week', value: stats.thisWeek, icon: <TrendingUp /> },
              { title: 'Total Volume', value: `${stats.totalVolume} lbs`, icon: <BarChart /> },
              { title: 'Avg Volume', value: `${stats.avgVolume} lbs`, icon: <History /> }
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card elevation={3} sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ color: '#667eea', mb: 1 }}>{stat.icon}</Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#667eea' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {stat.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Tabs for Different Views */}
          <Paper elevation={3} sx={{ mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              indicatorColor="primary"
              textColor="primary"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Log Workout" icon={<AddCircle />} iconPosition="start" />
              <Tab label="Progress Charts" icon={<BarChart />} iconPosition="start" />
              <Tab label="Workout History" icon={<History />} iconPosition="start" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Log New Workout</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Exercise"
                        value={newWorkout.exercise}
                        onChange={(e) => setNewWorkout({...newWorkout, exercise: e.target.value})}
                        helperText="Select from exercise library"
                      >
                        <MenuItem value="">Select Exercise</MenuItem>
                        {['Bench Press', 'Squats', 'Deadlifts', 'Pull-ups', 'Shoulder Press', 'Bicep Curls'].map(exercise => (
                          <MenuItem key={exercise} value={exercise}>{exercise}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Sets"
                        value={newWorkout.sets}
                        onChange={(e) => setNewWorkout({...newWorkout, sets: parseInt(e.target.value) || 1})}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Reps"
                        value={newWorkout.reps}
                        onChange={(e) => setNewWorkout({...newWorkout, reps: parseInt(e.target.value) || 1})}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Weight (lbs)"
                        value={newWorkout.weight}
                        onChange={(e) => setNewWorkout({...newWorkout, weight: parseInt(e.target.value) || 0})}
                      />
                    </Grid>
                  </Grid>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={addWorkout}
                    sx={{ mt: 3, py: 1.5 }}
                    startIcon={<AddCircle />}
                  >
                    Log Workout
                  </Button>
                </Box>
              )}

              {tabValue === 1 && (
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Volume Progress</Typography>
                        <Line data={getVolumeChartData()} options={{ responsive: true }} />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Muscle Group Distribution</Typography>
                        <Doughnut data={getMuscleGroupData()} options={{ responsive: true }} />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Workout History</Typography>
                  {workouts.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No workouts logged yet. Start by logging your first workout!
                    </Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {workouts.slice().reverse().map((workout) => (
                        <Grid item xs={12} md={6} key={workout.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" sx={{ color: '#667eea' }}>
                                {workout.exercise}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {format(new Date(workout.date), 'MMM dd, yyyy')}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2">
                                  {workout.sets} sets × {workout.reps} reps
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {workout.weight} lbs
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

// --- UPDATED MAIN APP ---
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
    <>
      {isAuthenticated ? (
        <ModernDashboard />
      ) : (
        <ModernAuthForm 
          isLogin={isLogin} 
          onSuccess={handleAuthSuccess}
          onSwitch={isLogin ? switchToRegister : switchToLogin}
        />
      )}
    </>
  );
}

export default App;
