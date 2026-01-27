const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const type = event.queryStringParameters?.type;
    const id = event.queryStringParameters?.id;

    // --- AUTHENTICATION ---
    if (data.action === 'auth') {
      const { email, password, isRegistering } = data;
      const cleanEmail = email.toLowerCase().trim();
      
      if (isRegistering) {
        const result = await pool.query(
          `INSERT INTO users (email, password_hash, display_name, created_at) 
           VALUES ($1, $2, $3, NOW()) 
           ON CONFLICT (email) DO UPDATE SET password_hash = $2
           RETURNING email, display_name, is_admin`,
          [cleanEmail, password, email.split('@')[0]]
        );
        return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
      } else {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
        if (result.rows.length === 0 || result.rows[0].password_hash !== password) {
          return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
        }
        const user = result.rows[0];
        delete user.password_hash;
        return { statusCode: 200, headers, body: JSON.stringify(user) };
      }
    }

    // --- GET DATA ---
    if (event.httpMethod === 'GET') {
      let query = 'SELECT * FROM discussions ORDER BY created_at DESC';
      if (type === 'resources') query = 'SELECT * FROM resources ORDER BY created_at DESC';
      if (type === 'audio') query = 'SELECT * FROM audio ORDER BY created_at DESC';
      
      const result = await pool.query(query);
      return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
    }

    // --- POST DATA (Add New) ---
    if (event.httpMethod === 'POST') {
      if (type === 'resource') {
        const { title, type: resType, url, author } = data;
        const res = await pool.query(
          `INSERT INTO resources (title, type, url, author, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
          [title, resType, url, author || 'Admin']
        );
        return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
      } 
      
      if (type === 'audio') {
        const { title, url, description } = data;
        const res = await pool.query(
          `INSERT INTO audio (title, url, description, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *`,
          [title, url, description]
        );
        return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
      }

      // Default: Create Discussion
      const { author, authorId, title, content, category } = data;
      const res = await pool.query(
        `INSERT INTO discussions (author, author_id, title, content, category, likes, liked_by, comments, created_at) 
         VALUES ($1, $2, $3, $4, $5, 0, '{}', '[]', NOW()) RETURNING *`,
        [author, authorId, title, content, category]
      );
      return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
    }

    // --- PUT DATA (Update Likes/Comments) ---
    if (event.httpMethod === 'PUT' && type === 'discussion') {
      const res = await pool.query(
        `UPDATE discussions SET likes = $1, liked_by = $2, comments = $3 WHERE id = $4 RETURNING *`,
        [data.likes || 0, data.likedBy || [], JSON.stringify(data.comments || []), id]
      );
      return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
    }

    // --- DELETE DATA ---
    if (event.httpMethod === 'DELETE') {
      let table = 'discussions';
      if (type === 'resource') table = 'resources';
      if (type === 'audio') table = 'audio';
      
      await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Action not handled' }) };

  } catch (err) {
    console.error('Database Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
