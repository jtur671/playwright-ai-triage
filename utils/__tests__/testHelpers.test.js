// utils/__tests__/testHelpers.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  collectFailedTests,
  stripMarkdownFences,
  extractBaseUrl,
  extractStoryTitle,
  extractAcceptanceCriteria,
} from '../testHelpers.js';

describe('collectFailedTests', () => {
  test('should return empty array for empty suites', () => {
    assert.deepStrictEqual(collectFailedTests([]), []);
    assert.deepStrictEqual(collectFailedTests(), []);
  });

  test('should find failed tests in flat structure', () => {
    const suites = [{
      specs: [{
        title: 'Login test',
        tests: [{
          status: 'failed',
          projectName: 'chromium',
          results: [{ status: 'failed' }],
        }],
      }],
    }];

    const result = collectFailedTests(suites);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].title, 'Login test');
    assert.strictEqual(result[0].status, 'failed');
  });

  test('should find timedOut tests', () => {
    const suites = [{
      specs: [{
        title: 'Slow test',
        tests: [{
          status: 'passed',
          projectName: 'chromium',
          results: [{ status: 'timedOut' }],
        }],
      }],
    }];

    const result = collectFailedTests(suites);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].title, 'Slow test');
  });

  test('should handle nested suites', () => {
    const suites = [{
      specs: [{
        title: 'Parent test',
        tests: [{
          status: 'passed',
          projectName: 'chromium',
          results: [],
        }],
      }],
      suites: [{
        specs: [{
          title: 'Child test',
          tests: [{
            status: 'failed',
            projectName: 'chromium',
            results: [{ status: 'failed' }],
          }],
        }],
      }],
    }];

    const result = collectFailedTests(suites);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].title, 'Child test');
  });

  test('should ignore passed tests', () => {
    const suites = [{
      specs: [{
        title: 'Passed test',
        tests: [{
          status: 'passed',
          projectName: 'chromium',
          results: [{ status: 'passed' }],
        }],
      }],
    }];

    const result = collectFailedTests(suites);
    assert.strictEqual(result.length, 0);
  });

  test('should handle missing optional fields', () => {
    const suites = [{
      specs: [{
        title: 'Test with missing fields',
        tests: [{
          status: 'failed',
          results: [],
        }],
      }],
    }];

    const result = collectFailedTests(suites);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].project, undefined);
  });
});

describe('stripMarkdownFences', () => {
  test('should remove JavaScript code fences', () => {
    const code = '```javascript\nconst x = 1;\n```';
    assert.strictEqual(stripMarkdownFences(code), 'const x = 1;');
  });

  test('should remove plain code fences', () => {
    const code = '```\nconst x = 1;\n```';
    assert.strictEqual(stripMarkdownFences(code), 'const x = 1;');
  });

  test('should handle code without fences', () => {
    const code = 'const x = 1;';
    assert.strictEqual(stripMarkdownFences(code), 'const x = 1;');
  });

  test('should handle multiple fences', () => {
    const code = '```js\nconst x = 1;\n```\n```\nconst y = 2;\n```';
    const result = stripMarkdownFences(code);
    // Should remove fences, allow newlines between code blocks
    assert(result.includes('const x = 1;'));
    assert(result.includes('const y = 2;'));
    assert(!result.includes('```'));
  });

  test('should trim whitespace', () => {
    const code = '```\n  const x = 1;\n  ```  ';
    assert.strictEqual(stripMarkdownFences(code), 'const x = 1;');
  });
});

describe('extractBaseUrl', () => {
  test('should extract HTTP base URL', () => {
    const story = 'Base URL: http://example.com\nSome text';
    assert.strictEqual(extractBaseUrl(story), 'http://example.com');
  });

  test('should extract HTTPS base URL', () => {
    const story = 'Base URL: https://the-internet.herokuapp.com\nSome text';
    assert.strictEqual(extractBaseUrl(story), 'https://the-internet.herokuapp.com');
  });

  test('should handle case insensitive matching', () => {
    const story = 'base url: https://example.com';
    assert.strictEqual(extractBaseUrl(story), 'https://example.com');
  });

  test('should return null if no base URL found', () => {
    const story = 'Some story without base URL';
    assert.strictEqual(extractBaseUrl(story), null);
  });

  test('should handle URLs with trailing slashes', () => {
    const story = 'Base URL: https://example.com/';
    assert.strictEqual(extractBaseUrl(story), 'https://example.com/');
  });
});

describe('extractStoryTitle', () => {
  test('should extract title from story', () => {
    const story = 'Title: Login - valid credentials\nSome text';
    assert.strictEqual(extractStoryTitle(story), 'Login - valid credentials');
  });

  test('should handle case insensitive matching', () => {
    const story = 'title: Checkboxes test';
    assert.strictEqual(extractStoryTitle(story), 'Checkboxes test');
  });

  test('should return null if no title found', () => {
    const story = 'Some story without title';
    assert.strictEqual(extractStoryTitle(story), null);
  });

  test('should handle titles with colons', () => {
    const story = 'Title: Test: With: Colons';
    assert.strictEqual(extractStoryTitle(story), 'Test: With: Colons');
  });
});

describe('extractAcceptanceCriteria', () => {
  test('should extract acceptance criteria list', () => {
    const story = `
Title: Test

Acceptance criteria:
- Navigate to /login
- Fill in username
- Click button
    `;

    const criteria = extractAcceptanceCriteria(story);
    assert.strictEqual(criteria.length, 3);
    assert.strictEqual(criteria[0], '- Navigate to /login');
    assert.strictEqual(criteria[1], '- Fill in username');
  });

  test('should handle empty acceptance criteria', () => {
    const story = 'Acceptance criteria:\n\nSome other text';
    const criteria = extractAcceptanceCriteria(story);
    assert.strictEqual(criteria.length, 0);
  });

  test('should stop at next section', () => {
    const story = `
Acceptance criteria:
- Item 1
- Item 2

Another Section:
- Should not be included
    `;

    const criteria = extractAcceptanceCriteria(story);
    assert.strictEqual(criteria.length, 2);
  });

  test('should return empty array if no acceptance criteria', () => {
    const story = 'Just some text without criteria';
    const criteria = extractAcceptanceCriteria(story);
    assert.deepStrictEqual(criteria, []);
  });
});

