import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test account
  const account = await prisma.account.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'test-user-id',
      email: 'test@example.com',
      password: '$2b$10$dummyhashedpassword', // Not a real hash
      name: 'Test',
      lastName: 'User',
      role: 'user',
    },
  });
  console.log('✅ Created account:', account.email);

  // Create test user linked to account
  const user = await prisma.user.upsert({
    where: { accountId: account.id },
    update: {},
    create: {
      id: 'test-user-id', // Same as account for simplicity
      accountId: account.id,
    },
  });
  console.log('✅ Created user:', user.id);

  // Create admin account
  const adminAccount = await prisma.account.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'test-admin-id',
      email: 'admin@example.com',
      password: '$2b$10$dummyhashedpassword',
      name: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  });
  console.log('✅ Created admin account:', adminAccount.email);

  // Create admin record
  const admin = await prisma.admin.upsert({
    where: { accountId: adminAccount.id },
    update: {},
    create: {
      id: 'test-admin-id',
      accountId: adminAccount.id,
      position: 'Chair',
    },
  });
  console.log('✅ Created admin:', admin.id);

  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Test credentials:');
  console.log('  User:  test@example.com (use "dev-token" in Swagger)');
  console.log('  Admin: admin@example.com (use "admin-token" in Swagger)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
