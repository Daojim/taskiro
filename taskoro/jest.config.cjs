/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  projects: [
    {
      displayName: 'server',
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
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}',
      ],
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.json',
          },
        ],
      },
      collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/main.tsx',
        '!src/vite-env.d.ts',
      ],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
    },
  ],
};
