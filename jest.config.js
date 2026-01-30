const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  displayName: 'EvoFit Frontend Tests',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  
  // Module name mapping for absolute imports and static assets
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/lib/types/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // Test patterns
  testMatch: [
    '<rootDir>/tests/**/*.spec.(ts|tsx|js)',
    '<rootDir>/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/**/?(*.)(spec|test).(ts|tsx|js)'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.(ts|tsx)',
    'components/**/*.(ts|tsx)',
    'lib/**/*.(ts|tsx)',
    '!**/*.d.ts',
    '!**/types.ts',
    '!**/*.stories.(ts|tsx)',
    '!**/node_modules/**',
  ],
  
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Global setup and teardown
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/backend/',
    '<rootDir>/dist/',
    '<rootDir>/out/',
    '<rootDir>/.auto-claude/',
    '<rootDir>/tests/e2e/',
  ],
  // Explicitly exclude Playwright tests
  testMatch: [
    '<rootDir>/tests/unit/**/*.spec.(ts|tsx|js)',
    '<rootDir>/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/**/?(*.)(spec|test).(ts|tsx|js)'
  ],
  // Exclude Playwright test files
  forceExit: true,
  modulePathIgnorePatterns: [
    '<rootDir>/.auto-claude/',
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$|uuid|nanoid|@radix-ui|framer-motion))',
  ],
  
  // Verbose output for debugging
  verbose: false,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Automatically restore mock state between every test
  restoreMocks: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);