/**
 * ONE-OFF pre-flight verification script.
 *
 * Places a single, real, deliberate order with Blueberry to confirm the
 * exact shape of a successful order-creation response (specifically, the
 * field name for the returned order id). Blueberry has NO sandbox and NO
 * order cancellation/deletion capability - this places a real, permanent,
 * non-cancellable order. Only run this deliberately, with a cheap/known SKU.
 *
 * Run: dotenv -e .env.local -- tsx scripts/test-blueberry-order-create.ts
 */
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.BLUEBERRY_API_KEY;
const API_URL = process.env.BLUEBERRY_API_URL || 'https://mbx.blue-berry.eu/api';

if (!API_KEY) {
  throw new Error('BLUEBERRY_API_KEY is required');
}

// Cheap, in-stock Blueberry SKU on dev, found via a one-off query:
// Skechers Sunglasses SE9034 26C 47, wholesale €5.50
const TEST_SKU = '20233947';
const TEST_ORDER_NUMBER = `TEST-VERIFY-${Date.now()}`;

async function main() {
  const payload = {
    number: TEST_ORDER_NUMBER,
    date: new Date().toISOString().slice(0, 10),
    currency: 'EUR',
    customer: {
      email: 'orders@focusrobin.lt',
      country: 'LT',
      city: 'Vilnius',
      zipcode: '01001',
      address: 'Test Address 1',
    },
    items: [{ sku: TEST_SKU, qty: 1 }],
  };

  console.log('Placing REAL Blueberry test order with payload:');
  console.log(JSON.stringify(payload, null, 2));

  const res = await fetch(`${API_URL}/orders/create`, {
    method: 'POST',
    headers: { akey: API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log(`\nHTTP status: ${res.status}`);
  console.log('Raw response body:');
  console.log(text);

  try {
    const json = JSON.parse(text);
    console.log('\nParsed response keys:', Object.keys(json));
  } catch {
    console.log('\n(Response was not valid JSON)');
  }
}

main().catch((err) => {
  console.error('Test order placement failed:', err);
  process.exit(1);
});
