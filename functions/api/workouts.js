const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
      },
      body: ''
    };
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    };

    // GET - Fetch workouts for a user
    if (event.httpMethod === 'GET') {
      const { user } = event.queryStringParameters || {};
      
      if (!user) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'User email required' })
        };
      }

      const workouts = await sql`
        SELECT * FROM workouts 
        WHERE user_email = ${user} 
        ORDER BY created_at DESC
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(workouts)
      };
    }

    // POST - Create a new workout
    if (event.httpMethod === 'POST') {
      const { userEmail, exercise, sets, reps, weight } = JSON.parse(event.body);

      const result = await sql`
        INSERT INTO workouts (user_email, exercise, sets, reps, weight, created_at)
        VALUES (${userEmail}, ${exercise}, ${sets}, ${reps}, ${weight}, NOW())
        RETURNING *
      `;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result[0])
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Workouts function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
