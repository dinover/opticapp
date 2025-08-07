import { pool, sqliteDb } from './init';
import bcrypt from 'bcryptjs';
import { cleanupDatabase } from './cleanup';

const isDevelopment = process.env.NODE_ENV !== 'production';

export async function migrateDatabase(): Promise<void> {
  console.log('Starting database migration...');
  
  if (isDevelopment && sqliteDb) {
    console.log('Starting SQLite database migration...');
    
    // Add is_approved column if it doesn't exist
    sqliteDb.run(`
      ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT 0
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding is_approved column:', err);
      }
    });
    
    // Add total_amount column to sales table if it doesn't exist
    sqliteDb.run(`
      ALTER TABLE sales ADD COLUMN total_amount REAL DEFAULT 0
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding total_amount column:', err);
      }
    });
    
    // Update existing sales to have total_amount
    sqliteDb.run(`
      UPDATE sales 
      SET total_amount = COALESCE(quantity * unit_price, 0) 
      WHERE total_amount IS NULL OR total_amount = 0
    `, (err) => {
      if (err) {
        console.error('Error updating sales total_amount:', err);
      }
    });
    
    // Convert existing users to normal users and approve them
    sqliteDb.run(`
      UPDATE users SET role = 'user', is_approved = 1 WHERE role = 'admin' OR role IS NULL
    `);
    
    // Check if admin user exists
    sqliteDb.get('SELECT COUNT(*) as count FROM users WHERE username = ?', ['admin'], (err, row: any) => {
      if (err) {
        console.error('Error checking admin user:', err);
        return;
      }
      
      if (row.count === 0) {
        // Create default optic if none exists
        sqliteDb.get('SELECT COUNT(*) as count FROM optics', (err, row: any) => {
          if (err) {
            console.error('Error checking optics:', err);
            return;
          }
          
          if (row.count === 0) {
            sqliteDb.run(
              'INSERT INTO optics (name, address, phone, email) VALUES (?, ?, ?, ?)',
              ['Default Optic', 'Default Address', 'Default Phone', 'default@optic.com'],
              function(err) {
                if (err) {
                  console.error('Error creating default optic:', err);
                  return;
                }
                
                // Create admin user
                const hashedPassword = bcrypt.hashSync('admin2995', 10);
                sqliteDb.run(
                  'INSERT INTO users (username, email, password, optic_id, role, is_approved) VALUES (?, ?, ?, ?, ?, ?)',
                  ['admin', 'admin@opticapp.com', hashedPassword, this.lastID, 'admin', 1],
                  (err) => {
                    if (err) {
                      console.error('Error creating admin user:', err);
                    } else {
                      console.log('Admin user created successfully');
                    }
                  }
                );
              }
            );
          } else {
            // Get first optic
            sqliteDb.get('SELECT id FROM optics LIMIT 1', (err, row: any) => {
              if (err) {
                console.error('Error getting optic:', err);
                return;
              }
              
              // Create admin user
              const hashedPassword = bcrypt.hashSync('admin2995', 10);
              sqliteDb.run(
                'INSERT INTO users (username, email, password, optic_id, role, is_approved) VALUES (?, ?, ?, ?, ?, ?)',
                ['admin', 'admin@opticapp.com', hashedPassword, row.id, 'admin', 1],
                (err) => {
                  if (err) {
                    console.error('Error creating admin user:', err);
                  } else {
                    console.log('Admin user created successfully');
                  }
                }
              );
            });
          }
        });
      } else {
        console.log('Admin user already exists');
      }
    });
    
    console.log('SQLite database migration completed successfully');
  } else if (pool) {
    console.log('Starting PostgreSQL database migration...');
    
    const client = await pool.connect();
    try {
      // Add is_approved column if it doesn't exist
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'is_approved'
          ) THEN 
            ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT false;
          END IF;
        END $$;
      `);
      
      // Create registration_requests table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS registration_requests (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          optic_id INTEGER NOT NULL REFERENCES optics(id) ON DELETE CASCADE,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          admin_notes TEXT,
          reviewed_by INTEGER REFERENCES users(id),
          reviewed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add total_amount column to sales table if it doesn't exist
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'total_amount'
          ) THEN 
            ALTER TABLE sales ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0;
          END IF;
        END $$;
      `);
      
      // Update existing sales to have total_amount
      await client.query(`
        UPDATE sales 
        SET total_amount = COALESCE(quantity * unit_price, 0) 
        WHERE total_amount IS NULL OR total_amount = 0
      `);
      
      // Convert existing users to normal users and approve them
      await client.query(`
        UPDATE users SET role = 'user', is_approved = true WHERE role = 'admin' OR role IS NULL
      `);
      
      // Check if admin user exists
      const adminResult = await client.query('SELECT COUNT(*) FROM users WHERE username = $1', ['admin']);
      const adminCount = parseInt(adminResult.rows[0].count);
      
      if (adminCount === 0) {
        // Create default optic if none exists
        const opticResult = await client.query('SELECT COUNT(*) FROM optics');
        const opticCount = parseInt(opticResult.rows[0].count);
        
        let opticId: number;
        if (opticCount === 0) {
          const newOpticResult = await client.query(
            'INSERT INTO optics (name, address, phone, email) VALUES ($1, $2, $3, $4) RETURNING id',
            ['Default Optic', 'Default Address', 'Default Phone', 'default@optic.com']
          );
          opticId = newOpticResult.rows[0].id;
        } else {
          const existingOpticResult = await client.query('SELECT id FROM optics LIMIT 1');
          opticId = existingOpticResult.rows[0].id;
        }
        
        // Create admin user
        const hashedPassword = await bcrypt.hash('admin2995', 10);
        await client.query(
          'INSERT INTO users (username, email, password, optic_id, role, is_approved) VALUES ($1, $2, $3, $4, $5, $6)',
          ['admin', 'admin@opticapp.com', hashedPassword, opticId, 'admin', true]
        );
        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }
      
      console.log('PostgreSQL database migration completed successfully');
    } finally {
      client.release();
    }
  } else {
    throw new Error('No database connection available');
  }
  
  // Run cleanup after migration
  await cleanupDatabase();
  
  console.log('Database migrations completed');
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