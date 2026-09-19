<p align="center"><img src="assets/readme-hero.svg" alt="Resume Workbench" width="100%"></p>

<p align="center"><strong>Write your story. Keep your facts. Own your data.</strong><br>A self-hostable resume editor and ChatGPT MCP plugin.</p>
<p align="center"><a href="README.md">简体中文</a> | <strong>English</strong> · <a href="docs/CHATGPT.md">ChatGPT setup</a> · <a href="docs/DEPLOYMENT.md">Deployment</a></p>

> **Star before use:** Star this repository before using, referencing, adapting, or studying it, including use or learning by AI systems. See the custom [Star-First license](LICENSE). This is source-available software, not an MIT/OSI-licensed project.

![Actual workbench with entirely fictional sample data](assets/workbench.png)

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

All bundled identities, contact details, organizations and experiences are fictional. The repository does not contain the author's resume or photographs. Browser drafts use unencrypted localStorage; clear site data on shared computers. See [Privacy](docs/PRIVACY.md).

## Development

```bash
npm run check
npx playwright install chromium
npm run test:e2e
npm run dev
```

Tests cover editing, import, persistence, privacy, review/apply/undo, validation, protected shared keys, structured API requests and MCP round trips. Provider responses are mocked; live API access requires your own account and key.

The project uses React, TypeScript, Vite, Express, Zod, PDF.js, the official OpenAI SDK and MCP SDKs. Third-party dependencies retain their respective licenses. See [Deployment](docs/DEPLOYMENT.md), [Contributing](CONTRIBUTING.md) and [OpenAI's plugin documentation](https://developers.openai.com/plugins/quickstart).
