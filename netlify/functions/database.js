// Inside the POST handler
if (event.httpMethod === 'POST') {
  const { userEmail, workoutName, exercises } = body; // 'exercises' is now an array

  // 1. Create the Workout Header
  const workout = await sql`
    INSERT INTO workouts (user_email, workout_name)
    VALUES (${userEmail}, ${workoutName})
    RETURNING id
  `;
  
  const workoutId = workout[0].id;

  // 2. Insert all exercises for this workout in one go
  for (const ex of exercises) {
    const muscleGroup = MUSCLE_MAP[ex.name] || 'Other';
    await sql`
      INSERT INTO exercise_logs (workout_id, exercise_name, sets, reps, weight, muscle_group)
      VALUES (${workoutId}, ${ex.name}, ${ex.sets}, ${ex.reps}, ${ex.weight}, ${muscleGroup})
    `;
  }

  return { statusCode: 201, headers, body: JSON.stringify({ message: "Workout Saved" }) };
}
