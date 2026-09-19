# 部署与运行

## 本地 / Node.js 服务

Node.js 22.13+：`npm ci` → `npm run build` → `npm start`。默认仅监听 `127.0.0.1:4318`。开发时 `npm run dev` 提供 5178 前端和 4318 后端；后端源代码更新需重新构建、重启。

复制 `.env.example` 为 `.env`（PowerShell 使用 `Copy-Item .env.example .env`，其他 shell 可用 `cp`）。可选变量：

| 变量 | 默认 / 用途 |
|---|---|
| `HOST` | `127.0.0.1`，容器内可设为 `0.0.0.0` |
| `PORT` | `4318` |
| `OPENAI_API_KEY` | 可选管理员密钥，永不发送给浏览器 |
| `APP_ACCESS_TOKEN` | 设置管理员密钥时必须同时设置；可用于限制所有 API 调用 |
| `ALLOWED_HOSTS` | 逗号分隔的服务主机名，不含协议或路径 |
| `ALLOWED_ORIGINS` | 逗号分隔的完整网页来源，包含协议及非默认端口 |

访问令牌可用 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` 在本地生成。不要将结果写入 README、截图或公共仓库。站点后台配置了访问令牌时，用户必须在“连接设置”填入该令牌，即使使用自己的 API Key。

## HTTPS 自托管

1. 部署本仓库的 Node 服务，或构建下面的容器。
2. 在反向代理终止 HTTPS，并保留正确的 Host 与 Origin。配置例如 `ALLOWED_HOSTS=resume.example.com`、`ALLOWED_ORIGINS=https://resume.example.com`。
3. 不缓存 `/api` 和 `/mcp`，不要记录请求正文、Authorization 或密钥；为流式客户端留出合理超时。当前 MCP 使用 JSON 响应，不要求长连接会话。
4. 打开网页测试手动编辑，再测试 API 令牌与 MCP。AI 路径需要出站访问 `https://api.openai.com`；不会使用调用者提供的任意 API Base URL。

默认限制每 IP 每分钟 45 次 API/MCP 请求、JSON 请求体 10 MB。反向代理部署时应用不信任任意 `X-Forwarded-For`，代理后的用户可能共享同一限流桶；生产环境可在可信网关中实现独立用户限流。此版本定位个人自托管与小规模试用，不提供多租户云端存储、OAuth 用户系统或 SaaS 计费。

## Docker

```bash
docker build -t resume-workbench .
docker run --rm -p 4318:4318 --env-file .env -e HOST=0.0.0.0 resume-workbench
```

默认域名白名单只允许 localhost / 127.0.0.1；对外部署必须填写实际主机名。使用 HTTPS 之后再将 `/mcp` 连接到 ChatGPT。构建产物、上传文件和 `.env` 不会进入 Git 提交；Docker 构建上下文也会排除它们。

## 备份 / 迁移

浏览器草稿不在服务器数据库中。通过“备份 JSON”下载完整内容，在新浏览器中使用“导入已有简历 JSON”恢复。模板 JSON 只含样式；参考图片不会随备份保存。更新前建议导出个人草稿，关闭共享电脑前请清除站点数据。
