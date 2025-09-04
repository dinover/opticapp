import { fixSalesSchema } from './fix-sales-schema';
import { fixTotalPriceIssue } from './fix-total-price-issue';
import { verifySalesStructure } from './verify-sales-structure';
import { executeQuery } from './query';

async function testMigrations() {
  try {
    console.log('🧪 Testing all migrations...');
    
    // Test 1: Fix total price issue
    console.log('\n📋 Test 1: Fixing total_price vs total_amount issue...');
    await fixTotalPriceIssue();
    
    // Test 2: Fix sales schema
    console.log('\n📋 Test 2: Fixing sales schema...');
    await fixSalesSchema();
    
    // Test 3: Verify structure
    console.log('\n📋 Test 3: Verifying sales structure...');
    const isStructureValid = await verifySalesStructure();
    
    if (!isStructureValid) {
      throw new Error('Sales structure verification failed');
    }
    
    // Test 4: Test actual sale creation
    console.log('\n📋 Test 4: Testing actual sale creation...');
    
    // First, ensure we have an optic
    const opticResult = await executeQuery('SELECT id FROM optics LIMIT 1');
    if (opticResult.rows.length === 0) {
      // Create a test optic
      await executeQuery(`
        INSERT INTO optics (name, address, phone, email) 
        VALUES ($1, $2, $3, $4) RETURNING id
      `, ['Test Optic', 'Test Address', 'Test Phone', 'test@optic.com']);
    }
    
    const opticId = opticResult.rows.length > 0 ? opticResult.rows[0].id : 1;
    
    // Test sale creation with the new schema
    const saleResult = await executeQuery(`
      INSERT INTO sales (optic_id, client_id, unregistered_client_name, total_amount, sale_date, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, total_amount, sale_date
    `, [opticId, null, 'Test Client', 150.00, '2024-01-15', 'Test sale from migration', '2024-01-15 10:00:00']);
    
    console.log('✅ Test sale created successfully:', saleResult.rows[0]);
    
    // Test 5: Test sale_items creation
    console.log('\n📋 Test 5: Testing sale_items creation...');
    
    const saleId = saleResult.rows[0].id;
    
    const saleItemResult = await executeQuery(`
      INSERT INTO sale_items (sale_id, product_id, unregistered_product_name, quantity, unit_price, total_price, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, sale_id, quantity, unit_price, total_price
    `, [saleId, null, 'Test Product', 2, 75.00, 150.00, 'Test item']);
    
    console.log('✅ Test sale item created successfully:', saleItemResult.rows[0]);
    
    // Test 6: Verify the complete sale with items
    console.log('\n📋 Test 6: Verifying complete sale with items...');
    
    const completeSaleResult = await executeQuery(`
      SELECT 
        s.id as sale_id,
        s.total_amount,
        s.sale_date,
        s.unregistered_client_name,
        si.id as item_id,
        si.unregistered_product_name,
        si.quantity,
        si.unit_price,
        si.total_price as item_total
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.id = $1
    `, [saleId]);
    
    console.log('✅ Complete sale verification:', completeSaleResult.rows);
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await executeQuery('DELETE FROM sale_items WHERE sale_id = $1', [saleId]);
    await executeQuery('DELETE FROM sales WHERE id = $1', [saleId]);
    
    console.log('✅ All tests passed successfully!');
    console.log('🎉 Migration system is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testMigrations()
    .then(() => {
      console.log('🎉 All migration tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration tests failed:', error);
      process.exit(1);
    });
}

export { testMigrations };
