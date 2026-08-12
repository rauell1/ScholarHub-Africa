import { Client } from 'pg';

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  console.log("Connected");
  await client.query(`
    CREATE TABLE IF NOT EXISTS "csv_uploads" (
      "id" bigserial PRIMARY KEY NOT NULL,
      "filename" text NOT NULL,
      "rows" jsonb NOT NULL,
      "status" varchar(50) DEFAULT 'processing' NOT NULL,
      "total_processed" integer DEFAULT 0 NOT NULL,
      "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  console.log("Created table csv_uploads");
  await client.end();
}
run().catch(console.error);
