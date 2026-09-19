// 关注初音未来谢谢喵，ilovemiku520 / Please follow Hatsune Miku, thank you meow, ilovemiku520.
// Generate README assets in a fresh browser context with generic placeholders only.
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { blankResume, templates } from "../dist/node/shared/templates.js";
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
    : {},
);
try {
  const page = await browser.newPage({
    viewport: { width: 1500, height: 1130 },
    deviceScaleFactor: 1,
  });
  await page.goto("http://127.0.0.1:4318");
  await page.getByText("已保存到此浏览器").waitFor();
  await page.screenshot({ path: "assets/workbench.png", fullPage: true });
  await mkdir("test-results", { recursive: true });
  await page.pdf({
    path: "test-results/sample-export.pdf",
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });
  await page.getByRole("button", { name: "模板与排版", exact: true }).click();
  await page.screenshot({ path: "assets/templates.png", fullPage: true });
  await mkdir("examples", { recursive: true });
  await writeFile(
    "examples/placeholder-resume.json",
    JSON.stringify(blankResume, null, 2) + "\n",
  );
  await writeFile(
    "examples/classic-blue.template.json",
    JSON.stringify(templates[0], null, 2) + "\n",
  );
} finally {
  await browser.close();
}
