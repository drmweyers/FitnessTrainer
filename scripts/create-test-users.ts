/**
 * Create Test Users for Demo
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('Creating test users...');

  // Hash password
  const passwordHash = await bcrypt.hash('Test123!', 12);

  // Create trainer
  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@evofit.com' },
    update: {},
    create: {
      email: 'trainer@evofit.com',
      passwordHash,
      role: 'trainer',
      isActive: true,
      isVerified: true,
    },
  });

  console.log(`✓ Trainer account: trainer@evofit.com / Test123!`);

  // Create client
  const client = await prisma.user.upsert({
    where: { email: 'client@evofit.com' },
    update: {},
    create: {
      email: 'client@evofit.com',
      passwordHash,
      role: 'client',
      isActive: true,
      isVerified: true,
    },
  });

  console.log(`✓ Client account: client@evofit.com / Test123!`);

  console.log('\n✅ Test users created successfully!');
  console.log('\nTest Accounts:');
  console.log('  Trainer: trainer@evofit.com / Test123!');
  console.log('  Client:  client@evofit.com / Test123!');
}

createTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
