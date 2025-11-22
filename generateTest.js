// generateTest.js
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';

const client = new OpenAI({ apiKey: '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' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateForStory(storyPath) {
  const story = fs.readFileSync(storyPath, 'utf8');
  const storyName = path.basename(storyPath, '.md'); // e.g. login, checkboxes
  const outPath = path.join(__dirname, 'tests', `${storyName}.spec.js`);

  const prompt = `
You are a Playwright automation engineer.

Generate a SINGLE Playwright test in JavaScript based on this user story:

${story}

Requirements:
- Use: import { test, expect } from '@playwright/test';
- Use the Base URL from the story. If present, prepend it to any relative paths like /login.
- Use page.goto, page.locator, page.fill, page.click, expect(...)
- Use data from the Acceptance criteria.
- Do NOT include markdown, backticks, or explanations.
- Output ONLY raw JavaScript test code that can go directly into a .spec.js file.
  `;

  const response = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: 'You write Playwright tests in pure JavaScript, no markdown.' },
      { role: 'user', content: prompt },
    ],
  });

  let code = (response.choices[0].message.content || '').trim();

  // Safety: strip stray markdown fences if they sneak in
  code = code
    .replace(/```[a-zA-Z]*/g, '')
    .replace(/```/g, '')
    .trim();

  if (!fs.existsSync(path.join(__dirname, 'tests'))) {
    fs.mkdirSync(path.join(__dirname, 'tests'), { recursive: true });
  }

  fs.writeFileSync(outPath, code);
  console.log(`✅ Generated test for ${storyName}: ${outPath}`);
}

async function main() {
  const storiesDir = path.join(__dirname, 'stories');
  const files = fs.readdirSync(storiesDir).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.error('No .md story files found in ./stories');
    process.exit(1);
  }

  for (const file of files) {
    const fullPath = path.join(storiesDir, file);
    await generateForStory(fullPath);
  }
}

main().catch(err => {
  console.error('Error generating tests:', err);
});
