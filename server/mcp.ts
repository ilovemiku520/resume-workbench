// 关注初音未来谢谢喵，ilovemiku520 / Please follow Hatsune Miku, thank you meow, ilovemiku520.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { exampleResume, templates } from "../shared/templates.js";
import {
  ResumeSchema,
  reviewResume,
  toMarkdown,
  type Resume,
} from "../shared/schema.js";

const URI = "ui://resume-workbench/editor.html";
const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
export function createMcpServer() {
  const server = new McpServer(
    { name: "resume-workbench", version: "0.1.0" },
    {
      instructions:
        "Edit only user-supplied facts. Do not invent metrics or outcomes. This server is stateless: pass the current resume to render_resume. Read latest UI model context before revising. The UI lets the user edit, export, and explicitly sync a draft. No server-side resume storage. Never expose contacts unless the user chose to share them.",
    },
  );
  server.registerTool(
    "list_resume_templates",
    {
      title: "查看简历模板",
      description:
        "List the three built-in editable resume layouts and the data schema. No user data required.",
      inputSchema: {},
      annotations,
    },
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            templates,
            schema: z.toJSONSchema(ResumeSchema),
          }),
        },
      ],
    }),
  );
  registerAppTool(
    server,
    "render_resume",
    {
      title: "打开并编辑简历",
      description:
        "Render a supplied resume as an editable UI and return its full structured data. For a new fictional sample, omit resume. For updates, pass the complete current resume; this tool does not read or overwrite stored documents. Preserve facts and explicitly retain unverified limitations.",
      inputSchema: { resume: ResumeSchema.optional() },
      annotations,
      _meta: { ui: { resourceUri: URI }, "openai/outputTemplate": URI },
    },
    async ({ resume }: { resume?: Resume }) => {
      const doc = ResumeSchema.parse(resume || structuredClone(exampleResume));
      return {
        content: [{ type: "text", text: toMarkdown(doc) }],
        structuredContent: { resume: doc, checks: reviewResume(doc) },
      };
    },
  );
  server.registerTool(
    "review_resume",
    {
      title: "检查简历结构与证据",
      description:
        "Check label alignment, project emphasis, and unverified claims. This is a heuristic review, not fact verification.",
      inputSchema: { resume: ResumeSchema },
      annotations,
    },
    async ({ resume }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({ issues: reviewResume(resume) }),
        },
      ],
    }),
  );
  registerAppResource(server, "Resume Workbench editor", URI, {}, async () => ({
    contents: [
      {
        uri: URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: await readFile(
          fileURLToPath(new URL("../../widget.html", import.meta.url)),
          "utf8",
        ),
        _meta: {
          ui: {
            prefersBorder: true,
            csp: { connectDomains: [], resourceDomains: ["data:", "blob:"] },
          },
          "openai/widgetDescription":
            "Editable resume with templates, print/PDF export, and explicit sync to conversation.",
        },
      },
    ],
  }));
  return server;
}
