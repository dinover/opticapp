import { executeQuery } from './query';

async function fixSalesStructure() {
  try {
    console.log('🔧 Fixing sales table structure...');
    
    // Agregar columna total_amount si no existe
    try {
      await executeQuery(`
        ALTER TABLE sales ADD COLUMN total_amount DECIMAL(10,2)
      `);
      console.log('✅ Added total_amount column to sales table');
    } catch (error) {
      console.log('ℹ️  total_amount column already exists');
    }
    
    // Actualizar ventas existentes con total_amount basado en total_price
    await executeQuery(`
      UPDATE sales SET total_amount = total_price WHERE total_amount IS NULL
    `);
    console.log('✅ Updated existing sales with total_amount');
    
    // Verificar la estructura actualizada
    const salesStructure = await executeQuery(`
      PRAGMA table_info(sales)
    `);
    
    console.log('\n📋 Updated sales table structure:');
    salesStructure.rows.forEach((column: any) => {
      console.log(`   - ${column.name}: ${column.type}`);
    });
    
    console.log('\n✅ Sales table structure fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing sales structure:', error);
  }
}

if (require.main === module) {
  fixSalesStructure();
}

export { fixSalesStructure };
