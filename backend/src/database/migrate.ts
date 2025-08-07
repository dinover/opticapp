import { pool, sqliteDb } from './init';
import bcrypt from 'bcryptjs';

const isDevelopment = process.env.NODE_ENV !== 'production';

export async function migrateDatabase(): Promise<void> {
  if (isDevelopment && sqliteDb) {
    // SQLite migration
    console.log('Starting SQLite database migration...');
    
    return new Promise((resolve, reject) => {
      sqliteDb!.serialize(() => {
        // Add is_approved column to users table if it doesn't exist
        sqliteDb!.run(`
          ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT 0
        `, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.log('is_approved column already exists or error:', err.message);
          }
        });
        
        // Convert all existing users to normal users (role = 'user') and approve them
        sqliteDb!.run(`
          UPDATE users SET role = 'user', is_approved = 1 WHERE role = 'admin' OR role IS NULL
        `);
        
        // Create admin user if it doesn't exist
        bcrypt.hash('admin2995', 10).then(adminPassword => {
          // Check if admin user already exists
          sqliteDb!.get(
            'SELECT id FROM users WHERE username = ?',
            ['admin'],
            (err, row) => {
              if (err) {
                console.error('Error checking admin user:', err);
                reject(err);
                return;
              }
              
              if (!row) {
                // Create a default optic for admin if needed
                sqliteDb!.run(`
                  INSERT INTO optics (name, address, phone, email) 
                  VALUES (?, ?, ?, ?)
                `, ['Admin Optic', 'Admin Address', 'Admin Phone', 'admin@opticapp.com'], function(err) {
                  if (err) {
                    console.error('Error creating admin optic:', err);
                    reject(err);
                    return;
                  }
                  
                  const opticId = this.lastID;
                  
                  // Create admin user
                  sqliteDb!.run(`
                    INSERT INTO users (username, email, password, optic_id, role, is_approved) 
                    VALUES (?, ?, ?, ?, ?, ?)
                  `, ['admin', 'admin@opticapp.com', adminPassword, opticId, 'admin', 1], function(err) {
                    if (err) {
                      console.error('Error creating admin user:', err);
                      reject(err);
                      return;
                    }
                    
                    console.log('Admin user created successfully');
                    console.log('Database migration completed successfully');
                    resolve();
                  });
                });
              } else {
                console.log('Admin user already exists');
                console.log('Database migration completed successfully');
                resolve();
              }
            }
          );
        }).catch(err => {
          console.error('Error hashing admin password:', err);
          reject(err);
        });
      });
    });
  } else if (pool) {
    // PostgreSQL migration
    const client = await pool.connect();
    
    try {
      console.log('Starting PostgreSQL database migration...');
      
      // Add is_approved column to users table if it doesn't exist
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
          user_id INTEGER NOT NULL REFERENCES users(id),
          optic_id INTEGER NOT NULL REFERENCES optics(id),
          status VARCHAR(50) DEFAULT 'pending',
          admin_notes TEXT,
          reviewed_by INTEGER REFERENCES users(id),
          reviewed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Convert all existing users to normal users (role = 'user') and approve them
      await client.query(`
        UPDATE users SET role = 'user', is_approved = true WHERE role = 'admin' OR role IS NULL
      `);
      
      // Create admin user if it doesn't exist
      const adminPassword = await bcrypt.hash('admin2995', 10);
      
      // Check if admin user already exists
      const adminCheck = await client.query(
        'SELECT id FROM users WHERE username = $1',
        ['admin']
      );
      
      if (adminCheck.rows.length === 0) {
        // Create a default optic for admin if needed
        const opticResult = await client.query(`
          INSERT INTO optics (name, address, phone, email) 
          VALUES ($1, $2, $3, $4) 
          ON CONFLICT DO NOTHING 
          RETURNING id
        `, ['Admin Optic', 'Admin Address', 'Admin Phone', 'admin@opticapp.com']);
        
        let opticId;
        if (opticResult.rows.length > 0) {
          opticId = opticResult.rows[0].id;
        } else {
          // Get existing optic or create one
          const existingOptic = await client.query('SELECT id FROM optics LIMIT 1');
          opticId = existingOptic.rows.length > 0 ? existingOptic.rows[0].id : 1;
        }
        
        // Create admin user
        await client.query(`
          INSERT INTO users (username, email, password, optic_id, role, is_approved) 
          VALUES ($1, $2, $3, $4, $5, $6)
        `, ['admin', 'admin@opticapp.com', adminPassword, opticId, 'admin', true]);
        
        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }
      
      console.log('Database migration completed successfully');
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    } finally {
      client.release();
    }
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