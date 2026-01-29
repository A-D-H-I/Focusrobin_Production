/**
 * Migration Script: Update Database URLs from Google Drive to S3
 * 
 * This script updates all image URLs in the database to point to S3
 * 
 * Usage: npx tsx scripts/migrate-urls-to-s3.ts
 */

import { prisma } from '../src/lib/prisma';

// Your S3 configuration
const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || 'focusrobin-images';
const S3_REGION = process.env.AWS_S3_REGION || 'eu-west-1';
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

// Mapping function to convert old URLs to new S3 URLs
// Customize this based on your URL structure
function mapUrlToS3(oldUrl: string, type: 'product' | 'category' | 'hero' | 'instagram' | 'other'): string {
  // If already S3 URL, return as-is
  if (oldUrl.includes('s3.amazonaws.com')) {
    return oldUrl;
  }

  // Extract filename from old URL
  const filename = oldUrl.split('/').pop() || 'unnamed.jpg';

  // Map to S3 folder structure
  switch (type) {
    case 'product':
      return `${S3_BASE_URL}/products/${filename}`;
    case 'category':
      return `${S3_BASE_URL}/categories/${filename}`;
    case 'hero':
      return `${S3_BASE_URL}/hero/${filename}`;
    case 'instagram':
      return `${S3_BASE_URL}/instagram/${filename}`;
    default:
      return `${S3_BASE_URL}/other/${filename}`;
  }
}

async function migrateProductAssets() {
  console.log('\n📦 Migrating Product Assets...');
  
  const assets = await prisma.productAsset.findMany({
    where: {
      NOT: {
        url: { contains: 's3.amazonaws.com' }
      }
    }
  });

  console.log(`Found ${assets.length} product assets to migrate`);

  let updated = 0;
  for (const asset of assets) {
    try {
      const newUrl = mapUrlToS3(asset.url, 'product');
      
      await prisma.productAsset.update({
        where: { id: asset.id },
        data: { url: newUrl }
      });
      
      console.log(`  ✓ ${asset.id}: ${asset.url} → ${newUrl}`);
      updated++;
    } catch (error) {
      console.error(`  ✗ Failed to update ${asset.id}:`, error);
    }
  }

  console.log(`✅ Updated ${updated}/${assets.length} product assets`);
  return updated;
}

async function migrateCategoryImages() {
  console.log('\n🏷️  Migrating Category Images...');
  
  const categories = await prisma.categoryImage.findMany({
    where: {
      NOT: {
        imageUrl: { contains: 's3.amazonaws.com' }
      }
    }
  });

  console.log(`Found ${categories.length} category images to migrate`);

  let updated = 0;
  for (const category of categories) {
    try {
      const newUrl = mapUrlToS3(category.imageUrl, 'category');
      const newMobileUrl = category.mobileTabletImageUrl 
        ? mapUrlToS3(category.mobileTabletImageUrl, 'category')
        : null;

      await prisma.categoryImage.update({
        where: { id: category.id },
        data: { 
          imageUrl: newUrl,
          mobileTabletImageUrl: newMobileUrl
        }
      });
      
      console.log(`  ✓ ${category.category}: ${category.imageUrl} → ${newUrl}`);
      updated++;
    } catch (error) {
      console.error(`  ✗ Failed to update ${category.id}:`, error);
    }
  }

  console.log(`✅ Updated ${updated}/${categories.length} category images`);
  return updated;
}

async function migrateHeroImages() {
  console.log('\n🎯 Migrating Hero Images...');
  
  const heroes = await prisma.heroImage.findMany({
    where: {
      OR: [
        { NOT: { desktopImageUrl: { contains: 's3.amazonaws.com' } } },
        { NOT: { mobileImageUrl: { contains: 's3.amazonaws.com' } } }
      ]
    }
  });

  console.log(`Found ${heroes.length} hero images to migrate`);

  let updated = 0;
  for (const hero of heroes) {
    try {
      const updates: any = {};
      
      if (!hero.desktopImageUrl.includes('s3.amazonaws.com')) {
        updates.desktopImageUrl = mapUrlToS3(hero.desktopImageUrl, 'hero');
      }
      
      if (!hero.mobileImageUrl.includes('s3.amazonaws.com')) {
        updates.mobileImageUrl = mapUrlToS3(hero.mobileImageUrl, 'hero');
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.heroImage.update({
          where: { id: hero.id },
          data: updates
        });
        
        console.log(`  ✓ Hero ${hero.id} updated`);
        updated++;
      }
    } catch (error) {
      console.error(`  ✗ Failed to update ${hero.id}:`, error);
    }
  }

  console.log(`✅ Updated ${updated}/${heroes.length} hero images`);
  return updated;
}

