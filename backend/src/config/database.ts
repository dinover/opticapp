// Database configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

// For development, we'll use a simple configuration that works with SQLite
export const databaseConfig = {
  host: isDevelopment ? 'localhost' : 'postgres.railway.internal',
  port: 5432,
  database: isDevelopment ? 'opticapp_dev' : 'railway',
  user: isDevelopment ? 'postgres' : 'postgres',
  password: isDevelopment ? 'postgres' : 'QczfCveNywkQQgsQhoDQsGSJpYGIesOA',
  ssl: isDevelopment ? false : { rejectUnauthorized: false }
};

// For development, we'll use a local SQLite database
export const connectionString = process.env.DATABASE_URL || 
  (isDevelopment 
    ? 'sqlite://./database.sqlite'
    : `postgresql://${databaseConfig.user}:${databaseConfig.password}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`
  ); 