import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;

export function getDbPool(): pg.Pool {
  if (!poolInstance) {
    // Check if running in Cloud Run with unix socket or TCP
    const host = process.env.SQL_HOST;
    const user = process.env.SQL_USER;
    const password = process.env.SQL_PASSWORD;
    const database = process.env.SQL_DB_NAME;

    if (host && user && database) {
      poolInstance = new Pool({
        host,
        user,
        password,
        database,
        max: 10,
        idleTimeoutMillis: 30000,
      });
    } else if (process.env.DATABASE_URL) {
      poolInstance = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
    } else {
      // Fallback local configuration
      poolInstance = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'password',
        database: 'earning_platform',
      });
    }

    poolInstance.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  return poolInstance;
}

export async function query(text: string, params?: any[]) {
  const pool = getDbPool();
  return pool.query(text, params);
}
