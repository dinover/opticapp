import { executeQuery } from './query';

async function checkTableStructure() {
  try {
    console.log('🔍 Checking table structure...');
    
    // Verificar estructura de sales
    const salesStructure = await executeQuery(`
      PRAGMA table_info(sales)
    `);
    
    console.log('📋 Sales table structure:');
    salesStructure.rows.forEach((column: any) => {
      console.log(`   - ${column.name}: ${column.type}`);
    });
    
    // Verificar estructura de sale_items
    const saleItemsStructure = await executeQuery(`
      PRAGMA table_info(sale_items)
    `);
    
    console.log('\n📋 Sale_items table structure:');
    saleItemsStructure.rows.forEach((column: any) => {
      console.log(`   - ${column.name}: ${column.type}`);
    });
    
    // Verificar datos existentes
    const salesCount = await executeQuery('SELECT COUNT(*) as count FROM sales');
    const itemsCount = await executeQuery('SELECT COUNT(*) as count FROM sale_items');
    const productsCount = await executeQuery('SELECT COUNT(*) as count FROM products');
    const clientsCount = await executeQuery('SELECT COUNT(*) as count FROM clients');
    
    console.log('\n📊 Current data:');
    console.log(`   - Sales: ${salesCount.rows[0].count}`);
    console.log(`   - Sale items: ${itemsCount.rows[0].count}`);
    console.log(`   - Products: ${productsCount.rows[0].count}`);
    console.log(`   - Clients: ${clientsCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error checking structure:', error);
  }
}

if (require.main === module) {
  checkTableStructure();
}

export { checkTableStructure };
