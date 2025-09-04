import { fixTotalPriceIssue } from './database/fix-total-price-issue';
import { fixSalesSchema } from './database/fix-sales-schema';
import { fixClientsSchema } from './database/fix-clients-schema';
import { verifySalesStructure } from './database/verify-sales-structure';

export async function runStartupTasks() {
  try {
    console.log('🚀 Running startup tasks...');
    
    // Run the sales schema fix migration
    await fixSalesSchema();
    
    // Run the total price fix migration
    await fixTotalPriceIssue();
    
    // Run the clients schema fix migration
    await fixClientsSchema();
    
    // Verify the sales table structure
    const isStructureValid = await verifySalesStructure();
    if (!isStructureValid) {
      console.error('❌ Sales table structure verification failed!');
    }
    
    console.log('✅ Startup tasks completed successfully!');
  } catch (error) {
    console.error('❌ Error during startup tasks:', error);
    // Don't throw error to prevent app from crashing
  }
}
