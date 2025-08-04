// Database configuration for Railway PostgreSQL
export const databaseConfig = {
  host: 'postgres.railway.internal',
  port: 5432,
  database: 'railway',
  user: 'postgres',
  password: 'QczfCveNywkQQgsQhoDQsGSJpYGIesOA',
  ssl: {
    rejectUnauthorized: false
  }
};

export const connectionString = process.env.DATABASE_URL || 
  `postgresql://${databaseConfig.user}:${databaseConfig.password}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`; 