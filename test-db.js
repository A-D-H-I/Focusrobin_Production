const { Client } = require('pg');

async function testConnection(url, name) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log(`[SUCCESS] ${name}`);
    await client.end();
  } catch (err) {
    console.log(`[FAILED] ${name}: ${err.message}`);
  }
}

async function run() {
  const devUrl = "postgresql://postgres.edrxprerepimphxlarvn:HariharanDev123@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";
  const devUrlPooler = "postgresql://postgres.edrxprerepimphxlarvn:HariharanDev123@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const prodUrl = "postgresql://postgres.kqnnwbkvqoqgpnyvjvsf:Hariharan1%40%2C@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";
  const prodUrlPooler = "postgresql://postgres.kqnnwbkvqoqgpnyvjvsf:Hariharan1%40%2C@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

  await testConnection(devUrl, 'DEV DIRECT (5432)');
  await testConnection(devUrlPooler, 'DEV POOLER (6543)');
  await testConnection(prodUrl, 'PROD DIRECT (5432)');
  await testConnection(prodUrlPooler, 'PROD POOLER (6543)');
}

run();
