/**
 * Test script to verify the invoice system is working correctly
 * Run with: npx ts-node scripts/test-invoice-system.ts
 */

import 'dotenv/config';

async function testInvoiceSystem() {
  console.log('='.repeat(60));
  console.log('INVOICE SYSTEM CONFIGURATION TEST');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Check Resend configuration
  console.log('1. RESEND EMAIL CONFIGURATION');
  console.log('-'.repeat(40));
  
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const resendVerifiedEmail = process.env.RESEND_VERIFIED_EMAIL;

  if (!resendApiKey) {
    console.log('   ❌ RESEND_API_KEY: NOT SET');
    console.log('      → Emails will NOT be sent');
  } else {
    console.log(`   ✓ RESEND_API_KEY: Set (${resendApiKey.substring(0, 8)}...)`);
  }

  console.log(`   → RESEND_FROM_EMAIL: ${resendFromEmail}`);
  
  if (resendFromEmail === 'onboarding@resend.dev') {
    console.log('      ⚠️  Using Resend test domain');
    if (resendVerifiedEmail) {
      console.log(`      → Emails will be sent to: ${resendVerifiedEmail}`);
    } else {
      console.log('      ❌ RESEND_VERIFIED_EMAIL: NOT SET');
      console.log('         → Emails will likely fail without a verified recipient');
    }
  } else {
    console.log('      ✓ Using custom domain - can send to any email');
  }
  console.log('');

  // Test 2: Check Google Drive configuration
  console.log('2. GOOGLE DRIVE CONFIGURATION');
  console.log('-'.repeat(40));
  
  const driveClientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const drivePrivateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;

  if (!driveClientEmail) {
    console.log('   ❌ GOOGLE_DRIVE_CLIENT_EMAIL: NOT SET');
    console.log('      → Google Drive uploads will be skipped');
  } else {
    console.log(`   ✓ GOOGLE_DRIVE_CLIENT_EMAIL: ${driveClientEmail}`);
  }

  if (!drivePrivateKey) {
    console.log('   ❌ GOOGLE_DRIVE_PRIVATE_KEY: NOT SET');
    console.log('      → Google Drive uploads will be skipped');
  } else {
    console.log(`   ✓ GOOGLE_DRIVE_PRIVATE_KEY: Set (${drivePrivateKey.length} chars)`);
    
    // Check if key format looks correct
    const keyContent = drivePrivateKey.replace(/\\n/g, '\n');
    if (keyContent.includes('-----BEGIN PRIVATE KEY-----')) {
      console.log('      ✓ Key format looks valid');
    } else {
      console.log('      ⚠️  Key format may be incorrect (missing BEGIN marker)');
    }
  }
  console.log('');

  // Test 3: Check Stripe configuration
  console.log('3. STRIPE CONFIGURATION');
  console.log('-'.repeat(40));
  
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    console.log('   ❌ STRIPE_SECRET_KEY: NOT SET');
  } else {
    console.log(`   ✓ STRIPE_SECRET_KEY: Set (${stripeSecretKey.substring(0, 12)}...)`);
  }

  if (!stripeWebhookSecret) {
    console.log('   ❌ STRIPE_WEBHOOK_SECRET: NOT SET');
    console.log('      → Webhooks will fail signature verification');
  } else {
    console.log(`   ✓ STRIPE_WEBHOOK_SECRET: Set (${stripeWebhookSecret.substring(0, 12)}...)`);
  }
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const emailReady = !!resendApiKey && (resendFromEmail !== 'onboarding@resend.dev' || !!resendVerifiedEmail);
  const driveReady = !!driveClientEmail && !!drivePrivateKey;
  const stripeReady = !!stripeSecretKey && !!stripeWebhookSecret;

  console.log(`   Email System: ${emailReady ? '✓ Ready' : '❌ Not Ready'}`);
  console.log(`   Google Drive: ${driveReady ? '✓ Ready' : '❌ Not Ready'}`);
  console.log(`   Stripe Webhooks: ${stripeReady ? '✓ Ready' : '❌ Not Ready'}`);
  console.log('');

  if (emailReady && driveReady && stripeReady) {
    console.log('   ✓ All systems are configured correctly!');
    console.log('   → Make a test payment to verify everything works end-to-end');
  } else {
    console.log('   ⚠️  Some systems need configuration');
    console.log('   → Check the messages above for details');
  }
  console.log('');
}

testInvoiceSystem().catch(console.error);


