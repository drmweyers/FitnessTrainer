/**
 * Test credentials for development and testing
 * These should be used for seeding the database with test users
 */

export const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@fitmeal.pro',
    password: 'AdminPass123',
    role: 'admin' as const,
    name: 'Admin User',
  },
  trainer: {
    email: 'trainer.test@evofitmeals.com',
    password: 'TestTrainer123!',
    role: 'trainer' as const,
    name: 'Test Trainer',
  },
  client: {
    email: 'customer.test@evofitmeals.com',
    password: 'TestCustomer123!',
    role: 'client' as const,
    name: 'Test Customer',
  },
};

// Environment-based check to ensure these aren't used in production accidentally
export const getTestCredentials = () => {
  const isProductionSafe = process.env.ALLOW_TEST_CREDENTIALS === 'true';
  
  if (process.env.NODE_ENV === 'production' && !isProductionSafe) {
    console.warn('⚠️  Test credentials requested in production without explicit permission');
    return null;
  }
  
  return TEST_CREDENTIALS;
};

export default TEST_CREDENTIALS;