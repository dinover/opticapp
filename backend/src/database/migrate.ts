import { pool } from './init';
import bcrypt from 'bcryptjs';
import { cleanupDatabase } from './cleanup';

export async function migrateDatabase(): Promise<void> {
  console.log('Starting PostgreSQL database migration...');
  
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  
  const client = await pool.connect();
  try {
    // Add is_approved column if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT false
      `);
      console.log('✅ Added is_approved column to users table');
    } catch (error: any) {
      if (error.code === '42701') { // column already exists
        console.log('ℹ️  is_approved column already exists');
      } else {
        console.error('Error adding is_approved column:', error);
      }
    }
    
    // Add total_amount column to sales table if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE sales ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0
      `);
      console.log('✅ Added total_amount column to sales table');
    } catch (error: any) {
      if (error.code === '42701') { // column already exists
        console.log('ℹ️  total_amount column already exists');
      } else {
        console.error('Error adding total_amount column:', error);
      }
    }
    
    // Update existing sales to have total_amount
    await client.query(`
      UPDATE sales 
      SET total_amount = 0 
      WHERE total_amount IS NULL OR total_amount = 0
    `);
    console.log('✅ Updated existing sales with total_amount');
    
    // Convert existing users to normal users and approve them
    await client.query(`
      UPDATE users SET role = 'user', is_approved = true WHERE role = 'admin' OR role IS NULL
    `);
    console.log('✅ Updated existing users to normal users');
    
    // Check if admin user exists
    const adminCount = await client.query('SELECT COUNT(*) FROM users WHERE username = $1', ['admin']);
    
    if (parseInt(adminCount.rows[0].count) === 0) {
      // Create default optic if none exists
      const opticCount = await client.query('SELECT COUNT(*) FROM optics');
      if (parseInt(opticCount.rows[0].count) === 0) {
        await client.query(
          'INSERT INTO optics (name, address, phone, email) VALUES ($1, $2, $3, $4) RETURNING id',
          ['Default Optic', 'Default Address', 'Default Phone', 'default@optic.com']
        );
        console.log('✅ Created default optic');
      }
      
      const opticResult = await client.query('SELECT id FROM optics LIMIT 1');
      const opticId = opticResult.rows[0].id;
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin2995', 10);
      await client.query(
        'INSERT INTO users (username, email, password, optic_id, role, is_approved) VALUES ($1, $2, $3, $4, $5, $6)',
        ['admin', 'admin@opticapp.com', hashedPassword, opticId, 'admin', true]
      );
      console.log('✅ Created admin user');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    // Ensure admin user has correct role
    const adminUser = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (adminUser.rows.length > 0 && adminUser.rows[0].role !== 'admin') {
      await client.query('UPDATE users SET role = $1 WHERE username = $2', ['admin', 'admin']);
      console.log('✅ Updated admin user role to admin');
    }
    
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
} 