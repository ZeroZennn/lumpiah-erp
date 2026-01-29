import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();



async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (in reverse order of dependencies)
  // Note: Skip deletion on fresh database to avoid errors
  console.log('🗑️  Cleaning existing data...');
  // await prisma.auditLog.deleteMany();
  // await prisma.attendance.deleteMany();
  // await prisma.productionRealization.deleteMany();
  // await prisma.productionPlan.deleteMany();
  // await prisma.dssConfig.deleteMany();
  // await prisma.dailyClosing.deleteMany();
  // await prisma.transactionItem.deleteMany();
  // await prisma.transaction.deleteMany();
  // await prisma.branchProductPrice.deleteMany();
  // await prisma.product.deleteMany();
  // await prisma.category.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.branch.deleteMany();
  // await prisma.role.deleteMany();

  // 1. Create Roles
  console.log('👥 Creating roles...');
  const roleAdmin = await prisma.role.create({
    data: { name: 'Admin' },
  });

  const roleOwner = await prisma.role.create({
    data: { name: 'Owner' },
  });

  const rolePegawai = await prisma.role.create({
    data: { name: 'Pegawai' },
  });

  console.log('✅ Roles created:', { roleAdmin, roleOwner, rolePegawai });

  // 2. Create Branch
  console.log('🏢 Creating branch...');
  const branch = await prisma.branch.create({
    data: {
      name: 'Cabang Semarang',
      address: 'Jl. Pandanaran No. 123, Semarang',
      isActive: true,
    },
  });

  console.log('✅ Branch created:', branch);

  // 3. Create Users
  console.log('👤 Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const userSyauqi = await prisma.user.create({
    data: {
      email: 'syauqi@lumpiah.com',
      fullname: 'Syauqi Administrator',
      phoneNumber: '081234567890',
      passwordHash: passwordHash,
      roleId: roleAdmin.id,
      branchId: branch.id,
      isActive: true,
    },
  });

  const userZikran = await prisma.user.create({
    data: {
      email: 'zikran@lumpiah.com',
      fullname: 'Achmad Zikran',
      phoneNumber: '089876543210',
      passwordHash: passwordHash,
      roleId: rolePegawai.id,
      branchId: branch.id,
      isActive: true,
    },
  });

  console.log('✅ Users created:', { userSyauqi, userZikran });

  // 4. Create Categories
  console.log('📂 Creating categories...');
  const categoryLumpia = await prisma.category.create({
    data: { name: 'Lumpia' },
  });

  const categoryMinuman = await prisma.category.create({
    data: { name: 'Minuman' },
  });

  const categoryPaket = await prisma.category.create({
    data: { name: 'Paket' },
  });

  console.log('✅ Categories created');

  // 5. Create Products
  console.log('🍱 Creating products...');
  const products = await Promise.all([
    prisma.product.create({
      data: {
        categoryId: categoryLumpia.id,
        name: 'Lumpia Basah Original',
        unit: 'pcs',
        basePrice: 5000,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: categoryLumpia.id,
        name: 'Lumpia Goreng',
        unit: 'pcs',
        basePrice: 6000,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: categoryMinuman.id,
        name: 'Es Teh Manis',
        unit: 'gelas',
        basePrice: 3000,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: categoryMinuman.id,
        name: 'Es Jeruk',
        unit: 'gelas',
        basePrice: 5000,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: categoryPaket.id,
        name: 'Paket Hemat A',
        unit: 'paket',
        basePrice: 15000,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ ${products.length} products created`);

  // 6. Create Branch Product Prices
  console.log('💰 Creating branch product prices...');
  for (const product of products) {
    await prisma.branchProductPrice.create({
      data: {
        branchId: branch.id,
        productId: product.id,
        price: product.basePrice,
      },
    });
  }

  console.log('✅ Branch product prices created');

  // 7. Create DSS Config
  console.log('⚙️  Creating DSS config...');
  await prisma.dssConfig.create({
    data: {
      branchId: branch.id,
      wmaWeights: [0.5, 0.3, 0.2],
      safetyStockPercent: 20,
    },
  });

  console.log('✅ DSS config created');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📋 Summary:');
  console.log('   - Roles: 3 (Admin, Owner, Pegawai)');
  console.log('   - Branch: 1 (Cabang Semarang)');
  console.log('   - Users: 2 (syauqi@lumpiah.com, zikran@lumpiah.com)');
  console.log('   - Categories: 3');
  console.log(`   - Products: ${products.length}`);
  console.log('   - Default password for all users: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
