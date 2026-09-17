/**
 * Helper script to create a new API key in the database.
 * Run with: npx tsx web/scripts/create-api-key.ts "Client Name"
 */
import 'dotenv/config';
import { getDb } from '../src/lib/db';
import { apiKeys } from '../src/db/schema';
import crypto from 'crypto';

async function createApiKey() {
  const clientName = process.argv[2];
  if (!clientName) {
    console.error('Error: Please provide a client name.');
    console.log('Usage: npx tsx web/scripts/create-api-key.ts "My External App"');
    process.exit(1);
  }

  // Generate a random secure token
  const token = 'sh_ext_' + crypto.randomBytes(24).toString('hex');

  const db = getDb();
  
  try {
    await db.insert(apiKeys).values({
      clientName,
      token,
      isActive: true,
    });
    console.log(`✅ API Key successfully created for "${clientName}"`);
    console.log(`\nYour Token: ${token}\n`);
    console.log('Keep this token secret! It is stored in plain text (for this simple implementation) so you can view it in the database if needed, but it should be treated like a password.');
  } catch (err) {
    console.error('Error inserting API key:', err);
    process.exit(1);
  }
}

createApiKey().catch(console.error);
