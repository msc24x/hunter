// Runs before the app starts inside Docker: loads the env file for the
// current ENV, then applies pending Prisma migrations to the database.
require('dotenv').config({ path: `.env/.env.${process.env.ENV || 'prod'}` });

const { execSync } = require('child_process');

if (!process.env.DB_URL) {
    console.error(
        `DB_URL is not set. Check that .env/.env.${process.env.ENV || 'prod'} exists and is mounted.`,
    );
    process.exit(1);
}

try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (err) {
    console.error('Prisma migrate deploy failed, aborting startup.');
    process.exit(1);
}
