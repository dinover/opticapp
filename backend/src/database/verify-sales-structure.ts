import { executeQuery } from './query';

async function verifySalesStructure() {
  try {
    console.log('🔍 Verifying sales table structure...');
    console.log('🐘 Running PostgreSQL verification...');
    
    // Check sales table structure
    const salesStructure = await executeQuery(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'sales' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Sales table structure:');
    salesStructure.rows.forEach((column: any) => {
      console.log(`   - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable}, default: ${column.column_default})`);
    });
    
    // Check if total_amount column exists
    const hasTotalAmount = salesStructure.rows.some((col: any) => col.column_name === 'total_amount');
    if (!hasTotalAmount) {
      console.log('❌ total_amount column missing!');
      return false;
    }
    
    // Check if sale_date column exists
    const hasSaleDate = salesStructure.rows.some((col: any) => col.column_name === 'sale_date');
    if (!hasSaleDate) {
      console.log('❌ sale_date column missing!');
      return false;
    }
    
    // Check if sale_date has a default value
    const saleDateColumn = salesStructure.rows.find((col: any) => col.column_name === 'sale_date');
    if (saleDateColumn && !saleDateColumn.column_default) {
      console.log('⚠️  sale_date column has no default value');
    }
    
    console.log('✅ All required columns exist');
    
    // Test INSERT query
    console.log('\n🧪 Testing INSERT query...');
    
    try {
      // PostgreSQL test insert
      const testResult = await executeQuery(`
        INSERT INTO sales (optic_id, client_id, unregistered_client_name, total_amount, sale_date, notes, created_at)
        VALUES (1, NULL, 'Test Client', 100.00, CURRENT_DATE, 'Test sale', CURRENT_TIMESTAMP)
        RETURNING id
      `);
      
      console.log('✅ Test INSERT successful:', testResult.rows[0]);
      
      // Clean up test data
      await executeQuery(`
        DELETE FROM sales WHERE unregistered_client_name = 'Test Client'
      `);
      
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('❌ Test INSERT failed:', error);
      return false;
    }
    
    console.log('\n✅ Sales table structure verification completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error verifying sales structure:', error);
    return false;
  }
}

// Execute verification if called directly
if (require.main === module) {
  verifySalesStructure().then((success) => {
    if (success) {
      console.log('🎉 Verification completed successfully!');
      process.exit(0);
    } else {
      console.error('💥 Verification failed!');
      process.exit(1);
    }
  }).catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
}

export { verifySalesStructure };
