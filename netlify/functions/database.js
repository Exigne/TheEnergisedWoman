import { neon } from '@neondatabase/serverless';

// Add CORS headers helper
const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json'
});

export const handler = async (event) => {
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: ''
    };
  }

  const sql = neon(process.env.DATABASE_URL);
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const workouts = await sql`SELECT * FROM workouts ORDER BY created_at DESC`;
      const users = await sql`SELECT email, display_name, profile_pic FROM users`;
      
      // Fixed data cleaning logic
      const formattedWorkouts = workouts.map(w => {
        let rawEx = w.exercises;
        
        // Handle different data formats
        if (typeof rawEx === 'string') {
          try { 
            rawEx = JSON.parse(rawEx); 
          } catch (e) { 
            rawEx = []; 
          }
        }
        
        // Ensure it's an array
        const exArray = Array.isArray(rawEx) ? rawEx : [rawEx];
        
        // Get first exercise safely
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
        headers: getCorsHeaders(),
        body: JSON.stringify({ workouts: formattedWorkouts, users }),
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');

      // Validate required fields
      if (!body.email && !body.userEmail) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(),
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      if (body.action === 'auth') {
        // Validate auth fields
        if (!body.email || !body.password) {
          return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({ error: 'Email and password required' })
          };
        }

        const results = await sql`SELECT * FROM users WHERE email = ${body.email}`;
        
        if (results.length === 0) {
          await sql`INSERT INTO users (email, password, display_name) VALUES (${body.email}, ${body.password}, ${body.email.split('@')[0]})`;
        }
        
        return {
          statusCode: 200,
          headers: getCorsHeaders(),
          body: JSON.stringify(results[0] || { email: body.email })
        };
      }

      if (body.userEmail && body.exercises) {
        // Validate exercises format
        if (!Array.isArray(body.exercises)) {
          return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({ error: 'Exercises must be an array' })
          };
        }

        await sql`INSERT INTO workouts (user_email, exercises, created_at) VALUES (${body.userEmail}, ${JSON.stringify(body.exercises)}::jsonb, NOW())`;
        
        return {
          statusCode: 200,
          headers: getCorsHeaders(),
          body: JSON.stringify({ success: true })
        };
      }

      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({ error: 'Invalid request format' })
      };
    }

    if (method === 'DELETE') {
      const workoutId = event.queryStringParameters?.workoutId;
      
      // Validate workoutId
      if (!workoutId || isNaN(parseInt(workoutId))) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(),
          body: JSON.stringify({ error: 'Valid workoutId required' })
        };
      }

      await sql`DELETE FROM workouts WHERE id = ${parseInt(workoutId)}`;
      
      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 405,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (err) {
    console.error('Function error:', err);
    
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      })
    };
  }
};
