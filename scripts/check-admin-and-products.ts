import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminAndProducts() {
  try {
    console.log('🔍 Checking Admin Access and Products...\n');

    // 1. Check Admin Users
    console.log('📋 Admin Users:');
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach((user) => {
        console.log(`   - ${user.email} (Role: ${user.role})`);
      });
    }

    // 2. Check All Users and their roles
    console.log('\n📋 All Users:');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
      },
      take: 10,
    });
    console.log(`Total users: ${allUsers.length}`);
    allUsers.forEach((user) => {
      console.log(`   - ${user.email}: ${user.role}`);
    });

    // 3. Check Products
    console.log('\n📦 Products:');
    const products = await prisma.product.findMany({
      include: {
        ProductVariant: {
          include: {
            ProductAsset: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Total products: ${products.length}`);

    if (products.length === 0) {
      console.log('❌ No products found!');
    } else {
      console.log('\n📊 Product Details:');
      products.forEach((product, index) => {
        const variantCount = product.ProductVariant.length;
        const totalAssets = product.ProductVariant.reduce(
          (sum, variant) => sum + variant.ProductAsset.length,
          0
        );
        
        console.log(`\n${index + 1}. ${product.name} (${product.slug})`);
        console.log(`   Variants: ${variantCount}`);
        console.log(`   Total Assets: ${totalAssets}`);
        
        if (variantCount === 0) {
          console.log('   ⚠️  WARNING: No variants found!');
        } else {
          product.ProductVariant.forEach((variant, vIndex) => {
            const assetCount = variant.ProductAsset.length;
            console.log(`   Variant ${vIndex + 1}: ${variant.name} (${variant.colorName})`);
            console.log(`     Assets: ${assetCount}`);
            
            if (assetCount === 0) {
              console.log(`     ⚠️  WARNING: No assets for this variant!`);
            } else {
              variant.ProductAsset.forEach((asset) => {
                console.log(`     - ${asset.type}: ${asset.url} ${asset.isPrimary ? '(Primary)' : ''}`);
              });
            }
          });
        }
      });
    }

    // 4. Check for products with missing assets
    console.log('\n⚠️  Products with Issues:');
    const productsWithIssues = products.filter(
      (p) => p.ProductVariant.length === 0 || 
      p.ProductVariant.some((v) => v.ProductAsset.length === 0)
    );

    if (productsWithIssues.length === 0) {
      console.log('✅ All products have variants and assets!');
    } else {
      console.log(`❌ Found ${productsWithIssues.length} product(s) with issues:`);
      productsWithIssues.forEach((product) => {
        console.log(`   - ${product.name} (${product.slug})`);
        if (product.ProductVariant.length === 0) {
          console.log(`     Missing: Variants`);
        } else {
          product.ProductVariant.forEach((variant) => {
            if (variant.ProductAsset.length === 0) {
              console.log(`     Missing: Assets for variant "${variant.name}"`);
            }
          });
        }
      });
    }

    console.log('\n✅ Check complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminAndProducts();

