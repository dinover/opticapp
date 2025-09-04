import { fixTotalPriceIssue } from './database/fix-total-price-issue';

export async function runStartupTasks() {
  try {
    console.log('🚀 Running startup tasks...');
    
    // Run the total price fix migration
    await fixTotalPriceIssue();
    
    console.log('✅ Startup tasks completed successfully!');
  } catch (error) {
    console.error('❌ Error during startup tasks:', error);
    // Don't throw error to prevent app from crashing
  }
}
