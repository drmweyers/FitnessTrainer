const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  displayName: 'EvoFit Frontend Tests',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',

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

  // Use testRegex instead of testMatch to avoid glob issues in worktree paths
  testRegex: [
    '/__tests__/.*\\.(ts|tsx|js)$',
    '\\.(spec|test)\\.(ts|tsx|js)$'
  ],

  collectCoverageFrom: [
    'app/api/**/*.(ts|tsx)',
    'components/**/*.(ts|tsx)',
    'lib/**/*.(ts|tsx)',
    'hooks/**/*.(ts|tsx)',
    'services/**/*.(ts|tsx)',
    'contexts/**/*.(ts|tsx)',
    '!**/*.d.ts',
    '!**/types.ts',
    '!**/*.stories.(ts|tsx)',
    '!**/node_modules/**',
    '!components/ui/**',
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

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },

  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.next/',
    '/backend/',
    '/dist/',
    '/out/',
    '/\\.auto-claude/',
    // Skip .worktrees/ ONLY if we're in the main project (not running from within a worktree)
    ...(process.cwd().includes('.worktrees') ? [] : ['/\\.worktrees/']),
    '/tests/e2e/',
  ],

  forceExit: true,

  modulePathIgnorePatterns: [
    '/\\.auto-claude/',
    // Skip .worktrees/ ONLY if we're in the main project (not running from within a worktree)
    ...(process.cwd().includes('.worktrees') ? [] : ['/\\.worktrees/']),
  ],

  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$|uuid|nanoid|@radix-ui|framer-motion))',
  ],

  verbose: false,
  clearMocks: true,
  restoreMocks: true,
};

module.exports = createJestConfig(customJestConfig);
