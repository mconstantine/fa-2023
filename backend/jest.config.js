/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  transform: { "^.+\\.ts$": "@swc/jest" },
  testEnvironment: "node",
  rootDir: "./src",
  globalSetup: "./setupTests.ts",
}
