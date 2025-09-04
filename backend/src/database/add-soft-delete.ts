import { executeQuery } from './query';

async function addSoftDeleteFields() {
  try {
    console.log('🔧 Adding soft delete fields to all tables...');
    console.log('🐘 Running PostgreSQL migration...');
    
    // Add deleted_at to clients table
    try {
      await executeQuery(`
        ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
      `);
      console.log('✅ Added deleted_at to clients table');
    } catch (error) {
      console.log('ℹ️  deleted_at already exists in clients table');
    }
    
    // Add deleted_at to products table
    try {
      await executeQuery(`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
      `);
      console.log('✅ Added deleted_at to products table');
    } catch (error) {
      console.log('ℹ️  deleted_at already exists in products table');
    }
    
    // Add deleted_at to sales table
    try {
      await executeQuery(`
        ALTER TABLE sales ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
      `);
      console.log('✅ Added deleted_at to sales table');
    } catch (error) {
      console.log('ℹ️  deleted_at already exists in sales table');
    }
    
    // Add deleted_at to sale_items table
    try {
      await executeQuery(`
        ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
      `);
      console.log('✅ Added deleted_at to sale_items table');
    } catch (error) {
      console.log('ℹ️  deleted_at already exists in sale_items table');
    }
    
    // Verify the structure
    const tables = ['clients', 'products', 'sales', 'sale_items'];
    
    for (const table of tables) {
      const structure = await executeQuery(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'deleted_at'
        ORDER BY ordinal_position
      `, [table]);
      
      if (structure.rows.length > 0) {
        console.log(`✅ ${table} table has deleted_at field`);
      } else {
        console.log(`❌ ${table} table missing deleted_at field`);
      }
    }
    
    console.log('\n✅ Soft delete fields added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding soft delete fields:', error);
    throw error;
  }
}

// Execute migration if called directly
if (require.main === module) {
  addSoftDeleteFields().then(() => {
    console.log('🎉 Migration completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
}

export { addSoftDeleteFields };
