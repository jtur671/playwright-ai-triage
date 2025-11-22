# Unit Tests

This directory contains unit tests for utility functions used throughout the project.

## Test Structure

```
utils/
├── testHelpers.js           # Utility functions (extracted for testing)
└── __tests__/
    ├── testHelpers.test.js  # Tests for core utilities
    └── buildHtml.test.js    # Tests for HTML generation
```

## Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
node --test utils/__tests__/testHelpers.test.js
```

## Test Coverage

### `testHelpers.test.js`

Tests for utility functions extracted from the main application code:

- **`collectFailedTests()`** - Parses Playwright JSON report structure
  - ✅ Empty suites
  - ✅ Flat structure with failed tests
  - ✅ Timed out tests
  - ✅ Nested suites
  - ✅ Ignoring passed tests
  - ✅ Missing optional fields

- **`stripMarkdownFences()`** - Cleans generated code from markdown
  - ✅ JavaScript code fences
  - ✅ Plain code fences
  - ✅ Multiple fences
  - ✅ Whitespace trimming

- **`extractBaseUrl()`** - Extracts base URL from story files
  - ✅ HTTP/HTTPS URLs
  - ✅ Case insensitive matching
  - ✅ Missing URLs

- **`extractStoryTitle()`** - Extracts title from story files
  - ✅ Title extraction
  - ✅ Case insensitive matching
  - ✅ Titles with colons

- **`extractAcceptanceCriteria()`** - Parses acceptance criteria
  - ✅ List extraction
  - ✅ Empty criteria
  - ✅ Section boundaries

### `buildHtml.test.js`

Tests for HTML report generation:

- ✅ Empty analyses
- ✅ Single analysis
- ✅ Multiple analyses
- ✅ HTML escaping (XSS prevention)
- ✅ Missing optional fields
- ✅ CSS inclusion

## Why These Tests?

These unit tests focus on **pure functions** that:
1. Don't require external dependencies (file system, API calls)
2. Have clear input/output contracts
3. Are critical to the application's functionality

### Functions NOT Tested (Yet)

These require more complex mocking or integration testing:
- `generateForStory()` - Requires OpenAI API mocking + file system mocking
- `main()` in `analyzeFailures.js` - Requires full integration test
- `generateTest.js` main function - Requires file system + OpenAI mocking

## Future Test Ideas

1. **Integration Tests** - Test the full workflow with mocked OpenAI API
2. **Story Parser Tests** - More robust parsing of various story formats
3. **Error Handling Tests** - Test behavior with malformed inputs
4. **Performance Tests** - Test large report processing

## Test Framework

We use **Node.js built-in test runner** (available since Node 18+):
- No external dependencies required
- Fast execution
- Native ES modules support
- Good enough for unit tests

For more complex scenarios, consider:
- **Vitest** - Fast, modern, great DX
- **Jest** - Popular, feature-rich
- **Mocha + Chai** - Flexible, widely used

