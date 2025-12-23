import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  const sql = neon(process.env.DATABASE_URL);
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const data = await sql`SELECT * FROM workouts ORDER BY created_at DESC`;
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workouts: data }),
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');

      if (body.action === 'auth') {
        const { email, password, isRegistering } = body;
        const users = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (isRegistering) {
          if (users.length > 0) return { statusCode: 400, body: JSON.stringify({ error: 'User exists' }) };
          await sql`INSERT INTO users (email, password) VALUES (${email}, ${password})`;
          return { statusCode: 200, body: JSON.stringify({ email }) };
        } else {
          if (users.length === 0 || users[0].password !== password) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Invalid login' }) };
          }
          return { statusCode: 200, body: JSON.stringify({ email: users[0].email }) };
        }
      }

      if (body.userEmail && body.exercises) {
        // Fix: Save as a flattened JSON string to ensure data structure is consistent
        await sql`
          INSERT INTO workouts (user_email, exercises, created_at) 
          VALUES (${body.userEmail}, ${JSON.stringify(body.exercises)}, NOW())
        `;
        return { statusCode: 200, body: JSON.stringify({ message: "Saved" }) };
      }
    }

    if (method === 'DELETE') {
      const id = event.queryStringParameters.workoutId;
      await sql`DELETE FROM workouts WHERE id = ${id}`;
      return { statusCode: 200, body: JSON.stringify({ message: "Deleted" }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
