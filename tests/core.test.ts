// 关注初音未来谢谢喵，ilovemiku520 / Please follow Hatsune Miku, thank you meow, ilovemiku520.
import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { exampleResume, templates } from "../shared/templates.js";
import {
  validateResume,
  TemplateSchema,
  redactContacts,
  safeUrl,
  reviewResume,
  toMarkdown,
} from "../shared/schema.js";
import { createMcpServer } from "../server/mcp.js";
import { createApp } from "../server/app.js";
import { runAI } from "../server/ai.js";
import OpenAI from "openai";

test("documents and templates reject unsafe URLs, duplicate IDs, executable template keys", () => {
  validateResume(exampleResume);
  for (const template of templates) TemplateSchema.parse(template);
  assert.equal(safeUrl("javascript:alert(1)"), undefined);
  assert.equal(safeUrl("https://user:pass@example.com"), undefined);
  const doc = structuredClone(exampleResume);
  doc.sections[0].id = doc.sections[1].id;
  assert.throws(() => validateResume(doc));
  assert.throws(() =>
    TemplateSchema.parse({
      ...templates[0],
      html: "<script>alert(1)</script>",
    }),
  );
});
test("privacy removes repeated contacts and links without breaking schema or original", () => {
  const doc = structuredClone(exampleResume);
  doc.notes += ` Contact ${doc.profile.email}; ${doc.profile.name}`;
  const redacted = redactContacts(doc);
  assert.ok(!JSON.stringify(redacted).includes(doc.profile.email));
  assert.ok(!JSON.stringify(redacted).includes(doc.profile.name));
  assert.ok(!JSON.stringify(redacted).includes("https://example.com"));
  validateResume(redacted);
  assert.equal(doc.profile.name, exampleResume.profile.name);
});
test("prototype claims are highlighted and hidden sections stay out of export", () => {
  const doc = structuredClone(exampleResume);
  doc.sections[3].entries[1].bullets.push("留存率提升了 30%");
  assert.ok(reviewResume(doc).some((x) => x.includes("真实用户效果")));
  doc.sections[0].visible = false;
  assert.ok(!toMarkdown(doc).includes("示例大学"));
});
test("OpenAI structured request uses store:false and preserves evidence and links", async () => {
  let sent: Record<string, unknown> = {};
  const changed = structuredClone(exampleResume);
  changed.sections[3].entries[1].evidence = "verified";
  changed.sections[3].entries[0].url = "https://evil.example";
  const client = new OpenAI({
    apiKey: "test-key",
    fetch: async (_url, options) => {
      sent = JSON.parse(String(options?.body));
      return new Response(
        JSON.stringify({
          id: "resp_test",
          object: "response",
          status: "completed",
          output: [
            {
              type: "message",
              id: "msg_test",
              role: "assistant",
              status: "completed",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    resume: changed,
                    changes: ["措辞优化"],
                    questions: [],
                  }),
                  annotations: [],
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    },
  });
  const result = await runAI(
    {
      kind: "resume",
      resume: exampleResume,
      instruction: "精简措辞",
      model: "gpt-5-mini",
    },
    "test-key",
    client,
  );
  assert.equal(sent.store, false);
  assert.ok("resume" in result);
  if ("resume" in result) {
    assert.equal(result.resume.sections[3].entries[1].evidence, "prototype");
    assert.equal(
      result.resume.sections[3].entries[0].url,
      exampleResume.sections[3].entries[0].url,
    );
  }
});
test("MCP round trip lists templates, renders edits, validates input and loads UI", async () => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer(),
    client = new Client({ name: "integration-test", version: "1" });
  await server.connect(a);
  await client.connect(b);
  try {
    assert.equal((await client.listTools()).tools.length, 3);
    const sample = await client.callTool({
      name: "render_resume",
      arguments: {},
    });
    const doc = validateResume(
      (sample.structuredContent as { resume: unknown }).resume,
    );
    doc.profile.name = "匿名测试";
    const edited = await client.callTool({
      name: "render_resume",
      arguments: { resume: doc },
    });
    assert.equal(
      validateResume((edited.structuredContent as { resume: unknown }).resume)
        .profile.name,
      "匿名测试",
    );
    const invalid = await client.callTool({
      name: "render_resume",
      arguments: { resume: { broken: true } },
    });
    assert.equal(invalid.isError, true);
    const ui = await client.readResource({
      uri: "ui://resume-workbench/editor.html",
    });
    assert.ok("text" in ui.contents[0]);
    assert.ok(ui.contents[0].text.includes("简历工坊"));
    assert.ok(!ui.contents[0].text.includes('src="/assets/'));
  } finally {
    await client.close();
    await server.close();
  }
});
test("HTTP API protects shared keys, rejects hostile origins, and handles MCP", async () => {
  let calls = 0;
  const app = createApp(
    { apiKey: "private-server-key", accessToken: "local-test-token" },
    async () => {
      calls++;
      return { template: templates[0] };
    },
  );
  const listener = app.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const address = listener.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const body = JSON.stringify({
    kind: "resume",
    resume: exampleResume,
    instruction: "检查",
    model: "gpt-5-mini",
  });
  const headers = { "Content-Type": "application/json" };
  try {
    assert.equal(
      (await fetch(`${base}/api/ai`, { method: "POST", headers, body })).status,
      401,
    );
    assert.equal(calls, 0);
    assert.equal(
      (
        await fetch(`${base}/api/ai`, {
          method: "POST",
          headers: {
            ...headers,
            Origin: "https://evil.example",
            Authorization: "Bearer local-test-token",
          },
          body,
        })
      ).status,
      403,
    );
    const allowed = await fetch(`${base}/api/ai`, {
      method: "POST",
      headers: { ...headers, Authorization: "Bearer local-test-token" },
      body,
    });
    assert.equal(allowed.status, 200);
    assert.equal(calls, 1);
    const client = new Client({ name: "http-test", version: "1" });
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`${base}/mcp`)),
    );
    const result = await client.callTool({
      name: "render_resume",
      arguments: {},
    });
    assert.ok((result.structuredContent as { resume: unknown }).resume);
    await client.close();
  } finally {
    listener.closeAllConnections();
    await new Promise<void>((resolve) => listener.close(() => resolve()));
  }
});
test("unprotected server key is never used", async () => {
  let used = false;
  const listener = createApp({ apiKey: "unprotected-key" }, async () => {
    used = true;
    return { template: templates[0] };
  }).listen(0, "127.0.0.1");
  await once(listener, "listening");
  const addr = listener.address();
  assert.ok(addr && typeof addr !== "string");
  try {
    const response = await fetch(`http://127.0.0.1:${addr.port}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "resume",
        resume: exampleResume,
        instruction: "检查",
        model: "gpt-5-mini",
      }),
    });
    assert.equal(response.status, 503);
    assert.equal(used, false);
  } finally {
    listener.closeAllConnections();
    await new Promise<void>((resolve) => listener.close(() => resolve()));
  }
});
