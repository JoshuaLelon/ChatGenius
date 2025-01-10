# Test Suites

This directory contains all test suites organized by type.

## Directory Structure

- `e2e/` - End-to-end tests with Playwright
  - Full user flow testing
  - Browser automation
  - Visual regression tests

- `integration/` - Integration tests
  - API endpoint testing
  - Database interactions
  - Service integration

- `unit/` - Unit tests with Jest
  - Component testing
  - Utility function testing
  - State management testing

## Running Tests

```bash
# Run all tests
npm test

# Run specific suite
npm run test:e2e
npm run test:integration
npm run test:unit

# Run with coverage
npm run test:coverage
```

## Writing Tests

1. Place tests next to code being tested
2. Follow naming convention: `*.test.ts` or `*.spec.ts`
3. Use descriptive test names
4. Implement proper setup/teardown
5. Mock external dependencies

## Best Practices

1. Write tests before fixing bugs
2. Maintain test independence
3. Use meaningful assertions
4. Keep tests focused and simple
5. Update tests with code changes
