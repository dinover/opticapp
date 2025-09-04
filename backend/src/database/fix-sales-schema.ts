import { executeQuery } from './query';

async function fixSalesSchema() {
  try {
    console.log('🔧 Fixing sales table schema...');
    console.log('🐘 Running PostgreSQL migration...');
    
    // Create sale_items table if it doesn't exist
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        product_id INTEGER,
        unregistered_product_name VARCHAR(255),
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        od_esf DECIMAL(4,2),
        od_cil DECIMAL(4,2),
        od_eje INTEGER,
        od_add DECIMAL(4,2),
        oi_esf DECIMAL(4,2),
        oi_cil DECIMAL(4,2),
        oi_eje INTEGER,
        oi_add DECIMAL(4,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Created sale_items table');
    
    // Add total_amount column if it doesn't exist
    try {
      await executeQuery(`
        ALTER TABLE sales ADD COLUMN total_amount DECIMAL(10,2)
      `);
      console.log('✅ Added total_amount column to sales table');
    } catch (error) {
      console.log('ℹ️  total_amount column already exists');
    }
    
    // Make old columns nullable
    try {
      await executeQuery(`
        ALTER TABLE sales ALTER COLUMN product_id DROP NOT NULL
      `);
      console.log('✅ Made product_id nullable');
    } catch (error) {
      console.log('ℹ️  product_id is already nullable');
    }
    
    try {
      await executeQuery(`
        ALTER TABLE sales ALTER COLUMN quantity DROP NOT NULL
      `);
      console.log('✅ Made quantity nullable');
    } catch (error) {
      console.log('ℹ️  quantity is already nullable');
    }
    
    try {
      await executeQuery(`
        ALTER TABLE sales ALTER COLUMN total_price DROP NOT NULL
      `);
      console.log('✅ Made total_price nullable');
    } catch (error) {
      console.log('ℹ️  total_price is already nullable');
    }
    
    try {
      await executeQuery(`
        ALTER TABLE sales ALTER COLUMN sale_date DROP NOT NULL
      `);
      console.log('✅ Made sale_date nullable');
    } catch (error) {
      console.log('ℹ️  sale_date is already nullable');
    }
    
    // Add default value for sale_date to use created_at
    try {
      await executeQuery(`
        ALTER TABLE sales ALTER COLUMN sale_date SET DEFAULT CURRENT_DATE
      `);
      console.log('✅ Set sale_date default to CURRENT_DATE');
    } catch (error) {
      console.log('ℹ️  sale_date default already set');
    }
    
    // Update existing sales to have total_amount based on total_price
    await executeQuery(`
      UPDATE sales SET total_amount = total_price WHERE total_amount IS NULL
    `);
    console.log('✅ Updated existing sales with total_amount');
    
    // Update existing sales to have sale_date if it's null
    await executeQuery(`
      UPDATE sales SET sale_date = DATE(created_at) WHERE sale_date IS NULL
    `);
    console.log('✅ Updated existing sales with sale_date');
    
    // Verify the structure
    const salesStructure = await executeQuery(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'sales' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Updated sales table structure:');
    salesStructure.rows.forEach((column: any) => {
      console.log(`   - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable}, default: ${column.column_default})`);
    });
    
    // Check sale_items structure
    const saleItemsStructure = await executeQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sale_items' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Sale_items table structure:');
    saleItemsStructure.rows.forEach((column: any) => {
      console.log(`   - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });
    
    console.log('\n✅ Sales schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing sales schema:', error);
    throw error;
  }
}

// Execute migration if called directly
if (require.main === module) {
  fixSalesSchema().then(() => {
    console.log('🎉 Migration completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
}

export { fixSalesSchema };
