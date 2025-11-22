// utils/testHelpers.js
// Extracted utility functions for unit testing

/**
 * Collect failed tests from Playwright report suites
 * @param {Array} suites - Array of test suites from Playwright report
 * @returns {Array} Array of failed test objects
 */
export function collectFailedTests(suites = []) {
  const failed = [];

  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const overallStatus = test.status;
        const hasFailedResult = (test.results || []).some(
          r => r.status === 'failed' || r.status === 'timedOut'
        );

        if (overallStatus === 'failed' || hasFailedResult) {
          failed.push({
            title: spec.title,
            project: test.projectName,
            status: overallStatus,
            results: test.results || [],
          });
        }
      }
    }

    if (suite.suites && suite.suites.length > 0) {
      failed.push(...collectFailedTests(suite.suites));
    }
  }

  return failed;
}

/**
 * Strip markdown code fences from generated code
 * @param {string} code - Code string that may contain markdown fences
 * @returns {string} Cleaned code string
 */
export function stripMarkdownFences(code) {
  return code
    .replace(/```[a-zA-Z]*/g, '')
    .replace(/```/g, '')
    .trim();
}

/**
 * Extract Base URL from story content
 * @param {string} storyContent - Story markdown content
 * @returns {string|null} Base URL if found, null otherwise
 */
export function extractBaseUrl(storyContent) {
  const baseUrlMatch = storyContent.match(/Base URL:\s*(https?:\/\/[^\s]+)/i);
  return baseUrlMatch ? baseUrlMatch[1].trim() : null;
}

/**
 * Extract title from story content
 * @param {string} storyContent - Story markdown content
 * @returns {string|null} Title if found, null otherwise
 */
export function extractStoryTitle(storyContent) {
  const titleMatch = storyContent.match(/Title:\s*(.+)/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * Extract acceptance criteria from story content
 * @param {string} storyContent - Story markdown content
 * @returns {Array<string>} Array of acceptance criteria lines
 */
export function extractAcceptanceCriteria(storyContent) {
  const lines = storyContent.split('\n');
  const criteria = [];
  let inCriteria = false;

  for (const line of lines) {
    if (line.toLowerCase().includes('acceptance criteria')) {
      inCriteria = true;
      continue;
    }
    if (inCriteria) {
      if (line.trim().startsWith('-')) {
        criteria.push(line.trim());
      } else if (line.trim() && !line.match(/^[A-Z]/)) {
        // Continue collecting if line starts with lowercase (continuation)
        criteria.push(line.trim());
      } else if (line.trim() && line.match(/^[A-Z]/) && !line.startsWith('-')) {
        // Stop if we hit a new section (capital letter, not a list item)
        break;
      }
    }
  }

  return criteria;
}

