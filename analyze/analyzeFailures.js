// analyze/analyzeFailures.js
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLI flag: --html means "also build & open HTML report"
const args = process.argv.slice(2);
const withHtml = args.includes('--html');

// ====== CSS moved out into its own file ======
const REPORT_CSS = `
:root {
  color-scheme: dark;
  --bg: #020617;
  --bg-elevated: #020617;
  --bg-soft: #020617;
  --border-subtle: rgba(31,41,55,0.9);
  --border-accent: rgba(56,189,248,0.7);
  --text-main: #e5e7eb;
  --text-muted: #9ca3af;
  --pill-bg: rgba(15,118,110,0.15);
  --pill-border: rgba(45,212,191,0.35);
  --pill-text: #a5f3fc;
  --status-bg: radial-gradient(circle at top, rgba(248,113,113,0.15), rgba(15,23,42,0.9));
  --status-border: rgba(248,113,113,0.7);
  --status-text: #fecaca;
  --accent: #38bdf8;
  --accent-soft: rgba(56,189,248,0.12);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  margin: 0;
  padding: 0;
  background:
    radial-gradient(circle at top left, #1d293b 0, #020617 45%, #000 100%);
  color: var(--text-main);
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Animated gradient bar at the very top */
.app-shell::before {
  content: "";
  position: fixed;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(90deg,
    #22d3ee,
    #a855f7,
    #f97316,
    #22d3ee);
  background-size: 300% 100%;
  animation: shimmer 9s linear infinite;
  z-index: 50;
}

@keyframes shimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

header {
  padding: 1.4rem 2.2rem 1.3rem;
  background: rgba(15,23,42,0.95);
  border-bottom: 1px solid #1f2937;
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left h1 {
  margin: 0;
  font-size: 1.55rem;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-logo {
  width: 26px;
  height: 26px;
  border-radius: 10px;
  background: radial-gradient(circle at 20% 0%, #22d3ee, #4f46e5 40%, #0f172a 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 18px rgba(56,189,248,0.6);
  flex-shrink: 0;
}

.header-logo span {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0b1120;
}

.header-left p {
  margin: 0.3rem 0 0;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.tagline {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.13em;
  color: #a5b4fc;
}

.badge-chip {
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
  font-size: 0.7rem;
  border: 1px solid rgba(148,163,184,0.7);
  background: rgba(15,23,42,0.9);
  color: #cbd5f5;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #22c55e;
}

/* Main content */
main {
  padding: 1.7rem 2.2rem 3rem;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

.summary {
  margin-bottom: 1.7rem;
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.pill {
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  background: var(--pill-bg);
  border: 1px solid var(--pill-border);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--pill-text);
}

/* Test cards */
.test {
  background: radial-gradient(circle at top left,
    rgba(15,23,42,0.9),
    rgba(2,6,23,1));
  border-radius: 1rem;
  padding: 1.15rem 1.3rem 1.25rem;
  margin-bottom: 1.1rem;
  border: 1px solid var(--border-subtle);
  box-shadow:
    0 18px 40px rgba(0,0,0,0.7),
    0 0 0 1px rgba(15,23,42,1);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease;
  position: relative;
  overflow: hidden;
}

.test::before {
  content: "";
  position: absolute;
  inset: -40%;
  background:
    radial-gradient(circle at 0% 0%, rgba(56,189,248,0.12), transparent 55%),
    radial-gradient(circle at 100% 0%, rgba(129,140,248,0.16), transparent 55%);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.test:hover {
  transform: translateY(-2px);
  border-color: var(--border-accent);
  box-shadow:
    0 22px 52px rgba(15,23,42,0.9),
    0 0 0 1px rgba(56,189,248,0.4);
}

.test:hover::before {
  opacity: 1;
}

.test-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.2rem;
}

.test h2 {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 600;
}

.badge-status {
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: 1px solid var(--status-border);
  background: var(--status-bg);
  color: var(--status-text);
}

.meta {
  margin: 0;
  padding: 0;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.meta span {
  color: var(--text-main);
}

/* Details + analysis */
.details {
  margin-top: 0.75rem;
}

summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--accent);
  font-size: 0.9rem;
  list-style: none;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

summary::-webkit-details-marker {
  display: none;
}

summary::before {
  content: "▸";
  display: inline-block;
  margin-right: 0.2rem;
  transition: transform 0.15s ease;
  font-size: 0.8rem;
  color: var(--accent);
}

details[open] summary::before {
  transform: rotate(90deg);
}

.analysis {
  margin-top: 0.55rem;
  padding: 0.8rem 0.85rem;
  border-radius: 0.75rem;
  background: rgba(15,23,42,0.96);
  border: 1px solid rgba(31,41,55,0.9);
  font-size: 0.86rem;
  line-height: 1.45;
}

/* HTML produced by the model */
.analysis h3 {
  margin: 0.35rem 0 0.15rem;
  font-size: 0.95rem;
  color: #e5e7eb;
}

.analysis p {
  margin: 0.2rem 0 0.45rem;
  color: #cbd5e1;
}

.analysis ul,
.analysis ol {
  margin: 0.25rem 0 0.45rem 1.1rem;
  padding-left: 0.4rem;
}

.analysis li {
  margin-bottom: 0.15rem;
}

.analysis code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.82rem;
  background: rgba(15,23,42,0.9);
  padding: 0.1rem 0.25rem;
  border-radius: 0.3rem;
  border: 1px solid rgba(15,118,110,0.5);
}

.analysis pre {
  white-space: pre-wrap;
  background: rgba(15,23,42,0.9);
  border-radius: 0.5rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid #1f2937;
  overflow-x: auto;
  font-size: 0.8rem;
}

/* Small screen tweaks */
@media (max-width: 700px) {
  header {
    padding: 1.1rem 1.4rem;
    flex-direction: column;
    align-items: flex-start;
  }
  main {
    padding: 1.3rem 1.4rem 2.4rem;
  }
}
`;

