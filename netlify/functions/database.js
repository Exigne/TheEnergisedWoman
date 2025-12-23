import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);

export const handler = async (event) => {
  const headers = { 
    'Access-Control-Allow-Origin': '*', 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // GET requests - Fetch user data
    if (event.httpMethod === 'GET') {
      const { user } = event.queryStringParameters || {};
      
      if (!user) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'User email required' }) };
      }

      const workouts = await sql`
        SELECT w.id, w.created_at, 
               json_agg(
                 json_build_object(
                   'exercise_name', wl.exercise_name,
                   'group', wl.muscle_group,
                   'sets', wl.sets,
                   'reps', wl.reps,
                   'weight', wl.weight
                 )
               ) as exercises
        FROM workouts w
        LEFT JOIN workout_logs wl ON w.id = wl.workout_id
        WHERE w.user_email = ${user}
        GROUP BY w.id, w.created_at
        ORDER BY w.created_at DESC
      `;

      return { statusCode: 200, headers, body: JSON.stringify({ workouts }) };
    }

    // POST requests
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);

      // Authentication Handler
      if (body.action === 'auth') {
        const { email, password, isRegistering } = body;
        if (!email || !password) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email and password required' }) };
        }

        if (isRegistering) {
          const hashedPassword = await bcrypt.hash(password, 10);
          const newUser = await sql`
            INSERT INTO users (email, password) 
            VALUES (${email}, ${hashedPassword}) 
            ON CONFLICT (email) DO NOTHING 
            RETURNING email
          `;
          if (newUser.length === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'User already exists' }) };
          }
          return { statusCode: 201, headers, body: JSON.stringify({ email: newUser[0].email }) };
        } else {
          const foundUser = await sql`SELECT email, password FROM users WHERE email = ${email}`;
          if (foundUser.length === 0 || !(await bcrypt.compare(password, foundUser[0].password))) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
          }
          return { statusCode: 200, headers, body: JSON.stringify({ email: foundUser[0].email }) };
        }
      }

      // Workout Creation Handler (FIXED KEYS)
      if (body.exercises && Array.isArray(body.exercises)) {
        const { userEmail, exercises } = body;

        if (!userEmail) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'User email required' }) };
        }

        const userExists = await sql`SELECT email FROM users WHERE email = ${userEmail}`;
        if (userExists.length === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
        }

        const workout = await sql`
          INSERT INTO workouts (user_email) 
          VALUES (${userEmail}) 
          RETURNING id
        `;
        
        const workoutId = workout[0].id;

        // FIXED: Mapping to match Dashboard.jsx keys (exercise_name and group)
        const exerciseInserts = exercises.map(ex => 
          sql`
            INSERT INTO workout_logs (workout_id, exercise_name, muscle_group, sets, reps, weight)
            VALUES (
              ${workoutId}, 
              ${ex.exercise_name || 'Unknown'}, 
              ${ex.group || 'General'}, 
              ${parseInt(ex.sets) || 0}, 
              ${parseInt(ex.reps) || 0}, 
              ${parseFloat(ex.weight) || 0}
            )
          `
        );

        await Promise.all(exerciseInserts);

        return { 
          statusCode: 201, 
          headers, 
          body: JSON.stringify({ success: true, workoutId }) 
        };
      }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (e) {
    console.error('Database error:', e);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: 'Internal server error', details: e.message }) 
    };
  }
};
