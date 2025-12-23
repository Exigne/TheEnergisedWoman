import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export const handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  
  try {
    const { user } = event.queryStringParameters || {};

if (event.httpMethod === 'POST') {
  const body = JSON.parse(event.body);

  // 1. Handle Authentication (Login/Register)
  if (body.action === 'auth') {
    const { email, password, isRegistering } = body;
    if (isRegistering) {
      const newUser = await sql`
        INSERT INTO users (email, password) VALUES (${email}, ${password}) 
        ON CONFLICT (email) DO NOTHING RETURNING email
      `;
      if (newUser.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'User exists' }) };
      return { statusCode: 201, headers, body: JSON.stringify({ email: newUser[0].email }) };
    } else {
      const foundUser = await sql`SELECT email FROM users WHERE email = ${email} AND password = ${password}`;
      if (foundUser.length === 0) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid login' }) };
      return { statusCode: 200, headers, body: JSON.stringify({ email: foundUser[0].email }) };
    }
  }

  // 2. Handle Workouts (ONLY if exercises exists and is an array)
  if (body.exercises && Array.isArray(body.exercises)) {
    const { userEmail, exercises } = body;

    const workout = await sql`
      INSERT INTO workouts (user_email) VALUES (${userEmail}) RETURNING id
    `;
    const workoutId = workout[0].id;

    for (const ex of exercises) {
      await sql`
        INSERT INTO workout_logs (workout_id, exercise_name, muscle_group, sets, reps, weight)
        VALUES (${workoutId}, ${ex.name}, ${ex.group}, ${ex.sets}, ${ex.reps}, ${ex.weight})
      `;
    }
    return { statusCode: 201, headers, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
}

    if (event.httpMethod === 'POST') {
      const { userEmail, exercises } = JSON.parse(event.body);

      // 1. Create Workout Session
      const workout = await sql`
        INSERT INTO workouts (user_email) VALUES (${userEmail}) RETURNING id
      `;
      const workoutId = workout[0].id;

      // 2. Insert all Exercises in that session
      for (const ex of exercises) {
        await sql`
          INSERT INTO workout_logs (workout_id, exercise_name, muscle_group, sets, reps, weight)
          VALUES (${workoutId}, ${ex.name}, ${ex.group}, ${ex.sets}, ${ex.reps}, ${ex.weight})
        `;
      }

      return { statusCode: 201, headers, body: JSON.stringify({ success: true }) };
    }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
