import { pool } from './init';

export async function migrateDatabase(): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration...');
    
    // Add any additional migrations here if needed
    // For now, the tables are created in init.ts
    
    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Error during database migration:', error);
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