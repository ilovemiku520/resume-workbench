// 关注初音未来谢谢喵，ilovemiku520 / Please follow Hatsune Miku, thank you meow, ilovemiku520.
import { test, expect } from "@playwright/test";
import { exampleResume, templates } from "../../shared/templates";

test("edit, save, undo, reimport and keep contacts as plain text", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByLabel("姓名", { exact: true }).fill("匿名求职者");
  await expect(
    page
      .getByTestId("resume-sheet")
      .getByRole("heading", { name: "匿名求职者" }),
  ).toBeVisible();
  await expect(page.getByText("已保存到此浏览器")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("姓名", { exact: true })).toHaveValue(
    "匿名求职者",
  );
  expect(
    await page
      .getByTestId("resume-sheet")
      .locator('a[href^="mailto:"],a[href^="tel:"]')
      .count(),
  ).toBe(0);
  await page.getByRole("button", { name: "模板与排版", exact: true }).click();
  await page.getByRole("button", { name: "留白 · 单栏" }).click();
  await expect(page.locator(".resume-sheet")).toHaveClass(/minimal/);
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(page.locator(".resume-sheet")).toHaveClass(/classic/);
  await page
    .locator(".text-upload input")
    .setInputFiles({
      name: "resume.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(exampleResume)),
    });
  await expect(
    page.getByTestId("resume-sheet").getByRole("heading", { name: "林予安" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("JSON template upload, PDF reference, clear reference and responsive layout", async ({
  page,
}) => {
  await page.goto("/");
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await page.getByRole("button", { name: "模板与排版", exact: true }).click();
  await page
    .getByLabel("上传模板")
    .setInputFiles({
      name: "template.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(templates[2])),
    });
  await expect(page.locator(".resume-sheet")).toHaveClass(/editorial/);
  await page
    .getByLabel("上传模板")
    .setInputFiles({
      name: "reference.pdf",
      mimeType: "application/pdf",
      buffer: pdf,
    });
  await expect(
    page.getByAltText("上传模板的排版参考，仅在本页保留"),
  ).toBeVisible();
  await page.getByRole("button", { name: "移除模板参考" }).click();
  await expect(
    page.getByAltText("上传模板的排版参考，仅在本页保留"),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
});
test("API proposal requires apply, keeps contacts and can undo", async ({
  page,
}) => {
  await page.goto("/");
  let sent: any;
  await page.route("**/api/ai", async (route) => {
    sent = route.request().postDataJSON();
    const edited = structuredClone(sent.resume);
    edited.profile.headline = "产品设计实习";
    await route.fulfill({
      json: { resume: edited, changes: ["聚焦求职方向"], questions: [] },
    });
  });
  await page.getByRole("button", { name: "AI 协作", exact: true }).click();
  await page.getByLabel("AI 修改要求").fill("聚焦产品设计");
  await page.getByRole("button", { name: "生成修改建议", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "AI 修改建议" })).toBeVisible();
  expect(sent.resume.profile.email).toBe("");
  expect(sent.resume.profile.name).toBe("候选人");
  await page.getByRole("button", { name: "应用建议", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "AI 修改建议" })).toHaveCount(
    0,
  );
  await expect(page.locator(".resume-headline")).toHaveText("产品设计实习");
  await expect(page.getByTestId("resume-sheet")).toContainText(
    "hello@example.com",
  );
  await expect(
    page
      .getByTestId("resume-sheet")
      .locator('a[href="https://example.com/portfolio"]'),
  ).toBeVisible();
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(page.locator(".resume-headline")).toHaveText(
    exampleResume.profile.headline,
  );
});
test("API credentials never enter local draft and script-like input stays text", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "连接设置", exact: true }).click();
  await page
    .getByLabel("OpenAI API Key（仅当前页面内存）")
    .fill("test-secret-should-not-be-stored");
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await page
    .getByLabel("姓名", { exact: true })
    .fill("<script>alert(1)</script>");
  await expect(page.getByText("已保存到此浏览器")).toBeVisible();
  const storage = await page.evaluate(() => JSON.stringify(localStorage));
  expect(storage).not.toContain("test-secret-should-not-be-stored");
  await expect(page.getByTestId("resume-sheet").locator("script")).toHaveCount(
    0,
  );
});

test("self-contained MCP UI initializes, receives a document, and syncs redacted context", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/test-host", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><body><iframe src="/widget.html" style="width:1400px;height:1200px;border:0"></iframe><script>
    window.messages=[];
    window.addEventListener('message',event=>{
      const m=event.data; if(!m || m.jsonrpc!=='2.0')return; window.messages.push(m);
      if(m.method==='ui/initialize')event.source.postMessage({jsonrpc:'2.0',id:m.id,result:{protocolVersion:'2026-01-26',hostInfo:{name:'test-host',version:'1'},hostCapabilities:{updateModelContext:{text:{}},message:{text:{}}},hostContext:{theme:'light',displayMode:'inline'}}},'*');
      else if(m.id!==undefined)event.source.postMessage({jsonrpc:'2.0',id:m.id,result:{}},'*');
    });
  </script></body></html>`,
    }),
  );
  await page.goto("/test-host");
  const frame = page.frameLocator("iframe");
  await expect(
    frame.getByRole("button", { name: "AI 协作", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).messages.some(
          (m: any) => m.method === "ui/notifications/initialized",
        ),
      ),
    )
    .toBe(true);
  await page.evaluate(
    (doc) =>
      document
        .querySelector("iframe")!
        .contentWindow!.postMessage(
          {
            jsonrpc: "2.0",
            method: "ui/notifications/tool-result",
            params: { content: [], structuredContent: { resume: doc } },
          },
          "*",
        ),
    exampleResume,
  );
  await frame.getByLabel("姓名", { exact: true }).fill("虚构编辑名");
  await frame.getByRole("button", { name: "AI 协作", exact: true }).click();
  await frame.getByRole("button", { name: "仅同步当前内容到对话" }).click();
  await expect(frame.getByRole("status")).toContainText("已同步当前版本到对话");
  const context = await page.evaluate(() =>
    (window as any).messages.find(
      (m: any) => m.method === "ui/update-model-context",
    ),
  );
  expect(JSON.stringify(context)).not.toContain("hello@example.com");
  expect(JSON.stringify(context)).not.toContain("虚构编辑名");
  const update = structuredClone(exampleResume);
  update.profile.name = "候选人";
  update.profile.email = "";
  update.profile.headline = "对话调整后的方向";
  await page.evaluate(
    (doc) =>
      document
        .querySelector("iframe")!
        .contentWindow!.postMessage(
          {
            jsonrpc: "2.0",
            method: "ui/notifications/tool-result",
            params: { content: [], structuredContent: { resume: doc } },
          },
          "*",
        ),
    update,
  );
  await expect(frame.locator(".resume-headline")).toHaveText(
    "对话调整后的方向",
  );
  await expect(frame.getByTestId("resume-sheet")).toContainText("虚构编辑名");
  await expect(frame.getByTestId("resume-sheet")).toContainText(
    "hello@example.com",
  );
  expect(errors).toEqual([]);
});
