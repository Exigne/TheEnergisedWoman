const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const { user, action } = event.queryStringParameters || {};

    // --- GET REQUESTS ---
    if (event.httpMethod === 'GET') {
      // Action: Fetch Global Leaderboard
      if (action === 'leaderboard') {
        const leaders = await sql`
          SELECT user_email, 
                 SUM(sets) as total_sets, 
                 SUM(weight * reps * sets) as total_volume
          FROM workouts 
          GROUP BY user_email 
          ORDER BY total_volume DESC 
          LIMIT 10
        `;
        return { statusCode: 200, headers, body: JSON.stringify(leaders) };
      }

      // Action: Fetch Personal History
      if (!user) return { statusCode: 400, headers, body: JSON.stringify({ error: 'User email required' }) };
      
      const history = await sql`
        SELECT * FROM workouts WHERE user_email = ${user} ORDER BY created_at DESC
      `;
      return { statusCode: 200, headers, body: JSON.stringify(history) };
    }

    // --- POST REQUESTS ---
    if (event.httpMethod === 'POST') {
      const { userEmail, exercise, sets, reps, weight } = JSON.parse(event.body);
      
      if (!userEmail || !exercise) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing data' }) };

      const result = await sql`
        INSERT INTO workouts (user_email, exercise, sets, reps, weight)
        VALUES (${userEmail}, ${exercise}, ${sets}, ${reps}, ${weight})
        RETURNING *
      `;
      return { statusCode: 201, headers, body: JSON.stringify(result[0]) };
    }

  } catch (error) {
    console.error('Database Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
