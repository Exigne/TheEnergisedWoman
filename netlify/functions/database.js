const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { action, email, password, isRegistering } = data;

    // AUTHENTICATION
    if (action === 'auth') {
      if (isRegistering) {
        // Create new user
        const result = await pool.query(
          `INSERT INTO users (email, password_hash, display_name, created_at) 
           VALUES ($1, $2, $3, NOW()) 
           ON CONFLICT (email) DO UPDATE SET password_hash = $2
           RETURNING email, display_name, is_admin, bio`,
          [email.toLowerCase().trim(), password, email.split('@')[0]]
        );
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows[0])
        };
      } else {
        // Login
        const result = await pool.query(
          `SELECT email, display_name, is_admin, bio, password_hash 
           FROM users 
           WHERE email = $1`,
          [email.toLowerCase().trim()]
        );
        
        if (result.rows.length === 0) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'User not found' })
          };
        }
        
        const user = result.rows[0];
        
        if (user.password_hash !== password) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Wrong password' })
          };
        }
        
        delete user.password_hash; // Don't send password back
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(user)
        };
      }
    }

    // GET DISCUSSIONS
    if (event.httpMethod === 'GET') {
      const result = await pool.query(
        'SELECT * FROM discussions ORDER BY created_at DESC'
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }

    // CREATE POST
    if (event.httpMethod === 'POST') {
      const { author, authorId, title, content, category } = data;
      const result = await pool.query(
        `INSERT INTO discussions (author, author_id, title, content, category, likes, liked_by, comments, created_at) 
         VALUES ($1, $2, $3, $4, $5, 0, '{}', '[]', NOW()) 
         RETURNING *`,
        [author, authorId, title, content, category]
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // UPDATE (likes, comments)
    if (event.httpMethod === 'PUT') {
      const id = event.queryStringParameters?.id;
      const result = await pool.query(
        `UPDATE discussions 
         SET likes = $1, liked_by = $2, comments = $3
         WHERE id = $4 
         RETURNING *`,
        [data.likes || 0, data.likedBy || [], JSON.stringify(data.comments || []), id]
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // DELETE
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      await pool.query('DELETE FROM discussions WHERE id = $1', [id]);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Unknown action' })
    };

  } catch (err) {
    console.error('Database error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
