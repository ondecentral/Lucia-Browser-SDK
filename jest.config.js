module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Mocks out all these file formats when tests are run
    '\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'identity-obj-proxy',
  },
  roots: ['./src'],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['**/*.(test|spec).ts'],
  testPathIgnorePatterns: ['node_modules/'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};
