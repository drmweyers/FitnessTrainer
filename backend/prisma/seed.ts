import { PrismaClient } from '@prisma/client';
import { passwordService } from '../src/services/passwordService';
import { TEST_CREDENTIALS } from '../src/config/testCredentials';
import { logger } from '../src/config/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seed...');

  // Create test users with the provided credentials
  for (const [userType, credentials] of Object.entries(TEST_CREDENTIALS)) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (existingUser) {
        logger.info(`User ${credentials.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const passwordHash = await passwordService.hashPassword(credentials.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: credentials.email,
          passwordHash,
          role: credentials.role,
          isActive: true,
          isVerified: true, // Pre-verified for test users
        },
      });

      logger.info(`✅ Created ${userType} user: ${credentials.email}`);

      // For admin user, create some additional audit logs
      if (credentials.role === 'admin') {
        await prisma.securityAuditLog.create({
          data: {
            userId: user.id,
            eventType: 'account_created',
            success: true,
            ipAddress: '127.0.0.1',
            userAgent: 'Seed Script',
          },
        });
      }

    } catch (error) {
      logger.error(`Failed to create ${userType} user:`, error);
    }
  }

  // Create some sample data for development
  logger.info('🌱 Creating sample development data...');

  // Get trainer and client users
  const trainerUser = await prisma.user.findUnique({
    where: { email: TEST_CREDENTIALS.trainer.email },
  });

  const clientUser = await prisma.user.findUnique({
    where: { email: TEST_CREDENTIALS.client.email },
  });

  // Future: Create trainer-client relationships when Epic 003 is implemented
  if (trainerUser && clientUser) {
    logger.info('Trainer and client users ready for future relationships (Epic 003)');
  }

  logger.info('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    logger.error('Database seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });