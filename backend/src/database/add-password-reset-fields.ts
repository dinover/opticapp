import { Pool } from 'pg';
import { databaseConfig } from '../config/database';

export async function addPasswordResetFields(): Promise<void> {
  const client = new Pool(databaseConfig);

  try {
    console.log('🔄 Adding password reset fields to users table...');

    // Check if fields already exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('reset_token', 'reset_token_expiry')
    `);

    const existingColumns = checkColumns.rows.map(row => row.column_name);

    if (!existingColumns.includes('reset_token')) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN reset_token VARCHAR(255)
      `);
      console.log('✅ Added reset_token column');
    } else {
      console.log('ℹ️  reset_token column already exists');
    }

    if (!existingColumns.includes('reset_token_expiry')) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN reset_token_expiry TIMESTAMP
      `);
      console.log('✅ Added reset_token_expiry column');
    } else {
      console.log('ℹ️  reset_token_expiry column already exists');
    }

    console.log('✅ Password reset fields migration completed successfully');
  } catch (error) {
    console.error('❌ Error during password reset fields migration:', error);
    throw error;
  } finally {
    client.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addPasswordResetFields()
    .then(() => {
      console.log('Password reset fields migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Password reset fields migration failed:', error);
      process.exit(1);
    });
}
