import { executeQuery } from './query';

async function fixTotalPriceIssue() {
  try {
    console.log('🔧 Fixing total_price vs total_amount issue...');
    
    // Check if we're in development (SQLite) or production (PostgreSQL)
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      // SQLite migration
      console.log('📱 Running SQLite migration...');
      
      // Add total_amount column if it doesn't exist
      try {
        await executeQuery(`
          ALTER TABLE sales ADD COLUMN total_amount REAL
        `);
        console.log('✅ Added total_amount column to sales table');
      } catch (error) {
        console.log('ℹ️  total_amount column already exists');
      }
      
      // Update existing sales to have total_amount based on total_price
      await executeQuery(`
        UPDATE sales SET total_amount = total_price WHERE total_amount IS NULL
      `);
      console.log('✅ Updated existing sales with total_amount');
      
      // Make total_price nullable (SQLite doesn't support DROP COLUMN easily)
      console.log('ℹ️  Note: In SQLite, total_price column remains but is no longer used');
      
    } else {
      // PostgreSQL migration
      console.log('🐘 Running PostgreSQL migration...');
      
      // Add total_amount column if it doesn't exist
      try {
        await executeQuery(`
          ALTER TABLE sales ADD COLUMN total_amount DECIMAL(10,2)
        `);
        console.log('✅ Added total_amount column to sales table');
      } catch (error) {
        console.log('ℹ️  total_amount column already exists');
      }
      
      // Update existing sales to have total_amount based on total_price
      await executeQuery(`
        UPDATE sales SET total_amount = total_price WHERE total_amount IS NULL
      `);
      console.log('✅ Updated existing sales with total_amount');
      
      // Make total_price nullable
      try {
        await executeQuery(`
          ALTER TABLE sales ALTER COLUMN total_price DROP NOT NULL
        `);
        console.log('✅ Made total_price nullable');
      } catch (error) {
        console.log('ℹ️  total_price is already nullable or column doesn\'t exist');
      }
    }
    
    // Verify the structure
    const salesStructure = await executeQuery(`
      ${isDevelopment ? 'PRAGMA table_info(sales)' : `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'sales' 
        ORDER BY ordinal_position
      `}
    `);
    
    console.log('\n📋 Updated sales table structure:');
    salesStructure.rows.forEach((column: any) => {
      if (isDevelopment) {
        console.log(`   - ${column.name}: ${column.type}`);
      } else {
        console.log(`   - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
      }
    });
    
    console.log('\n✅ Total price issue fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing total price issue:', error);
    throw error;
  }
}

// Execute migration if called directly
if (require.main === module) {
  fixTotalPriceIssue().then(() => {
    console.log('🎉 Migration completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
}

export { fixTotalPriceIssue };
