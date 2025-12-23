import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  const sql = neon(process.env.DATABASE_URL);
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const workouts = await sql`SELECT * FROM workouts ORDER BY created_at DESC`;
      const users = await sql`SELECT email, display_name, profile_pic FROM users`;
      
      // THE FIX: Manually cleaning the data before it leaves the server
      const formattedWorkouts = workouts.map(w => {
        let rawEx = w.exercises;
        // If Neon sent a string, turn it into an object
        if (typeof rawEx === 'string') {
          try { rawEx = JSON.parse(rawEx); } catch (e) { rawEx = []; }
        }
        // Ensure it's an array
        const exArray = Array.isArray(rawEx) ? rawEx : [rawEx];
        
        // Pick the first exercise and flatten it so the UI doesn't have to guess
        const first = exArray[0] || {};
        return {
          id: w.id,
          user_email: w.user_email,
          created_at: w.created_at,
          ex_name: first.exercise_name || first.name || "Workout",
          ex_weight: first.weight || 0,
          ex_sets: first.sets || 0,
          ex_reps: first.reps || 0
        };
      });

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workouts: formattedWorkouts, users }),
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');

      if (body.action === 'auth') {
        const results = await sql`SELECT * FROM users WHERE email = ${body.email}`;
        if (results.length === 0) {
          await sql`INSERT INTO users (email, password, display_name) VALUES (${body.email}, ${body.password}, ${body.email.split('@')[0]})`;
          return { statusCode: 200, body: JSON.stringify({ email: body.email }) };
        }
        return { statusCode: 200, body: JSON.stringify(results[0]) };
      }

      if (body.userEmail && body.exercises) {
        // Force the save as a clean stringified JSON
        await sql`INSERT INTO workouts (user_email, exercises, created_at) VALUES (${body.userEmail}, ${JSON.stringify(body.exercises)}::jsonb, NOW())`;
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      }
    }

    if (method === 'DELETE') {
      await sql`DELETE FROM workouts WHERE id = ${event.queryStringParameters.workoutId}`;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
