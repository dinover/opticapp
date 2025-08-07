import { pool, sqliteDb } from './init';
import bcrypt from 'bcryptjs';

const isDevelopment = process.env.NODE_ENV !== 'production';

export async function cleanupDatabase(): Promise<void> {
  console.log('Starting database cleanup...');
  
  if (isDevelopment && sqliteDb) {
    console.log('Cleanup not needed for SQLite development');
    return;
  } else if (pool) {
    console.log('Cleaning up PostgreSQL database...');
    
    const client = await pool.connect();
    try {
      // Delete duplicate users (keep only the first one by username)
      await client.query(`
        DELETE FROM users 
        WHERE id NOT IN (
          SELECT MIN(id) 
          FROM users 
          GROUP BY username
        )
      `);
      
      // Delete users with duplicate emails (keep only the first one by email)
      await client.query(`
        DELETE FROM users 
        WHERE id NOT IN (
          SELECT MIN(id) 
          FROM users 
          GROUP BY email
        )
      `);
      
      // Clean up orphaned registration requests
      await client.query(`
        DELETE FROM registration_requests 
        WHERE user_id NOT IN (SELECT id FROM users)
      `);
      
      // Ensure we have exactly one admin user
      const adminCount = await client.query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']);
      console.log(`Found ${adminCount.rows[0].count} admin users`);
      
      if (parseInt(adminCount.rows[0].count) === 0) {
        // Create default admin user
        const hashedPassword = await bcrypt.hash('admin2995', 10);
        
        // First create a default optic if none exists
        const opticCount = await client.query('SELECT COUNT(*) FROM optics');
        if (parseInt(opticCount.rows[0].count) === 0) {
          await client.query(
            'INSERT INTO optics (name, address, phone, email) VALUES ($1, $2, $3, $4) RETURNING id',
            ['Default Optic', 'Default Address', 'Default Phone', 'default@optic.com']
          );
        }
        
        const opticResult = await client.query('SELECT id FROM optics LIMIT 1');
        const opticId = opticResult.rows[0].id;
        
        await client.query(
          'INSERT INTO users (username, email, password, optic_id, role, is_approved) VALUES ($1, $2, $3, $4, $5, $6)',
          ['admin', 'admin@opticapp.com', hashedPassword, opticId, 'admin', true]
        );
        console.log('Created default admin user');
      }
      
      console.log('Database cleanup completed successfully');
    } finally {
      client.release();
    }
  } else {
    throw new Error('No database connection available');
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupDatabase()
    .then(() => {
      console.log('Cleanup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}
