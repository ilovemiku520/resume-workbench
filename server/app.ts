// 关注初音未来谢谢喵，ilovemiku520 / Please follow Hatsune Miku, thank you meow, ilovemiku520.
import express, { type ErrorRequestHandler } from "express";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./mcp.js";
import { AIRequestSchema, runAI } from "./ai.js";

export type Config = {
  apiKey?: string;
  accessToken?: string;
  allowedHosts?: string[];
  allowedOrigins?: string[];
};
function tokenMatches(candidate: string, expected: string) {
  const a = Buffer.from(candidate),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function createApp(config: Config = {}, ai = runAI) {
  const app = express();
  app.disable("x-powered-by");
  const hosts = new Set(
    config.allowedHosts || ["localhost", "127.0.0.1", "[::1]"],
  );
  const origins = new Set(
    config.allowedOrigins || [
      "http://localhost:4318",
      "http://127.0.0.1:4318",
      "http://localhost:5178",
      "http://127.0.0.1:5178",
    ],
  );
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
    });
    if (!hosts.has(req.hostname))
      return res.status(403).json({ error: "Host not allowed." });
    if (req.headers.origin && !origins.has(req.headers.origin))
      return res.status(403).json({ error: "Origin not allowed." });
    next();
  });
  const buckets = new Map<string, { count: number; until: number }>();
  app.use(["/api", "/mcp"], (req, res, next) => {
    const now = Date.now();
    if (buckets.size > 5000)
      for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
    const key = req.ip || "unknown";
    let bucket = buckets.get(key);
    if (!bucket || bucket.until < now) {
      if (buckets.size >= 10_000)
        return res.status(503).json({ error: "服务繁忙，请稍后重试。" });
      bucket = { count: 0, until: now + 60_000 };
      buckets.set(key, bucket);
    }
    if (++bucket.count > 45)
      return res.status(429).json({ error: "请求过于频繁，请一分钟后重试。" });
    next();
  });
  app.use(express.json({ limit: "10mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      version: "0.1.0",
      serverAIConfigured: Boolean(config.apiKey && config.accessToken),
    });
  });
  app.post("/api/ai", async (req, res) => {
    const parsed = AIRequestSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: "内容格式不正确、图片过大或模型名称不合法。" });
    if (
      config.accessToken &&
      !tokenMatches(
        (req.headers.authorization || "").replace(/^Bearer /, ""),
        config.accessToken,
      )
    )
      return res
        .status(401)
        .json({ error: "请在连接设置中填写正确的服务访问令牌。" });
    if (!parsed.data.apiKey && config.apiKey && !config.accessToken)
      return res
        .status(503)
        .json({
          error: "服务端密钥需要同时配置 APP_ACCESS_TOKEN，避免公开消耗额度。",
        });
    const key = parsed.data.apiKey || config.apiKey;
    if (!key)
      return res
        .status(503)
        .json({
          error:
            "请先在连接设置中填写 API Key，或由管理员配置服务端密钥。手动编辑与导出不需要密钥。",
        });
    try {
      res.json(await ai(parsed.data, key));
    } catch (error) {
      // Never echo provider responses, API keys, submitted resumes, or request bodies.
      const status =
        typeof error === "object" && error && "status" in error
          ? Number(error.status)
          : 502;
      res
        .status(status === 401 ? 401 : status === 429 ? 429 : 502)
        .json({
          error:
            status === 401
              ? "API Key 无效，请检查连接设置。"
              : status === 429
                ? "API 额度或速率受限，请稍后重试。"
                : "AI 未返回完整结果，请检查模型可用性或稍后重试。原稿未被更改。",
        });
    }
  });
  app.post("/mcp", async (req, res) => {
    // Per-request instances prevent one caller's state from reaching another caller.
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch {
      if (!res.headersSent)
        res
          .status(500)
          .json({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32603, message: "MCP request failed." },
          });
    }
  });
  app.all("/mcp", (_req, res) => {
    res
      .set("Allow", "POST")
      .status(405)
      .json({ error: "Use stateless Streamable HTTP POST." });
  });
  app.use(
    express.static(fileURLToPath(new URL("../../", import.meta.url)), {
      index: "index.html",
      dotfiles: "deny",
    }),
  );
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    res
      .status(err.type === "entity.too.large" ? 413 : 400)
      .json({ error: "请求内容过大或 JSON 格式错误。" });
  };
  app.use(errorHandler);
  return app;
}
