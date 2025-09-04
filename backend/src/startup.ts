import { fixTotalPriceIssue } from './database/fix-total-price-issue';
import { fixSalesSchema } from './database/fix-sales-schema';

export async function runStartupTasks() {
  try {
    console.log('🚀 Running startup tasks...');
    
    // Run the sales schema fix migration
    await fixSalesSchema();
    
    // Run the total price fix migration
    await fixTotalPriceIssue();
    
    console.log('✅ Startup tasks completed successfully!');
  } catch (error) {
    console.error('❌ Error during startup tasks:', error);
    // Don't throw error to prevent app from crashing
  }
}
