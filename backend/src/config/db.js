import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Neon's serverless driver connects over WebSocket (HTTPS port 443) instead
// of raw Postgres TCP (port 5432). Many campus/office/hostel networks block
// 5432 outright, which causes ETIMEDOUT errors with the regular 'pg' driver.
// Port 443 is what every website uses, so it's effectively never blocked.
neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export default pool;
