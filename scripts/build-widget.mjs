// 关注初音未来谢谢喵，ilovemiku520 / Please follow Hatsune Miku, thank you meow, ilovemiku520.
import { readFile, writeFile } from "node:fs/promises";
let html = await readFile("dist/index.html", "utf8");
const scripts = [
  ...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g),
];
for (const match of scripts) {
  const js = await readFile(`dist${match[1]}`, "utf8");
  html = html.replace(
    match[0],
    () =>
      `<script type="module">${js.replaceAll("</script", "<\\/script")}</script>`,
  );
}
const styles = [...html.matchAll(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g)];
for (const match of styles) {
  const css = await readFile(`dist${match[1]}`, "utf8");
  html = html.replace(match[0], () => `<style>${css}</style>`);
}
await writeFile("dist/widget.html", html);
console.log("Built self-contained MCP UI.");