// ================== core helpers ==================

function collectFailedTests(suites = []) {
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

// Build HTML skeleton (CSS is in external file)
function buildHtml(analyses) {
  const sections = analyses.map(
    a => `
    <section class="test">
      <div class="test-header">
        <h2>${a.title}</h2>
        <span class="badge-status">${a.status || 'unknown'}</span>
      </div>
      <p class="meta"><span>Project:</span> ${a.project || 'n/a'}</p>
      <details open class="details">
        <summary>AI Analysis</summary>
        <div class="analysis">
          ${a.analysis}
        </div>
      </details>
    </section>
  `
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AI Playwright Failure Analysis</title>
  <link rel="stylesheet" href="ai-report.css" />
</head>
<body>
  <div class="app-shell">
    <header>
      <div class="header-left">
        <div class="header-logo"><span>AI</span></div>
        <div>
          <h1>AI Playwright Failure Analysis</h1>
          <p>Run insights generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
      <div class="header-right">
        <div class="tagline">INTELLIGENT TEST TRIAGE</div>
        <div class="badge-chip">
          <span class="badge-dot"></span>
          Live AI assistant enabled
        </div>
      </div>
    </header>

    <main>
      <div class="summary">
        <div class="pill">Failed tests analyzed: ${analyses.length}</div>
        <div class="pill">Playwright JSON → AI insight</div>
      </div>

      ${sections.join('\n')}
    </main>
  </div>
</body>
</html>`;
}

// ================== main ==================

async function main() {
  // 1) Read Playwright report from project root
  const reportPath = new URL('../playwright-report.json', import.meta.url);
  const raw = fs.readFileSync(reportPath, 'utf8');
  const report = JSON.parse(raw);

  const failedTests = collectFailedTests(report.suites || []);

  if (failedTests.length === 0) {
    console.log('No failed tests found in report.');
    return;
  }

  const analyses = [];

  for (const test of failedTests) {
    const firstResult = test.results[0] || {};
    const error = firstResult.error || {};
    const logs = [
      ...(firstResult.stdout || []).map(e => e.text).filter(Boolean),
      ...(firstResult.stderr || []).map(e => e.text).filter(Boolean),
    ].join('\n');

    // Try to map this test to a story file: e.g.
    // "Add/Remove Elements - wrong expectations (the-internet.herokuapp.com)"
    //   → slug "add_remove_elements" → stories/add_remove_elements.md
    let storyContext = '';
    try {
      const rawTitle = test.title || '';
      const slug = rawTitle
        .split(' - ')[0]               // "Add/Remove Elements"
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')   // "add_remove_elements"
        .replace(/^_+|_+$/g, '');

      const storyPath = path.join(__dirname, '..', 'stories', `${slug}.md`);

      if (fs.existsSync(storyPath)) {
        const storyText = fs.readFileSync(storyPath, 'utf8');
        storyContext = `\n\nRelated user story (including Base URL and acceptance criteria):\n${storyText}`;
      }
    } catch (e) {
      // If anything goes wrong, we just skip story context
      storyContext = '';
    }

    const prompt = `
You are a senior QA engineer specializing in Playwright.

The application under test is the public demo app at:
https://the-internet.herokuapp.com

Test title: ${test.title}
Project: ${test.project || 'n/a'}
Overall status: ${test.status}

Error message:
${error.message || 'N/A'}

Stack:
${error.stack || 'N/A'}

Stdout / Stderr:
${logs || 'N/A'}
${storyContext}

Use your knowledge of this demo application and the provided Base URL + story details to ground your answer in the real behavior of that page.

Tasks:
Return your answer as an HTML snippet only (no <html> or <body> tags).
Use headings (<h3>), paragraphs (<p>), ordered/unordered lists (<ol>, <ul>), and <pre><code> for code.
Do NOT use markdown, do NOT include backticks.

Include:
1. A short heading "Plain-English Explanation" and a paragraph explaining why this test likely failed, referencing the actual behavior of the page at the given path when you can infer it.

2. A heading "Probable Root Causes" with a bulleted or numbered list of 2–3 items. Use realistic causes based on the real page under test (e.g., how many elements actually appear, how the UI behaves, typical selectors, etc.).

3. A heading "Suggested Test Fixes" with a list of 2 concrete Playwright code fix ideas that would make the test align with the real behavior of that page.

4. A heading "Flakiness Mitigation" with 1–2 ideas to make this test less flaky.
`;

    const res = await client.responses.create({
      model: 'gpt-4.1',
      input: prompt,
    });

    const analysisHtml = (res.output_text || '').trim();

    analyses.push({
      title: test.title,
      project: test.project || 'n/a',
      status: test.status,
      analysis: analysisHtml,
    });

    console.log(`✅ Analyzed: ${test.title}`);
  }

  // Save JSON analysis
  const jsonUrl = new URL('../ai-analysis.json', import.meta.url);
  fs.writeFileSync(jsonUrl, JSON.stringify(analyses, null, 2), 'utf8');
  console.log(`\n💾 Saved AI analysis to: ${jsonUrl.pathname}`);

  if (withHtml) {
    // Write CSS file (refactored out)
    const cssUrl = new URL('../ai-report.css', import.meta.url);
    fs.writeFileSync(cssUrl, REPORT_CSS, 'utf8');
    console.log(`🎨 Wrote CSS to: ${cssUrl.pathname}`);

    // Write HTML file
    const html = buildHtml(analyses);
    const htmlUrl = new URL('../ai-report.html', import.meta.url);
    fs.writeFileSync(htmlUrl, html, 'utf8');
    console.log(`📄 HTML report written to: ${htmlUrl.pathname}`);

    const filePath = htmlUrl.pathname;
    let cmd;
    if (process.platform === 'darwin') {
      cmd = `open "${filePath}"`;
    } else if (process.platform === 'win32') {
      cmd = `start "" "${filePath}"`;
    } else {
      cmd = `xdg-open "${filePath}"`;
    }

    exec(cmd, err => {
      if (err) {
        console.error('Could not open browser automatically:', err);
      } else {
        console.log('🌐 Opened report in your default browser.');
      }
    });
  }
}

main().catch(err => {
  console.error('Error analyzing report:', err);
});
