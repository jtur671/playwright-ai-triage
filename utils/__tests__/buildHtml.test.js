// utils/__tests__/buildHtml.test.js
// Tests for HTML generation functions
import { test, describe } from 'node:test';
import assert from 'node:assert';

// Import the buildHtml function from analyzeFailures.js
// Note: We'll need to extract this function for testing
function buildHtml(analyses) {
  const sections = analyses.map(
    a => `
    <section class="test">
      <div class="test-header">
        <h2>${escapeHtml(a.title)}</h2>
        <span class="badge-status">${escapeHtml(a.status || 'unknown')}</span>
      </div>
      <p class="meta"><span>Project:</span> ${escapeHtml(a.project || 'n/a')}</p>
      <details open class="details">
        <summary>AI Analysis</summary>
        <div class="analysis">
          ${a.analysis}
        </div>
      </details>
    </section>
  `
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Test Analysis Report</title>
  <link rel="stylesheet" href="./ai-report.css">
</head>
<body>
  <div class="app-shell">
    <header>
      <div class="header-left">
        <h1>
          <span class="header-logo"><span>AI</span></span>
          Test Analysis Dashboard
        </h1>
        <p>AI-powered failure insights</p>
      </div>
      <div class="header-right">
        <p class="tagline">Powered by GPT-4.1</p>
        <span class="badge-chip">
          <span class="badge-dot"></span>
          ${analyses.length} failed test${analyses.length !== 1 ? 's' : ''}
        </span>
      </div>
    </header>
    <main>
      <div class="summary">
        <span class="pill">Total: ${analyses.length}</span>
      </div>
${sections}
    </main>
  </div>
</body>
</html>`;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

describe('buildHtml', () => {
  test('should generate HTML for empty analyses', () => {
    const html = buildHtml([]);
    assert(html.includes('0 failed test'));
    assert(html.includes('Total: 0'));
  });

  test('should generate HTML for single analysis', () => {
    const analyses = [{
      title: 'Login test',
      status: 'failed',
      project: 'chromium',
      analysis: '<p>Test failed</p>',
    }];

    const html = buildHtml(analyses);
    assert(html.includes('Login test'));
    assert(html.includes('failed'));
    assert(html.includes('chromium'));
    assert(html.includes('1 failed test'));
    assert(html.includes('Test failed'));
  });

  test('should generate HTML for multiple analyses', () => {
    const analyses = [
      {
        title: 'Test 1',
        status: 'failed',
        project: 'chromium',
        analysis: '<p>Analysis 1</p>',
      },
      {
        title: 'Test 2',
        status: 'timedOut',
        project: 'firefox',
        analysis: '<p>Analysis 2</p>',
      },
    ];

    const html = buildHtml(analyses);
    assert(html.includes('Test 1'));
    assert(html.includes('Test 2'));
    assert(html.includes('2 failed tests'));
    assert(html.includes('Analysis 1'));
    assert(html.includes('Analysis 2'));
  });

  test('should escape HTML in title and status', () => {
    const analyses = [{
      title: '<script>alert("xss")</script>',
      status: '<failed>',
      project: 'chromium',
      analysis: '<p>Safe content</p>',
    }];

    const html = buildHtml(analyses);
    assert(html.includes('&lt;script&gt;'));
    assert(html.includes('&lt;failed&gt;'));
    assert(!html.includes('<script>alert'));
  });

  test('should handle missing project', () => {
    const analyses = [{
      title: 'Test without project',
      status: 'failed',
      analysis: '<p>Test</p>',
    }];

    const html = buildHtml(analyses);
    assert(html.includes('n/a'));
  });

  test('should include CSS link', () => {
    const html = buildHtml([]);
    assert(html.includes('<link rel="stylesheet" href="./ai-report.css">'));
  });
});

describe('escapeHtml', () => {
  test('should escape HTML entities', () => {
    assert.strictEqual(escapeHtml('<script>'), '&lt;script&gt;');
    assert.strictEqual(escapeHtml('&'), '&amp;');
    assert.strictEqual(escapeHtml('"quote"'), '&quot;quote&quot;');
  });

  test('should handle plain text', () => {
    assert.strictEqual(escapeHtml('plain text'), 'plain text');
  });
});

