import { db } from './init';

export async function migrateDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Starting database migration...');
    
    db.serialize(() => {
      // Add prescription fields to sales table if they don't exist
      const addFields = [
        'ALTER TABLE sales ADD COLUMN od_esf TEXT',
        'ALTER TABLE sales ADD COLUMN od_cil TEXT',
        'ALTER TABLE sales ADD COLUMN od_eje TEXT',
        'ALTER TABLE sales ADD COLUMN od_add TEXT',
        'ALTER TABLE sales ADD COLUMN oi_esf TEXT',
        'ALTER TABLE sales ADD COLUMN oi_cil TEXT',
        'ALTER TABLE sales ADD COLUMN oi_eje TEXT',
        'ALTER TABLE sales ADD COLUMN oi_add TEXT',
        'ALTER TABLE sales ADD COLUMN unregistered_client_name TEXT',
        'ALTER TABLE sales ADD COLUMN unregistered_product_name TEXT'
      ];

      let completed = 0;
      const total = addFields.length;

      addFields.forEach((sql) => {
        db.run(sql, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error(`Migration error: ${err.message}`);
          } else if (err && err.message.includes('duplicate column name')) {
            console.log('Column already exists, skipping...');
          } else {
            console.log('Column added successfully');
          }
          
          completed++;
          if (completed === total) {
            console.log('Database migration completed successfully!');
            resolve();
          }
        });
      });
    });
  });
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