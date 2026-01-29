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
        query = 'SELECT id, author, author_profile_pic, title, content, category, likes, comments, created_at FROM discussions ORDER BY created_at DESC LIMIT 20';
      } else if (type === 'video') {
        query = 'SELECT id, title, url, description, thumbnail, comments, created_at FROM videos ORDER BY created_at DESC';
      } else if (type === 'resources') {
        query = 'SELECT id, title, url, category, created_at FROM resources ORDER BY created_at DESC';
      } else {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid type' }) };
      }
      
      const result = await pool.query(query);
      return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
    }

    // --- POST DATA ---
    if (event.httpMethod === 'POST') {
      if (type === 'discussion') {
        const { title, content, category, userEmail, authorProfilePic } = data;
        
        if (!title || !content || !category || !userEmail) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ message: 'Missing required fields' }) 
          };
        }
        
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
        
        // FIXED: Use snake_case column names (last_name not lastName)
        const authorName = (userData.first_name && userData.last_name)
          ? `${userData.first_name} ${userData.last_name}`.trim()
          : (userData.display_name || 'Anonymous');
        
        const res = await pool.query(
          `INSERT INTO discussions (author_id, author, author_profile_pic, title, content, category, comments, likes, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, '[]'::jsonb, '[]'::jsonb, NOW()) RETURNING *`,
          [authorId, authorName, authorProfilePic || null, title, content, category]
        );
        return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
      }

      // Add comment to discussion
      if (type === 'addComment') {
        const { postId, comment, author, authorProfilePic } = data;
        
        if (!postId || !comment || !author) {
          return { statusCode: 400, headers, body: JSON.stringify({ message: 'Missing required fields' }) };
        }

        const newComment = {
          text: comment,
          author: author,
          authorProfilePic: authorProfilePic || null,
          timestamp: new Date().toISOString()
        };

        const res = await pool.query(
          `UPDATE discussions 
           SET comments = comments || $1::jsonb 
           WHERE id = $2 
           RETURNING *`,
          [JSON.stringify(newComment), postId]
        );

        return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
      }

      // Like/unlike a post
      if (type === 'likePost') {
        const { postId, userId } = data;
        
        if (!postId || !userId) {
          return { statusCode: 400, headers, body: JSON.stringify({ message: 'Missing postId or userId' }) };
        }

        const checkRes = await pool.query(
          'SELECT likes FROM discussions WHERE id = $1',
          [postId]
        );

        if (checkRes.rows.length === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ message: 'Post not found' }) };
        }

        const currentLikes = checkRes.rows[0].likes || [];
        let newLikes;

        if (currentLikes.includes(userId)) {
          newLikes = currentLikes.filter(id => id !== userId);
        } else {
          newLikes = [...currentLikes, userId];
        }

        const res = await pool.query(
          'UPDATE discussions SET likes = $1 WHERE id = $2 RETURNING *',
          [JSON.stringify(newLikes), postId]
        );

        return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
      }
      
      // Video upload with thumbnail support
      if (type === 'video') {
        const { title, url, description, thumbnail } = data;
        if (!title || !url) {
          return { statusCode: 400, headers, body: JSON.stringify({ message: 'Title and URL required' }) };
        }
        const res = await pool.query(
          `INSERT INTO videos (title, url, description, thumbnail, comments, created_at) 
           VALUES ($1, $2, $3, $4, '[]'::jsonb, NOW()) RETURNING *`,
          [title, url, description || '', thumbnail || null]
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
