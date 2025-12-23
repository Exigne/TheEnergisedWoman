import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  const sql = neon(process.env.DATABASE_URL);
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const workouts = await sql`SELECT * FROM workouts ORDER BY created_at DESC`;
      const users = await sql`SELECT email, display_name, profile_pic FROM users`;
      
      // Ensure exercises are parsed if they come back as strings
      const parsedWorkouts = workouts.map(w => ({
        ...w,
        exercises: typeof w.exercises === 'string' ? JSON.parse(w.exercises) : w.exercises
      }));

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workouts: parsedWorkouts, users }),
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');

      if (body.action === 'auth') {
        const { email, password } = body;
        const users = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (users.length === 0) {
          await sql`INSERT INTO users (email, password, display_name) VALUES (${email}, ${password}, ${email.split('@')[0]})`;
          return { statusCode: 200, body: JSON.stringify({ email }) };
        }
        return { statusCode: 200, body: JSON.stringify(users[0]) };
      }

      if (body.action === 'update_profile') {
        await sql`UPDATE users SET display_name = ${body.displayName}, profile_pic = ${body.profilePic} WHERE email = ${body.email}`;
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      }

      // SAVING WORKOUT: Explicitly casting to JSONB
      if (body.userEmail && body.exercises) {
        const exercisesJson = JSON.stringify(body.exercises);
        await sql`INSERT INTO workouts (user_email, exercises) VALUES (${body.userEmail}, ${exercisesJson}::jsonb)`;
        return { statusCode: 200, body: JSON.stringify({ message: "Saved" }) };
      }
    }
    
    if (method === 'DELETE') {
      await sql`DELETE FROM workouts WHERE id = ${event.queryStringParameters.workoutId}`;
      return { statusCode: 200, body: JSON.stringify({ message: "Deleted" }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
