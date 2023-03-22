module.exports = {
  testTimeout: 15000,
  collectCoverageFrom: ['src/**/*.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  resetModules: true,
  testMatch: ['<rootDir>/test/**/*.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  modulePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/node_modules/',
    '<rootDir>/test/__utils__',
    '<rootDir>/test/__fixtures__',
  ],
  testEnvironment: "node"
};
