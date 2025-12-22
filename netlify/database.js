// Use standard pg library instead of @netlify/neon
const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? {
    rejectUnauthorized: false
  } : false
});

exports.handler = async (event, context) => {
  const { httpMethod, body, queryStringParameters } = event;
  
  try {
    switch (httpMethod) {
      case 'GET':
        if (queryStringParameters?.action === 'getUser') {
          const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [queryStringParameters.email]
          );
          return {
            statusCode: 200,
            body: JSON.stringify(result.rows[0] || null)
          };
        }
        break;
        
      case 'POST':
        const data = JSON.parse(body);
        
        if (data.action === 'createUser') {
          const result = await pool.query(
            `INSERT INTO users (email, password, created_at, level, experience, streak)
             VALUES ($1, $2, NOW(), 1, 0, 0)
             RETURNING id, email`,
            [data.email, data.password]
          );
          return {
            statusCode: 201,
            body: JSON.stringify(result.rows[0])
          };
        }
        
        if (data.action === 'addWorkout') {
          const result = await pool.query(
            `INSERT INTO workouts (user_id, exercise, sets, reps, weight, date)
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING *`,
            [data.userId, data.exercise, data.sets, data.reps, data.weight]
          );
          return {
            statusCode: 201,
            body: JSON.stringify(result.rows[0])
          };
        }
        
        if (data.action === 'getWorkouts') {
          const result = await pool.query(
            'SELECT * FROM workouts WHERE user_id = $1 ORDER BY date DESC',
            [data.userId]
          );
          return {
            statusCode: 200,
            body: JSON.stringify(result.rows)
          };
        }
        break;
    }
    
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request' })
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database operation failed' })
    };
  }
};
