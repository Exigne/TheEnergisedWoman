import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  const sql = neon(process.env.DATABASE_URL);
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const workouts = await sql`SELECT * FROM workouts ORDER BY created_at DESC`;
      const users = await sql`SELECT email, display_name, profile_pic FROM users`;
      
      // PRE-PARSING: We fix the "Workout" name issue here before sending to UI
      const cleanedWorkouts = workouts.map(w => {
        let parsed = w.exercises;
        if (typeof w.exercises === 'string') {
          try { parsed = JSON.parse(w.exercises); } catch (e) { parsed = []; }
        }
        // Ensure it's always an array for the frontend .map()
        const finalEx = Array.isArray(parsed) ? parsed : [parsed];
        return { ...w, exercises: finalEx };
      });

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ workouts: cleanedWorkouts, users }),
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');

      // AUTH logic
      if (body.action === 'auth') {
        const results = await sql`SELECT * FROM users WHERE email = ${body.email}`;
        if (results.length === 0) {
          await sql`INSERT INTO users (email, password, display_name) VALUES (${body.email}, ${body.password}, ${body.email.split('@')[0]})`;
          return { statusCode: 200, body: JSON.stringify({ email: body.email }) };
        }
        return { statusCode: 200, body: JSON.stringify(results[0]) };
      }

      // SAVING logic
      if (body.userEmail && body.exercises) {
        // We stringify the payload and cast to jsonb to satisfy Neon
        const jsonPayload = JSON.stringify(body.exercises);
        await sql`INSERT INTO workouts (user_email, exercises, created_at) VALUES (${body.userEmail}, ${jsonPayload}::jsonb, NOW())`;
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      }
    }

    if (method === 'DELETE') {
      const { workoutId } = event.queryStringParameters;
      await sql`DELETE FROM workouts WHERE id = ${workoutId}`;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }
  } catch (err) {
    console.error("Backend Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
