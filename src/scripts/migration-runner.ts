import { AppDataSource } from '../datasource';

async function runMigrations() {
  console.log('🚀 Running database migrations...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established.');

    await AppDataSource.runMigrations();
    console.log('🎉 Migrations applied successfully!');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

async function rollbackLastMigration() {
  console.log('⏪ Rolling back last migration...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established.');

    await AppDataSource.undoLastMigration();
    console.log('🔄 Last migration reverted successfully!');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

// Handle CLI arguments
const arg = process.argv[2];

if (arg === 'rollback') {
  rollbackLastMigration();
} else {
  runMigrations();
}
