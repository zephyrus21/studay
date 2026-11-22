// Usage: node scripts/apply-schema.mjs <connection-string>
import { readFileSync } from 'node:fs'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.argv[2] })
await pool.query(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'))
await pool.end()
console.log('schema applied')
