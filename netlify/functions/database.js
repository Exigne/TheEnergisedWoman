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

    // --- 1. AUTHENTICATION (Login & Register) ---
    if (type === 'register' && event.httpMethod === 'POST') {
      const { email, password } = data;
      const cleanEmail = email.toLowerCase().trim();
      
      // Check if user exists first to prevent duplicates
      const check = await pool.query('SELECT email FROM users WHERE email = $1', [cleanEmail]);
      if (check.rows.length > 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: 'User already exists' }) };
      }

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, display_name, created_at) 
         VALUES ($1, $2, $3, NOW()) 
         RETURNING email, display_name, is_admin`,
        [cleanEmail, password, cleanEmail.split('@')[0]]
      );
      return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (type === 'login' && event.httpMethod === 'POST') {
      const { email, password } = data;
      const cleanEmail = email.toLowerCase().trim();
      
      const result = await pool.query(
        `SELECT email, display_name, first_name as "firstName", last_name as "lastName", 
         profile_pic as "profilePic", is_admin as "isAdmin", password_hash 
         FROM users WHERE email = $1`, 
        [cleanEmail]
      );

      if (result.rows.length === 0 || result.rows[0].password_hash !== password) {
        return { statusCode: 401, headers, body: JSON.stringify({ message: 'Invalid email or password' }) };
      }

      const user = result.rows[0];
      delete user.password_hash; // Security: don't send the password back to the UI
      return { statusCode: 200, headers, body: JSON.stringify(user) };
    }

    // --- 2. PROFILE UPDATES ---
    if (type === 'updateProfile' && event.httpMethod === 'PUT') {
      const { email, firstName, lastName, profilePic } = data;
      const res = await pool.query(
        `UPDATE users 
         SET first_name = $1, last_name = $2, profile_pic = $3 
         WHERE email = $4 
         RETURNING first_name, last_name, profile_pic`,
        [firstName, lastName, profilePic, email]
      );
      return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
    }

    // --- 3. GET DATA ---
    if (event.httpMethod === 'GET') {
      let query = 'SELECT * FROM discussions ORDER BY created_at DESC';
      if (type === 'resources') query = 'SELECT * FROM resources ORDER BY created_at DESC';
      if (type === 'video') query = 'SELECT * FROM videos ORDER BY created_at DESC';
      
      const result = await pool.query(query);
      return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
    }

    // --- 4. POST DATA (Add New) ---
    if (event.httpMethod === 'POST') {
      if (type === 'video') {
        const { title, url, description } = data;
        const res = await pool.query(
          `INSERT INTO videos (title, url, description, comments, created_at) 
           VALUES ($1, $2, $3, '[]', NOW()) RETURNING *`,
          [title, url, description]
        );
        return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
      }

      if (type === 'resource') {
        const { title, category, url } = data;
        const res = await pool.query(
          `INSERT INTO resources (title, category, url, created_at) 
           VALUES ($1, $2, $3, NOW()) RETURNING *`,
          [title, category, url]
        );
        return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
      }

      // Default: Create Discussion
      const { author, title, content, category } = data;
      const res = await pool.query(
        `INSERT INTO discussions (author, title, content, category, comments, created_at) 
         VALUES ($1, $2, $3, $4, '[]', NOW()) RETURNING *`,
        [author, title, content, category]
      );
      return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
    }

    // --- 5. PUT DATA (Comments) ---
    if (event.httpMethod === 'PUT') {
      const table = type === 'video' ? 'videos' : 'discussions';
      const res = await pool.query(
        `UPDATE ${table} SET comments = $1 WHERE id = $2 RETURNING *`,
        [JSON.stringify(data.comments || []), id]
      );
      return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
    }

    // --- 6. DELETE DATA ---
    if (event.httpMethod === 'DELETE') {
      let table = 'discussions';
      if (type === 'resource') table = 'resources';
      if (type === 'video') table = 'videos';
      
      await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Action not handled' }) };

  } catch (err) {
    console.error('Database Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
