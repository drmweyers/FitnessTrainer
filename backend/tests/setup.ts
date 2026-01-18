import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

// Mock the real Prisma and Redis clients during tests
let mockPrisma: any;
let mockRedis: any;

// Mock logger module to avoid import issues
jest.mock('../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  },
}));

// Mock EmailService to prevent actual email sending and transporter initialization issues
jest.mock('../src/services/emailService', () => {
  const mockSendEmail = jest.fn().mockResolvedValue(undefined);
  const mockSendEmailVerification = jest.fn().mockResolvedValue(undefined);
  const mockSendPasswordReset = jest.fn().mockResolvedValue(undefined);
  const mockSendWelcomeEmail = jest.fn().mockResolvedValue(undefined);
  const mockSendClientInvitation = jest.fn().mockResolvedValue(undefined);
  const mockSendSecurityNotification = jest.fn().mockResolvedValue(undefined);
  const mockVerifyConnection = jest.fn().mockResolvedValue(true);

  return {
    emailService: {
      sendEmail: mockSendEmail,
      sendEmailVerification: mockSendEmailVerification,
      sendPasswordReset: mockSendPasswordReset,
      sendWelcomeEmail: mockSendWelcomeEmail,
      sendClientInvitation: mockSendClientInvitation,
      sendSecurityNotification: mockSendSecurityNotification,
      verifyConnection: mockVerifyConnection,
    },
    EmailService: jest.fn().mockImplementation(() => ({
      sendEmail: mockSendEmail,
      sendEmailVerification: mockSendEmailVerification,
      sendPasswordReset: mockSendPasswordReset,
      sendWelcomeEmail: mockSendWelcomeEmail,
      sendClientInvitation: mockSendClientInvitation,
      sendSecurityNotification: mockSendSecurityNotification,
      verifyConnection: mockVerifyConnection,
    })),
  };
});

// Setup test database and Redis connections
beforeAll(async () => {
  // For tests, we'll use a mock or test database
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.BCRYPT_ROUNDS = '4'; // Faster for tests
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterAll(async () => {
  // Cleanup after all tests
  if (mockPrisma?.$disconnect) {
    await mockPrisma.$disconnect();
  }
  if (mockRedis?.disconnect) {
    await mockRedis.disconnect();
  }
});

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

export { mockPrisma, mockRedis };
