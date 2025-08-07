import { executeQuery } from './query';

async function clearTestData() {
  try {
    console.log('🧹 Clearing test data...');
    
    // Limpiar en orden para respetar foreign keys
    await executeQuery('DELETE FROM sale_items');
    console.log('✅ Cleared sale_items');
    
    await executeQuery('DELETE FROM sales');
    console.log('✅ Cleared sales');
    
    await executeQuery('DELETE FROM clients');
    console.log('✅ Cleared clients');
    
    await executeQuery('DELETE FROM products');
    console.log('✅ Cleared products');
    
    // Reset auto-increment counters
    await executeQuery('DELETE FROM sqlite_sequence WHERE name IN ("sale_items", "sales", "clients", "products")');
    console.log('✅ Reset auto-increment counters');
    
    console.log('✅ All test data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
  }
}

if (require.main === module) {
  clearTestData();
}

export { clearTestData };
