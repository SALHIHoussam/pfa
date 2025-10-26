module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(axios)/)"
  ],
  moduleFileExtensions: ["js", "jsx", "json", "node"],
  collectCoverage: true,              // <-- activer la couverture
  coverageDirectory: "coverage",      // <-- dossier de sortie
  coverageReporters: ["lcov", "text"] // <-- SonarQube lit 'lcov'
};
