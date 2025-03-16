const { execSync } = require('child_process');

// Generate a random string for the migration name
const randomString = Math.random().toString(36).substring(2, 10);

console.log('Running migration with name: ' + randomString);
execSync(`npm run typeorm migration:generate src/migrations/${randomString}`, {
  stdio: 'inherit',
});
