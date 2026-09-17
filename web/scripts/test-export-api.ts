/**
 * Test script for the Export API.
 * Run with: npx tsx web/scripts/test-export-api.ts
 */
import 'dotenv/config';

async function testExportApi() {
  const apiKey = process.argv[2] || process.env.EXTERNAL_API_KEY;
  if (!apiKey) {
    console.error('Error: API key is not provided.');
    console.log('Usage: npx tsx web/scripts/test-export-api.ts <YOUR_API_KEY>');
    console.log('Or set EXTERNAL_API_KEY environment variable.');
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  let totalFetched = 0;

  console.log(`Starting export from ${baseUrl}/api/v1/export/scholarships`);

  while (hasMore) {
    const url = `${baseUrl}/api/v1/export/scholarships?limit=${limit}&offset=${offset}`;
    console.log(`Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error(`Request failed with status ${response.status}:`, await response.text());
      process.exit(1);
    }

    const json = await response.json();
    const data = json.data;
    const meta = json.meta;

    console.log(`Fetched ${data.length} records. (has_more: ${meta.has_more})`);
    
    totalFetched += data.length;
    hasMore = meta.has_more;
    offset += limit;
  }

  console.log(`\nSuccess! Exported a total of ${totalFetched} scholarships.`);
}

testExportApi().catch(console.error);
