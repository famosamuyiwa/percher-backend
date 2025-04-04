const { execSync } = require('child_process');
const randomString = Math.random().toString(36).substring(2, 10);
console.log('Running migration with name: ' + randomString);

try {
  execSync(
    `npx typeorm migration:generate -d dist/src/datasource.js dist/migrations/${randomString}`,
    {
      stdio: 'inherit',
    },
  );
  console.log('Migration generated successfully');
} catch (error) {
  console.error('Error generating migration:', error);
}
