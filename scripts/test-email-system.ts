/**
 * Test script to verify the email invoice system
 * 
 * This script will:
 * 1. Check environment variables
 * 2. Fetch a recent order
 * 3. Generate the combined PDF
 * 4. Send a test email
 * 
 * Usage:
 *   npx tsx scripts/test-email-system.ts
 *   
 * Or to test with a specific order ID:
 *   npx tsx scripts/test-email-system.ts <orderId>
 */

import { prisma } from '../src/lib/prisma';
import { getInvoiceDataFromOrder } from '../src/lib/invoice';
import { sendOrderConfirmationWithDocuments } from '../src/lib/invoice-email';

async function main() {
  console.log('🧪 Testing Email Invoice System\n');
  console.log('='.repeat(60));
  
  // Step 1: Check environment variables
  console.log('\n📋 Step 1: Checking Environment Variables...\n');
  
  const requiredVars = {
    'RESEND_API_KEY': process.env.RESEND_API_KEY,
    'RESEND_FROM_EMAIL': process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  };
  
  const optionalVars = {
    'RESEND_VERIFIED_EMAIL': process.env.RESEND_VERIFIED_EMAIL,
    'GOOGLE_DRIVE_CLIENT_EMAIL': process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    'GOOGLE_DRIVE_PRIVATE_KEY': process.env.GOOGLE_DRIVE_PRIVATE_KEY ? '✓ Set' : '✗ Not set',
    'GOOGLE_DRIVE_FOLDER_ID': process.env.GOOGLE_DRIVE_FOLDER_ID,
  };
  
  console.log('Required Variables:');
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      console.log(`  ✅ ${key}: ${key.includes('KEY') ? '***' : value}`);
    } else {
      console.log(`  ❌ ${key}: NOT SET`);
    }
  }
  
  console.log('\nOptional Variables (for Google Drive backup):');
  for (const [key, value] of Object.entries(optionalVars)) {
    if (value && value !== '✗ Not set') {
      console.log(`  ✅ ${key}: ${key.includes('KEY') ? value : (key.includes('EMAIL') ? value : '***')}`);
    } else {
      console.log(`  ⚠️  ${key}: Not set (optional)`);
    }
  }
  
  // Check if Resend is properly configured
  if (!process.env.RESEND_API_KEY) {
    console.log('\n❌ ERROR: RESEND_API_KEY is not set!');
    console.log('   Please add it to your .env.local file');
    process.exit(1);
  }
  
  // Warn about test mode
  if (process.env.RESEND_FROM_EMAIL === 'onboarding@resend.dev' || !process.env.RESEND_FROM_EMAIL) {
    console.log('\n⚠️  WARNING: Using Resend test mode (onboarding@resend.dev)');
    if (process.env.RESEND_VERIFIED_EMAIL) {
      console.log(`   Emails will be sent to: ${process.env.RESEND_VERIFIED_EMAIL}`);
    } else {
      console.log('   ❌ RESEND_VERIFIED_EMAIL is not set!');
      console.log('   In test mode, you must set RESEND_VERIFIED_EMAIL');
      process.exit(1);
    }
  }
  
  // Step 2: Find an order to test with
  console.log('\n='.repeat(60));
  console.log('\n📦 Step 2: Finding a Test Order...\n');
  
  let orderId = process.argv[2];
  let order;
  
  if (orderId) {
    console.log(`Looking for order with ID: ${orderId}`);
    order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  } else {
    // Find the most recent paid order
    console.log('No order ID provided, finding the most recent paid order...');
    order = await prisma.order.findFirst({
      where: {
        isPaid: true,
        paymentStatus: 'COMPLETED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }
  
  if (!order) {
    console.log('❌ No suitable order found!');
    console.log('   Please make a test purchase or provide a valid order ID');
    console.log('   Usage: npx tsx scripts/test-email-system.ts <orderId>');
    await prisma.$disconnect();
    process.exit(1);
  }
  
  console.log(`✅ Found order: ${order.orderNumber}`);
  console.log(`   Customer: ${order.User?.name || order.shippingName}`);
  console.log(`   Email: ${order.User?.email || 'N/A'}`);
  console.log(`   Total: ${order.currency} ${order.total}`);
  console.log(`   Items: ${order.items.length}`);
  console.log(`   Status: ${order.status} | Payment: ${order.paymentStatus}`);
  
  // Step 3: Generate invoice data
  console.log('\n='.repeat(60));
  console.log('\n📄 Step 3: Generating Invoice Data...\n');
  
  const invoiceData = await getInvoiceDataFromOrder(order.id);
  
  if (!invoiceData) {
    console.log('❌ Failed to generate invoice data!');
    await prisma.$disconnect();
    process.exit(1);
  }
  
  console.log('✅ Invoice data generated successfully');
  console.log(`   Order Number: ${invoiceData.orderNumber}`);
  console.log(`   Customer: ${invoiceData.customerName}`);
  console.log(`   Items: ${invoiceData.items.length}`);
  
  // Step 4: Send test email
  console.log('\n='.repeat(60));
  console.log('\n📧 Step 4: Sending Test Email...\n');
  console.log('This will:');
  console.log('  1. Generate a combined PDF (Payment Receipt + Invoice)');
  console.log('  2. Send an email with the PDF attached');
  
  if (process.env.RESEND_VERIFIED_EMAIL) {
    console.log(`  3. Email will be sent to: ${process.env.RESEND_VERIFIED_EMAIL} (test mode)`);
  } else {
    console.log(`  3. Email will be sent to: ${invoiceData.customerEmail}`);
  }
  
  console.log('\nSending email...');
  
  try {
    const result = await sendOrderConfirmationWithDocuments(invoiceData);
    
    if (result.success) {
      console.log('\n✅ SUCCESS! Email sent successfully!\n');
      console.log('Check your inbox for:');
      console.log(`  Subject: Order Confirmation & Documents - ${invoiceData.orderNumber}`);
      console.log('  Attachment: PDF with Payment Receipt + Invoice');
      console.log('\n💡 If you don\'t see it, check your spam folder!');
    } else {
      console.log(`\n❌ FAILED to send email: ${result.error}\n`);
    }
  } catch (error: any) {
    console.log(`\n❌ ERROR: ${error.message}\n`);
    console.error(error);
  }
  
  // Cleanup
  await prisma.$disconnect();
  
  console.log('\n='.repeat(60));
  console.log('\n✅ Test completed!\n');
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});





