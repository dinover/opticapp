// Database configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

// Railway provides DATABASE_URL environment variable
// If DATABASE_URL is provided, use it regardless of environment
const hasDatabaseUrl = !!process.env.DATABASE_URL;

export const databaseConfig = {
  host: isDevelopment && !hasDatabaseUrl ? 'localhost' : undefined,
  port: isDevelopment && !hasDatabaseUrl ? 5432 : undefined,
  database: isDevelopment && !hasDatabaseUrl ? 'opticapp_dev' : undefined,
  user: isDevelopment && !hasDatabaseUrl ? 'postgres' : undefined,
  password: isDevelopment && !hasDatabaseUrl ? 'postgres' : undefined,
  ssl: isDevelopment && !hasDatabaseUrl ? false : { rejectUnauthorized: false }
};

// Use DATABASE_URL if provided (Railway), otherwise use local config
export const connectionString = process.env.DATABASE_URL || 
  (isDevelopment 
    ? 'postgresql://postgres:postgres@localhost:5432/opticapp_dev'
    : 'postgresql://postgres:QczfCveNywkQQgsQhoDQsGSJpYGIesOA@postgres.railway.internal:5432/railway'
  ); 