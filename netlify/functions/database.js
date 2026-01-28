const { Pool } = require('pg');

let pool;

// Initialize pool with error handling
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

  console.log('=== REQUEST DEBUG ===');
  console.log('Method:', event.httpMethod);
  console.log('Query params:', event.queryStringParameters);
  console.log('Body:', event.body);

  try {
    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set!');
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: 'Database not configured. Please set DATABASE_URL in Netlify environment variables.' }) 
      };
    }

    const data = JSON.parse(event.body || '{}');
    const type = event.queryStringParameters?.type;
    const id = event.queryStringParameters?.id;

    console.log('Parsed data:', data);
    console.log('Type:', type);

    // --- 1. AUTHENTICATION ---
    if (type === 'register' && event.httpMethod === 'POST') {
      const { email, password } = data;
      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: 'Email and password required' }) };
      }
      const cleanEmail = email.toLowerCase().trim();
      
      try {
        const check = await pool.query('SELECT email FROM users WHERE email = $1', [cleanEmail]);
        if (check.rows.length > 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ message: 'User already exists' }) };
        }

        const result = await pool.query(
          `INSERT INTO users (email, password_hash, display_name, created_at) 
           VALUES ($1, $2, $3, NOW()) RETURNING email, display_name as "displayName", is_admin as "isAdmin"`,
          [cleanEmail, password, cleanEmail.split('@')[0]]
        );
        return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
      } catch (dbErr) {
        console.error('Database error during registration:', dbErr);
        return { 
          statusCode: 500, 
          headers, 
          body: JSON.stringify({ error: 'Database error during registration', details: dbErr.message }) 
        };
      }
    }

    if (type === 'login' && event.httpMethod === 'POST') {
      const { email, password } = data;
      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: 'Email and password required' }) };
      }
      
      try {
        const result = await pool.query(
          `SELECT email, display_name as "displayName", first_name as "firstName", 
           last_name as "lastName", profile_pic as "profilePic", is_admin as "isAdmin", password_hash 
           FROM users WHERE email = $1`, [email.toLowerCase().trim()]
        );
        if (result.rows.length === 0 || result.rows[0].password_hash !== password) {
          return { statusCode: 401, headers, body: JSON.stringify({ message: 'Invalid credentials' }) };
        }
        const user = result.rows[0];
        delete user.password_hash;
        return { statusCode: 200, headers, body: JSON.stringify(user) };
      } catch (dbErr) {
        console.error('Database error during login:', dbErr);
        return { 
          statusCode: 500, 
          headers, 
          body: JSON.stringify({ error: 'Database error during login', details: dbErr.message }) 
        };
      }
    }

    // --- 2. PROFILE UPDATE ---
    if (type === 'updateProfile' && event.httpMethod === 'PUT') {
      const { email, firstName, lastName, profilePic } = data;
      try {
        const res = await pool.query(
          `UPDATE users SET first_name = $1, last_name = $2, profile_pic = $3 WHERE email = $4 
           RETURNING first_name as "firstName", last_name as "lastName", profile_pic as "profilePic"`,
          [firstName, lastName, profilePic, email]
        );
        return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
      } catch (dbErr) {
        console.error('Database error during profile update:', dbErr);
        return { 
          statusCode: 500, 
          headers, 
          body: JSON.stringify({ error: 'Database error during profile update', details: dbErr.message }) 
        };
      }
    }

    // --- 3. GET DATA ---
    if (event.httpMethod === 'GET') {
      let query = '';
      if (type === 'discussions') {
        query = 'SELECT * FROM discussions ORDER BY created_at DESC';
      } else if (type === 'video') {
        query = 'SELECT * FROM videos ORDER BY created_at DESC';
      } else if (type === 'resources') {
        query = 'SELECT * FROM resources ORDER BY created_at DESC';
      } else {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid type parameter for GET' }) };
      }
      
      try {
        const result = await pool.query(query);
        console.log(`Successfully fetched ${result.rows.length} rows for type: ${type}`);
        return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
      } catch (dbErr) {
        console.error('Database error during GET:', dbErr);
        return { 
          statusCode: 500, 
          headers, 
          body: JSON.stringify({ error: 'Database error during fetch', details: dbErr.message }) 
        };
      }
    }

    // --- 4. POST DATA ---
    if (event.httpMethod === 'POST') {
      if (type === 'discussion') {
        const { author, title, content, category } = data;
        console.log('Creating discussion with:', { author, title, content, category });
        
        if (!author || !title || !content || !category) {
          console.error('Missing fields:', { author: !!author, title: !!title, content: !!content, category: !!category });
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ message: 'Missing required fields: author, title, content, category' }) 
          };
        }
        
        try {
          const res = await pool.query(
            `INSERT INTO discussions (author, title, content, category, comments, created_at) 
             VALUES ($1, $2, $3, $4, '[]'::jsonb, NOW()) RETURNING *`,
            [author, title, content, category]
          );
          console.log('Discussion created successfully:', res.rows[0]);
          return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
        } catch (dbErr) {
          console.error('Database error creating discussion:', dbErr);
          console.error('Error details:', {
            message: dbErr.message,
            code: dbErr.code,
            detail: dbErr.detail,
            hint: dbErr.hint
          });
          return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ 
              error: 'Database error creating discussion', 
              message: dbErr.message,
              code: dbErr.code,
              hint: dbErr.hint
            }) 
          };
        }
      }
      
      if (type === 'video') {
        const { title, url, description } = data;
        if (!title || !url) {
          return { statusCode: 400, headers, body: JSON.stringify({ message: 'Title and URL required' }) };
        }
        try {
          const res = await pool.query(
            `INSERT INTO videos (title, url, description, comments, created_at) 
             VALUES ($1, $2, $3, '[]'::jsonb, NOW()) RETURNING *`,
            [title, url, description]
          );
          return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
        } catch (dbErr) {
          console.error('Database error creating video:', dbErr);
          return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ error: 'Database error creating video', details: dbErr.message }) 
          };
        }
      }
      
      if (type === 'resource') {
        const { title, url, category } = data;
        if (!title || !url) {
          return { statusCode: 400, headers, body: JSON.stringify({ message: 'Title and URL required' }) };
        }
        try {
          const res = await pool.query(
            `INSERT INTO resources (title, url, category, created_at) 
             VALUES ($1, $2, $3, NOW()) RETURNING *`,
            [title, url, category || 'General']
          );
          return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
        } catch (dbErr) {
          console.error('Database error creating resource:', dbErr);
          return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ error: 'Database error creating resource', details: dbErr.message }) 
          };
        }
      }
    }

    // --- 5. DELETE DATA ---
    if (event.httpMethod === 'DELETE') {
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID required for deletion' }) };
      }
      let table = 'discussions';
      if (type === 'video') table = 'videos';
      if (type === 'resource') table = 'resources';
      if (type === 'discussion') table = 'discussions';
      
      try {
        await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      } catch (dbErr) {
        console.error('Database error during delete:', dbErr);
        return { 
          statusCode: 500, 
          headers, 
          body: JSON.stringify({ error: 'Database error during delete', details: dbErr.message }) 
        };
      }
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Action not handled' }) };
  } catch (err) {
    console.error('=== CRITICAL ERROR ===');
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        error: 'Server error', 
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }) 
    };
  }
};
