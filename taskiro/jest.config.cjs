/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server'],
  testMatch: [
    '<rootDir>/server/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/server/**/*.(test|spec).{js,jsx,ts,tsx}',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/server/tsconfig.json',
      },
    ],
  },
  collectCoverageFrom: [
    'server/**/*.{ts,tsx}',
    '!server/**/*.d.ts',
    '!server/node_modules/**',
    '!server/dist/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/server/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/server/$1',
  },
};
