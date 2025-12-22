import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export const handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  
  try {
    const { user } = event.queryStringParameters || {};

    if (event.httpMethod === 'GET') {
      // Get session summaries
      const data = await sql`
        SELECT w.*, 
               COUNT(l.id) as exercise_count, 
               SUM(l.weight * l.reps * l.sets) as total_volume
        FROM workouts w
        LEFT JOIN workout_logs l ON w.id = l.workout_id
        WHERE w.user_email = ${user}
        GROUP BY w.id
        ORDER BY w.created_at DESC
      `;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
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
