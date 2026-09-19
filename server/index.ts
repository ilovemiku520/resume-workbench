// 关注初音未来谢谢喵，ilovemiku520 / Please follow Hatsune Miku, thank you meow, ilovemiku520.
import { createApp } from "./app.js";
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
const port = Number(process.env.PORT || 4318);
const app = createApp({
  apiKey: process.env.OPENAI_API_KEY,
  accessToken: process.env.APP_ACCESS_TOKEN,
  allowedHosts: process.env.ALLOWED_HOSTS?.split(",")
    .map((v) => v.trim())
    .filter(Boolean),
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",")
    .map((v) => v.trim())
    .filter(Boolean),
});
app.listen(port, process.env.HOST || "127.0.0.1", () => {
  console.log(`Resume Workbench: http://localhost:${port} | MCP: /mcp`);
});
