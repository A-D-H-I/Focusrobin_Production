import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function checkProductImages() {
  try {
    console.log('🔍 Checking Product Images...\n');

    const products = await prisma.product.findMany({
      include: {
        ProductVariant: {
          include: {
            ProductAsset: true,
          },
        },
      },
    });

    const publicPath = join(process.cwd(), 'public');

    console.log(`Checking ${products.length} products...\n`);

    let totalIssues = 0;

    for (const product of products) {
      console.log(`\n📦 ${product.name} (${product.slug}):`);
      
      if (product.ProductVariant.length === 0) {
        console.log('   ❌ No variants!');
        totalIssues++;
        continue;
      }

      for (const variant of product.ProductVariant) {
        console.log(`   Variant: ${variant.name}`);
        
        if (variant.ProductAsset.length === 0) {
          console.log('     ❌ No assets!');
          totalIssues++;
          continue;
        }

        for (const asset of variant.ProductAsset) {
          // Remove leading slash for file system check
          const imagePath = asset.url.startsWith('/') ? asset.url.slice(1) : asset.url;
          const fullPath = join(publicPath, imagePath);
          const exists = existsSync(fullPath);

          if (exists) {
            console.log(`     ✅ ${asset.type}: ${asset.url}`);
          } else {
            console.log(`     ❌ ${asset.type}: ${asset.url} (FILE NOT FOUND)`);
            console.log(`        Expected at: ${fullPath}`);
            totalIssues++;
          }
        }
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   Total Products: ${products.length}`);
    console.log(`   Issues Found: ${totalIssues}`);

    if (totalIssues === 0) {
      console.log('   ✅ All images are accessible!');
    } else {
      console.log('\n💡 Tips:');
      console.log('   - Check that image paths in database match files in /public folder');
      console.log('   - Image paths should be relative to /public (e.g., /Products_new/Agnes - Dame Wood/t.jpg)');
      console.log('   - Use the admin panel to update product assets with correct paths');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductImages();

