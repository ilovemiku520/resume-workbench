# ChatGPT / Codex 连接指南

本仓库提供 **Streamable HTTP MCP 服务、stdio MCP 服务、交互 UI 和简历编辑 Skill**。服务端无简历存档：每次渲染传入完整文档，结果回到工具响应与编辑界面中。

## ChatGPT

1. 按[部署指南](DEPLOYMENT.md)将服务部署在自己控制的 HTTPS 域名；确认 `/api/health` 可访问，`/mcp` 接受 MCP POST。地址不可以是远端无法访问的 localhost。
2. 根据账号当前支持的界面，在 ChatGPT 的开发者模式 / 插件连接入口添加 `https://你的域名/mcp`。本项目的 MCP 工具仅处理调用方提供的内容，没有数据库或外部账号访问，默认不要求认证。
3. 在对话中选择插件，输入“打开简历工坊”；调用 `render_resume` 后出现可编辑界面。
4. 手动修改后点击“AI 协作 → 仅同步当前内容到对话”，或填写修改要求后点击“让 ChatGPT 修改”。默认隐藏基本信息与项目链接；如需 ChatGPT 使用这些数据，可自行关闭隐藏选项。
5. 宿主支持的文件下载、打印与 localStorage 权限可能不同。如内嵌页面无法导出，使用 JSON 内容在独立网页导入后导出 PDF。不要把内嵌页面当作跨会话存档。

当前官方指南的入口为 Settings → Security and login → Developer mode，然后进入 Plugins 添加服务。账号、工作区和客户端支持范围可能不同，以[官方快速入门](https://developers.openai.com/plugins/quickstart)为准。内嵌 UI 使用[标准 MCP Apps 桥接](https://developers.openai.com/plugins/build/chatgpt-ui)，不依赖已废弃接口。

**GitHub 发布 ≠ 插件目录上架。** 在公开目录分发还需要部署服务并完成 OpenAI 的[发布流程](https://developers.openai.com/plugins/quickstart#publish-the-plugin)。本仓库不包含虚构的已注册应用 ID。

## 工具

| 工具 | 输入 | 输出 |
|---|---|---|
| `list_resume_templates` | 空对象 | 默认模板与简历数据结构 |
| `render_resume` | 可选完整 `resume`；省略则打开虚构示例 | 可编辑 UI、完整数据、文字稿 |
| `review_resume` | 完整 `resume` | 标签、篇幅和原型成果的启发式检查 |

MCP 不使用 API Key，也不消耗本服务的 OpenAI API 额度；宿主负责对话推理。独立网页的 `/api/ai` 是另一条可选路径。

## Codex / 其他本地 MCP 客户端

先在克隆目录中运行 `npm ci` 与 `npm run build`。然后配置一个 stdio MCP server：

```json
{
  "mcpServers": {
    "resume-workbench": {
      "command": "node",
      "args": ["/absolute/path/to/resume-workbench/dist/node/server/stdio.js"]
    }
  }
}
```

将路径替换为你机器上的绝对路径；Windows 可使用 `C:/Projects/resume-workbench/dist/node/server/stdio.js`。无 UI 支持的客户端仍可获取 Markdown、结构化数据与模板。stdout 只输出 MCP 协议消息。

根目录 `.codex-plugin/plugin.json`、`.mcp.json` 和 `skills/resume-editing/SKILL.md` 构成兼容插件包。`.mcp.json` 使用客户端支持的 `${CLAUDE_PLUGIN_ROOT}` 根目录占位符；不支持该占位符的客户端请使用上面的绝对路径配置。GitHub 源码包含构建指令；安装插件副本前要确保该副本中也存在 `dist/` 和 `node_modules/`。

## 本地协议检查

```bash
npm run check
npm run mcp
```

第二条启动 stdio 服务并等待客户端输入，不会打印普通欢迎信息。HTTP 地址为 `http://localhost:4318/mcp`；GET 返回 405 是预期行为，客户端应使用无会话的 Streamable HTTP POST。

真实 ChatGPT 内嵌行为需在自己的账号与 HTTPS 部署上联调。本项目的自动化测试覆盖协议、资源读取与标准桥接模拟，不能替代宿主授权及目录审核。
