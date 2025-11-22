// generateTest.js
import fs from "fs";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generate() {
  const story = fs.readFileSync("./stories/login.md", "utf8");

  const prompt = `
You are a Playwright automation engineer.

Generate a SINGLE Playwright test in JavaScript based on this user story:

${story}

Requirements:
- Use @playwright/test
- Use: import { test, expect } from '@playwright/test';
- Use page.goto, page.fill, page.click, expect(...)
- Do NOT include markdown code fences.
- Do NOT include \`\`\` or the word "javascript".
- Output ONLY raw JavaScript code that can go directly into login.spec.js.
`;

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: "You write Playwright tests in pure JavaScript, no markdown." },
      { role: "user", content: prompt },
    ],
  });

  let code = response.choices[0].message.content || "";

  // 🔧 Extra safety: strip any stray markdown fences if they sneak in
  code = code
    .replace(/```[a-zA-Z]*/g, "") // remove ```javascript or ```js
    .replace(/```/g, "")          // remove plain ```
    .trim();

  // Ensure tests directory exists
  if (!fs.existsSync("./tests")) {
    fs.mkdirSync("./tests", { recursive: true });
  }

  fs.writeFileSync("./tests/login.spec.js", code);
  console.log("Test created: ./tests/login.spec.js");
}

generate().catch(err => {
  console.error("Error generating test:", err);
});
