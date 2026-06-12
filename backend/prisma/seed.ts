import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test',
      lastName: 'User',
      supabaseId: 'test-user-supabase-id',
      provider: 'email',
    },
  });
  console.log('✅ Created user:', user.email);

  // Create test admin
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      lastName: 'User',
      supabaseId: 'test-admin-supabase-id',
      position: 'CHAIR', // Enum value defined in schema
    },
  });
  console.log('✅ Created admin:', admin.email);

  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Test credentials:');
  console.log('  User:  test@example.com (Supabase Auth)');
  console.log('  Admin: admin@example.com (Supabase Auth)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
