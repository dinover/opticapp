import { pool } from './init';
import bcrypt from 'bcryptjs';

const isDevelopment = process.env.NODE_ENV !== 'production';

export async function cleanupDatabase(): Promise<void> {
  console.log('Starting database cleanup...');
  
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
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
        // Create default admin user only if none exists
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
        
        // Check if admin user already exists before creating
        const existingAdmin = await client.query('SELECT COUNT(*) FROM users WHERE username = $1', ['admin']);
        if (parseInt(existingAdmin.rows[0].count) === 0) {
          await client.query(
            'INSERT INTO users (username, email, password, optic_id, role, is_approved) VALUES ($1, $2, $3, $4, $5, $6)',
            ['admin', 'admin@opticapp.com', hashedPassword, opticId, 'admin', true]
          );
          console.log('Created default admin user');
        } else {
          console.log('Admin user already exists, skipping creation');
        }
      } else {
        console.log('Admin user already exists, no need to create');
      }
      
      // Ensure admin user has correct role
      const adminUser = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
      if (adminUser.rows.length > 0 && adminUser.rows[0].role !== 'admin') {
        await client.query('UPDATE users SET role = $1 WHERE username = $2', ['admin', 'admin']);
        console.log('Updated admin user role to admin');
      }
      
      console.log('Database cleanup completed successfully');
    } finally {
      client.release();
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
