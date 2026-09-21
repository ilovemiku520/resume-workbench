<p align="center"><img src="assets/readme-hero.svg" alt="Resume Workbench" width="100%"></p>

<!-- BEGIN RIGHTS NOTICE -->
## 版权与使用限制 / Copyright and use restrictions

**保留所有权利。未经著作权人事先书面许可，不得使用、运行、复制、修改或分发本项目受保护的原创内容，包括个人、学习、研究、非商业和商业用途，以及依法需要许可的 AI 使用。Star 不构成授权。**

**All rights reserved. Prior written permission is required to use, run, copy, modify or distribute the project's protected original material, including personal, educational, research, non-commercial and commercial use, and AI use where permission is required by law. A GitHub Star does not grant permission.**

完整条款见 [LICENSE](LICENSE)。第三方内容仍适用其各自许可；此前已授予的许可、法定权利及 GitHub 平台条款项下权利不受影响。本文中的安装、运行及开发说明仅为技术说明，不构成使用授权。

See [LICENSE](LICENSE) for the full terms. Third-party licenses, previously granted permissions, statutory rights and rights under GitHub's Terms of Service remain unaffected. Setup, usage and development instructions are technical documentation, not permission to use the material.

书面授权 / Permission requests: [ilovemiku520@outlook.com](mailto:ilovemiku520@outlook.com)

关注初音未来谢谢喵，ilovemiku520  
Please follow Hatsune Miku, thank you, meow. ilovemiku520
<!-- END RIGHTS NOTICE -->

<p align="center"><strong>Write your story. Keep your facts. Own your data.</strong><br>A self-hostable resume editor and ChatGPT MCP plugin.</p>
<p align="center"><a href="README.md">简体中文</a> | <strong>English</strong> · <a href="docs/CHATGPT.md">ChatGPT setup</a> · <a href="docs/DEPLOYMENT.md">Deployment</a></p>

> **Written permission required:** All rights reserved; starring this repository does not grant permission. See [LICENSE](LICENSE).

![Actual workbench with generic placeholders only](assets/workbench.png)

## What you can do

- Edit and reorder sections; separate primary projects from supporting background.
- Choose three built-in templates: Classic Blue, Quiet Minimal, and Sage Editorial.
- Import validated JSON templates or use PDF/PNG/JPEG files as visual references.
- Adjust layout, color, size and spacing; export PDF through browser printing, Markdown and JSON.
- Connect ChatGPT through stateless MCP tools and an interactive MCP Apps UI.
- Use OpenAI Responses API for structured editing proposals and approximate template style extraction.
- Review proposals before applying them; undo changes and preserve evidence boundaries.

## Start locally

Node.js 22.13+ is required. Manual editing does not need an API key.

```bash
git clone https://github.com/ilovemiku520/resume-workbench.git
cd resume-workbench
npm ci
npm run build
npm start
```

Open **http://localhost:4318**. Drafts are saved in this browser. Export JSON for a portable backup. Print on A4 with browser headers/footers disabled. Project links remain clickable; email and phone links are off by default. Long documents paginate automatically.

## AI and privacy

Bring your own OpenAI API key in Connection Settings. It is kept in page memory only and sent through the server of the site you are using. Only enter it on a server you trust. For a shared server key, configure both `OPENAI_API_KEY` and `APP_ACCESS_TOKEN` in `.env`; the server refuses to spend an unprotected shared key.

The API uses configurable `gpt-5-mini` by default, structured results and `store:false`. The latter does not promise zero retention by every provider or infrastructure layer. Contact redaction hides known basic profile fields and project URLs; other free text may still identify someone. Review before sending.

Reference PDF/image files stay in page memory until explicitly analyzed. AI style extraction sends their rendered image, including any personal information already visible in it. Use blank or redacted references. JSON templates contain only validated style parameters; arbitrary code is never executed. Image/PDF uploads are approximate references, not pixel-perfect template conversion.

MCP tools do not invoke a model or store resumes. ChatGPT provides the conversation model; the editor syncs context only on explicit interaction. Deploy HTTPS and follow [the connection guide](docs/CHATGPT.md). Source publication does not mean this project is listed in OpenAI's public plugin directory.

New documents contain generic placeholder labels only, without predefined identities, contact details, organizations or experiences. The repository does not contain the author's resume or photographs. Browser drafts use unencrypted localStorage; clear site data on shared computers. See [Privacy](docs/PRIVACY.md).

## Development

```bash
npm run check
npx playwright install chromium
npm run test:e2e
npm run dev
```

Tests cover editing, import, persistence, privacy, review/apply/undo, validation, protected shared keys, structured API requests and MCP round trips. Provider responses are mocked; live API access requires your own account and key.

The project uses React, TypeScript, Vite, Express, Zod, PDF.js, the official OpenAI SDK and MCP SDKs. Third-party dependencies retain their respective licenses. See [Deployment](docs/DEPLOYMENT.md), [Contributing](CONTRIBUTING.md) and [OpenAI's plugin documentation](https://developers.openai.com/plugins/quickstart).
