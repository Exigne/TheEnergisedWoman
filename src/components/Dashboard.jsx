import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const ACTIVITY_CONFIG = {
  'Bench Press': { group: 'Chest', label1: 'Sets', label2: 'Reps', label3: 'kg' },
  'Squat': { group: 'Legs', label1: 'Sets', label2: 'Reps', label3: 'kg' },
  'Deadlift': { group: 'Back', label1: 'Sets', label2: 'Reps', label3: 'kg' },
  'Rows': { group: 'Back', label1: 'Sets', label2: 'Reps', label3: 'kg' },
  'Yoga (Vinyasa)': { group: 'Flexibility', label1: 'Session', label2: 'Min', label3: 'Flows' },
  'Running (Distance)': { group: 'Cardio', label1: 'Laps', label2: 'Min', label3: 'km' },
  'Swimming': { group: 'Full Body', label1: 'Laps', label2: 'Min', label3: 'm' },
  'Pilates': { group: 'Core', label1: 'Sets', label2: 'Min', label3: 'Intensity' }
};

const Dashboard = ({ currentUser, onLogout }) => {
  const [workouts, setWorkouts] = useState([]);
  const [exercise, setExercise] = useState('Bench Press');
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');
  const [val3, setVal3] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      // Fetching from your Netlify function which now queries Neon
      const res = await fetch(`/.netlify/functions/database?userEmail=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Fetch error", e); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Get the muscle group from our config to save to the DB
    const muscleGroup = ACTIVITY_CONFIG[exercise].group;

    try {
      await fetch('/.netlify/functions/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          exercise: exercise,
          muscle_group: muscleGroup,
          sets: parseFloat(val1) || 0,
          reps: parseFloat(val2) || 0,
          weight: parseFloat(val3) || 0
        })
      });
      setVal1(''); setVal2(''); setVal3('');
      loadData();
    } catch (err) { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  // ... (Keep your existing volumeData, donutData, and return JSX logic)
  // Note: Your donutData will now use w.muscle_group directly from the Neon DB
