const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  displayName: 'EvoFit Schedule Tests',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  testRegex: [
    '/__tests__/.*\\.(ts|tsx|js)$',
    '\\.(spec|test)\\.(ts|tsx|js)$'
  ],

  // Don't ignore worktrees when running from within
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.next/',
    '/backend/',
    '/dist/',
    '/out/',
    '/tests/e2e/',
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },

  forceExit: true,

  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$|uuid|nanoid))',
  ],

  verbose: false,
  clearMocks: true,
  restoreMocks: true,
};

module.exports = createJestConfig(customJestConfig);
