const { neon } = require('@netlify/neon');

const db = neon(process.env.DATABASE_URL);

exports.handler = async (event, context) => {
  try {
    // Create users table
    await db`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0
      )
    `;

    // Create workouts table
    await db`
      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        exercise VARCHAR(255) NOT NULL,
        sets INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        weight INTEGER NOT NULL,
        date TIMESTAMP DEFAULT NOW()
      )
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Database setup complete' })
    };
  } catch (error) {
    console.error('Setup error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database setup failed' })
    };
  }
};
