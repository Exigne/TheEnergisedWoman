const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { action } = data;

    // === AUTHENTICATION ===
    if (action === 'auth' || event.path.includes('auth')) {
      const { email, password, isRegistering } = data;
      
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
          `SELECT email, display_name, is_admin, bio 
           FROM users 
           WHERE email = $1 AND password_hash = $2`,
          [email.toLowerCase().trim(), password]
        );
        
        if (result.rows.length === 0) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid email or password' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows[0])
        };
      }
    }

    // === GET ALL DISCUSSIONS ===
    if (event.httpMethod === 'GET' && !event.queryStringParameters?.id) {
      const result = await pool.query(
        `SELECT * FROM discussions 
         ORDER BY is_pinned DESC, created_at DESC`
      );
      
      // Parse JSONB comments for each row
      const discussions = result.rows.map(row => ({
        ...row,
        comments: row.comments || [],
        likedBy: row.liked_by || []
      }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(discussions)
      };
    }

    // === CREATE DISCUSSION ===
    if (event.httpMethod === 'POST' && !data.id) {
      const { author, authorId, title, content, category } = data;
      
      const result = await pool.query(
        `INSERT INTO discussions (author, author_id, title, content, category, likes, liked_by, comments, created_at) 
         VALUES ($1, $2, $3, $4, $5, 0, $6, $7, NOW()) 
         RETURNING *`,
        [author, authorId, title, content, category, [], []]
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // === UPDATE DISCUSSION (likes/comments) ===
    if (event.httpMethod === 'PUT') {
      const id = event.queryStringParameters?.id || data.id;
      
      const result = await pool.query(
        `UPDATE discussions 
         SET likes = $1, liked_by = $2, comments = $3, title = $4, content = $5
         WHERE id = $6 
         RETURNING *`,
        [data.likes || 0, data.likedBy || [], JSON.stringify(data.comments || []), data.title, data.content, id]
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // === DELETE DISCUSSION ===
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
      body: JSON.stringify({ error: 'Unknown request' })
    };

  } catch (err) {
    console.error('DB Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
