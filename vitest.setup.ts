try {
  process.loadEnvFile('.env.local')
} catch {}
// Tests must never touch the main database: only redirect when a test URL exists.
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
