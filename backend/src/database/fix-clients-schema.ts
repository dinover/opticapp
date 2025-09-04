import { executeQuery } from './query';

async function fixClientsSchema() {
  try {
    console.log('🔧 Fixing clients table schema...');
    console.log('🐘 Running PostgreSQL migration...');
    
    // Make dni, first_name, and last_name nullable
    try {
      await executeQuery(`
        ALTER TABLE clients ALTER COLUMN dni DROP NOT NULL
      `);
      console.log('✅ Made dni nullable');
    } catch (error) {
      console.log('ℹ️  dni is already nullable');
    }
    
    try {
      await executeQuery(`
        ALTER TABLE clients ALTER COLUMN first_name DROP NOT NULL
      `);
      console.log('✅ Made first_name nullable');
    } catch (error) {
      console.log('ℹ️  first_name is already nullable');
    }
    
    try {
      await executeQuery(`
        ALTER TABLE clients ALTER COLUMN last_name DROP NOT NULL
      `);
      console.log('✅ Made last_name nullable');
    } catch (error) {
      console.log('ℹ️  last_name is already nullable');
    }
    
    // Remove address column if it exists (it shouldn't exist in our schema)
    try {
      await executeQuery(`
        ALTER TABLE clients DROP COLUMN IF EXISTS address
      `);
      console.log('✅ Removed address column if it existed');
    } catch (error) {
      console.log('ℹ️  address column does not exist');
    }
    
    // Verify the structure
    const clientsStructure = await executeQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Updated clients table structure:');
    clientsStructure.rows.forEach((column: any) => {
      console.log(`   - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });
    
    console.log('\n✅ Clients schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing clients schema:', error);
    throw error;
  }
}

// Execute migration if called directly
if (require.main === module) {
  fixClientsSchema().then(() => {
    console.log('🎉 Migration completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
}

export { fixClientsSchema };
