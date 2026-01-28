const { Pool } = require('pg');

let pool;

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} catch (err) {
  console.error('Failed to initialize database pool:', err);
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    if (!process.env.DATABASE_URL) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database not configured' }) };
    }

    const data = JSON.parse(event.body || '{}');
    const type = event.queryStringParameters?.type;
    const id = event.queryStringParameters?.id;

    // --- AUTHENTICATION ---
    if (type === 'register' && event.httpMethod === 'POST') {
      const { email, password } = data;
      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: 'Email and password required' }) };
      }
      const cleanEmail = email.toLowerCase().trim();
      
      const check = await pool.query('SELECT email FROM users WHERE email = $1', [cleanEmail]);
      if (check.rows.length > 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: 'User already exists' }) };
      }

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, display_name, created_at) 
         VALUES ($1, $2, $3, NOW()) RETURNING id, email, display_name as "displayName", is_admin as "isAdmin"`,
        [cleanEmail, password, cleanEmail.split('@')[0]]
      );
      return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (type === 'login' && event.httpMethod === 'POST') {
      const { email, password } = data;
      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: 'Email and password required' }) };
      }
      
      const result = await pool.query(
        `SELECT id, email, display_name as "displayName", first_name as "firstName", 
         last_name as "lastName", profile_pic as "profilePic", is_admin as "isAdmin", password_hash 
         FROM users WHERE email = $1`, [email.toLowerCase().trim()]
      );
      if (result.rows.length === 0 || result.rows[0].password_hash !== password) {
        return { statusCode: 401, headers, body: JSON.stringify({ message: 'Invalid credentials' }) };
      }
      const user = result.rows[0];
      delete user.password_hash;
      return { statusCode: 200, headers, body: JSON.stringify(user) };
    }

    // --- PROFILE UPDATE ---
    if (type === 'updateProfile' && event.httpMethod === 'PUT') {
      const { email, firstName, lastName, profilePic } = data;
      const res = await pool.query(
        `UPDATE users SET first_name = $1, last_name = $2, profile_pic = $3 WHERE email = $4 
         RETURNING first_name as "firstName", last_name as "lastName", profile_pic as "profilePic"`,
        [firstName, lastName, profilePic, email]
      );
      return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
    }

    // --- GET DATA ---
    if (event.httpMethod === 'GET') {
      let query = '';
      if (type === 'discussions') {
        query = 'SELECT * FROM discussions ORDER BY created_at DESC';
      } else if (type === 'video') {
        query = 'SELECT * FROM videos ORDER BY created_at DESC';
      } else if (type === 'resources') {
        query = 'SELECT * FROM resources ORDER BY created_at DESC';
      } else {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid type' }) };
      }
      
      const result = await pool.query(query);
      return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
    }

    // --- POST DATA ---
    if (event.httpMethod === 'POST') {
      if (type === 'discussion') {
        const { title, content, category, userEmail } = data;
        
        if (!title || !content || !category || !userEmail) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ message: 'Missing required fields' }) 
          };
        }
        
        // Get user info from email
        const userResult = await pool.query(
          'SELECT id, first_name, last_name, display_name FROM users WHERE email = $1', 
          [userEmail]
        );
        
        if (userResult.rows.length === 0) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ message: 'User not found. Please log in again.' }) 
          };
        }
        
        const userData = userResult.rows[0];
        const authorId = userData.id;
        
        // Create author name from first_name + last_name, or fall back to display_name
        const authorName = (userData.first_name && userData.last_name)
          ? `${userData.first_name} ${userData.last_name}`.trim()
          : (userData.display_name || 'Anonymous');
        
        // Insert with BOTH author_id and author
        const res = await pool.query(
          `INSERT INTO discussions (author_id, author, title, content, category, comments, created_at) 
           VALUES ($1, $2, $3, $4, $5, '[]'::jsonb, NOW()) RETURNING *`,
          [authorId, authorName, title, content, category]
        );
        return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
      }
      
      if (type === 'video') {
        const { title, url, description } = data;
        if (!title || !url) {
          return { statusCode: 400, headers, body: JSON.stringify({ message: 'Title and URL required' }) };
        }
        const res = await pool.query(
          `INSERT INTO videos (title, url, description, comments, created_at) 
           VALUES ($1, $2, $3, '[]'::jsonb, NOW()) RETURNING *`,
          [title, url, description || '']
        );
        return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
      }
      
      if (type === 'resource') {
        const { title, url, category } = data;
        if (!title || !url) {
          return { statusCode: 400, headers, body: JSON.stringify({ message: 'Title and URL required' }) };
        }
        const res = await pool.query(
          `INSERT INTO resources (title, url, category, created_at) 
           VALUES ($1, $2, $3, NOW()) RETURNING *`,
          [title, url, category || 'General']
        );
        return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
      }
    }

    // --- DELETE DATA ---
    if (event.httpMethod === 'DELETE') {
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID required' }) };
      }
      let table = 'discussions';
      if (type === 'video') table = 'videos';
      if (type === 'resource') table = 'resources';
      if (type === 'discussion') table = 'discussions';
      
      await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Action not handled' }) };
  } catch (err) {
    console.error('Database error:', err);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: 'Server error', message: err.message }) 
    };
  }
};