async function migrateInstagramImages() {
  console.log('\n📸 Migrating Instagram Images...');
  
  const instagrams = await prisma.instagramImage.findMany({
    where: {
      NOT: {
        imageUrl: { contains: 's3.amazonaws.com' }
      }
    }
  });

  console.log(`Found ${instagrams.length} Instagram images to migrate`);

  let updated = 0;
  for (const instagram of instagrams) {
    try {
      const newUrl = mapUrlToS3(instagram.imageUrl, 'instagram');
      
      await prisma.instagramImage.update({
        where: { id: instagram.id },
        data: { imageUrl: newUrl }
      });
      
      console.log(`  ✓ ${instagram.id}: ${instagram.imageUrl} → ${newUrl}`);
      updated++;
    } catch (error) {
      console.error(`  ✗ Failed to update ${instagram.id}:`, error);
    }
  }

  console.log(`✅ Updated ${updated}/${instagrams.length} Instagram images`);
  return updated;
}

async function migrateIconicImages() {
  console.log('\n⭐ Migrating Iconic Images...');
  
  const iconics = await prisma.iconicImage.findMany({
    where: {
      NOT: {
        imageUrl: { contains: 's3.amazonaws.com' }
      }
    }
  });

  console.log(`Found ${iconics.length} iconic images to migrate`);

  let updated = 0;
  for (const iconic of iconics) {
    try {
      const newUrl = mapUrlToS3(iconic.imageUrl, 'other');
      const newMobileUrl = iconic.mobileTabletImageUrl
        ? mapUrlToS3(iconic.mobileTabletImageUrl, 'other')
        : null;

      await prisma.iconicImage.update({
        where: { id: iconic.id },
        data: { 
          imageUrl: newUrl,
          mobileTabletImageUrl: newMobileUrl
        }
      });
      
      console.log(`  ✓ ${iconic.id} updated`);
      updated++;
    } catch (error) {
      console.error(`  ✗ Failed to update ${iconic.id}:`, error);
    }
  }

  console.log(`✅ Updated ${updated}/${iconics.length} iconic images`);
  return updated;
}

async function migrateGlassShapes() {
  console.log('\n👓 Migrating Glass Shape Images...');
  
  const shapes = await prisma.glassShape.findMany({
    where: {
      imageUrl: { not: null },
      NOT: {
        imageUrl: { contains: 's3.amazonaws.com' }
      }
    }
  });

  console.log(`Found ${shapes.length} glass shape images to migrate`);

  let updated = 0;
  for (const shape of shapes) {
    try {
      if (shape.imageUrl) {
        const newUrl = mapUrlToS3(shape.imageUrl, 'other');
        
        await prisma.glassShape.update({
          where: { id: shape.id },
          data: { imageUrl: newUrl }
        });
        
        console.log(`  ✓ ${shape.name}: ${shape.imageUrl} → ${newUrl}`);
        updated++;
      }
    } catch (error) {
      console.error(`  ✗ Failed to update ${shape.id}:`, error);
    }
  }

  console.log(`✅ Updated ${updated}/${shapes.length} glass shape images`);
  return updated;
}

async function main() {
  console.log('🚀 Starting URL Migration to S3');
  console.log(`📦 S3 Bucket: ${S3_BUCKET}`);
  console.log(`🌍 Region: ${S3_REGION}`);
  console.log(`🔗 Base URL: ${S3_BASE_URL}\n`);

  // Confirm before proceeding
  console.log('⚠️  This will update URLs in your database.');
  console.log('⚠️  Make sure you have a database backup!');
  console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Starting migration...');

  const results = {
    productAssets: await migrateProductAssets(),
    categoryImages: await migrateCategoryImages(),
    heroImages: await migrateHeroImages(),
    instagramImages: await migrateInstagramImages(),
    iconicImages: await migrateIconicImages(),
    glassShapes: await migrateGlassShapes(),
  };

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log('='.repeat(50));
  console.log(`Product Assets:    ${results.productAssets} updated`);
  console.log(`Category Images:   ${results.categoryImages} updated`);
  console.log(`Hero Images:       ${results.heroImages} updated`);
  console.log(`Instagram Images:  ${results.instagramImages} updated`);
  console.log(`Iconic Images:     ${results.iconicImages} updated`);
  console.log(`Glass Shapes:      ${results.glassShapes} updated`);
  console.log('='.repeat(50));

  const total = Object.values(results).reduce((sum, val) => sum + val, 0);
  console.log(`\n✅ Total: ${total} URLs migrated to S3`);
  console.log('\n💡 Next steps:');
  console.log('   1. Test your website');
  console.log('   2. Check that all images load correctly');
  console.log('   3. Update admin forms to use ImageUploader component');
}

main()
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });












