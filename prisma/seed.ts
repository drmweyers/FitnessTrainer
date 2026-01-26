import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test trainer user
  const passwordHash = await bcrypt.hash('TestTrainer123!', 10);

  const user = await prisma.user.upsert({
    where: { email: 'trainer.test@evofitmeals.com' },
    update: {},
    create: {
      email: 'trainer.test@evofitmeals.com',
      passwordHash,
      role: 'trainer',
      isActive: true,
      isVerified: true,
    },
  });

  console.log('Created test trainer:', user.email);

  // Create test client user
  const clientPasswordHash = await bcrypt.hash('TestClient123!', 10);

  const client = await prisma.user.upsert({
    where: { email: 'client.test@evofitmeals.com' },
    update: {},
    create: {
      email: 'client.test@evofitmeals.com',
      passwordHash: clientPasswordHash,
      role: 'client',
      isActive: true,
      isVerified: true,
    },
  });

  console.log('Created test client:', client.email);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
