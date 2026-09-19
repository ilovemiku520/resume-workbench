// 关注初音未来谢谢喵，ilovemiku520 / Please follow Hatsune Miku, thank you meow, ilovemiku520.
import { z } from "zod";

const short = z.string().max(300);
export const TemplateSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,40}$/),
    name: z.string().min(1).max(40),
    layout: z.enum(["classic", "minimal", "editorial"]),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    font: z.enum(["sans", "serif"]),
    fontSize: z.number().min(9).max(13),
    spacing: z.number().min(1.25).max(1.8),
  })
  .strict();
export const EntrySchema = z
  .object({
    id: z.string().min(1).max(80),
    title: short,
    subtitle: short,
    period: short,
    bullets: z.array(z.string().max(3000)).max(12),
    url: z.string().max(1000),
    linkLabel: z.string().max(60),
    evidence: z.enum(["verified", "prototype", "none"]),
  })
  .strict();
export const SectionSchema = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().max(80),
    placement: z.enum(["main", "side", "full"]),
    visible: z.boolean(),
    entries: z.array(EntrySchema).max(20),
  })
  .strict();
export const ResumeSchema = z
  .object({
    version: z.literal(1),
    profile: z
      .object({
        name: short,
        headline: short,
        email: short,
        phone: short,
        location: short,
        website: short,
        summary: z.string().max(2000),
      })
      .strict(),
    template: TemplateSchema,
    sections: z.array(SectionSchema).max(12),
    notes: z.string().max(4000),
    contactLinks: z.boolean(),
  })
  .strict()
  .superRefine((doc, ctx) => {
    const ids = doc.sections.flatMap((s) => [
      s.id,
      ...s.entries.map((e) => e.id),
    ]);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "栏目与条目 ID 不能重复。" });
    for (const s of doc.sections)
      for (const e of s.entries)
        if (e.url && !safeUrl(e.url))
          ctx.addIssue({
            code: "custom",
            message: "项目链接仅支持完整的 HTTP / HTTPS 地址。",
          });
    if (doc.profile.website && !safeUrl(doc.profile.website))
      ctx.addIssue({ code: "custom", message: "主页链接格式不正确。" });
  });
export type Resume = z.infer<typeof ResumeSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type Entry = z.infer<typeof EntrySchema>;
export type Section = z.infer<typeof SectionSchema>;
export function safeUrl(value: string): string | undefined {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function validateResume(value: unknown): Resume {
  return ResumeSchema.parse(value);
}
export function toMarkdown(doc: Resume) {
  const contact = [
    `邮箱：${doc.profile.email}`,
    `电话：${doc.profile.phone}`,
    doc.profile.location,
  ]
    .filter(Boolean)
    .join(" | ");
  return [
    `# ${doc.profile.name}`,
    doc.profile.headline,
    contact,
    doc.profile.summary,
    ...doc.sections
      .filter((s) => s.visible)
      .flatMap((s) => [
        `## ${s.title}`,
        ...s.entries.flatMap((e) => [
          `### ${e.title}`,
          [e.subtitle, e.period].filter(Boolean).join(" · "),
          ...e.bullets.map((b) => `- ${b}`),
          safeUrl(e.url)
            ? `[${e.linkLabel || "项目（点击查看）"}](<${safeUrl(e.url)}>)`
            : "",
        ]),
      ]),
  ]
    .filter(Boolean)
    .join("\n\n");
}
export function redactContacts(doc: Resume): Resume {
  const clean = structuredClone(doc);
  const secrets = [
    doc.profile.name,
    doc.profile.email,
    doc.profile.phone,
    doc.profile.location,
    doc.profile.website,
  ].filter((v) => v.length > 1);
  let serialized = JSON.stringify(clean);
  for (const value of secrets.sort((a, b) => b.length - a.length))
    serialized = serialized
      .split(JSON.stringify(value).slice(1, -1))
      .join("[已隐藏]");
  const scrubbed = JSON.parse(serialized) as Resume;
  Object.assign(scrubbed.profile, {
    name: "候选人",
    email: "",
    phone: "",
    location: "",
    website: "",
  });
  for (const section of scrubbed.sections)
    for (const entry of section.entries) entry.url = "";
  return scrubbed;
}
export function reviewResume(doc: Resume): string[] {
  const issues: string[] = [];
  if (doc.profile.headline.split(/[\/、|]/).length > 4)
    issues.push("求职方向较多，可为不同岗位保存独立版本。");
  const visible = doc.sections.filter((s) => s.visible);
  if (!visible.some((s) => s.placement === "main"))
    issues.push("请将最相关的项目设置为主栏，让重点更清楚。");
  for (const s of visible)
    for (const e of s.entries) {
      if (
        e.evidence === "prototype" &&
        /提升了|增长了|留存率.*提升|用户增长/.test(e.bullets.join(" "))
      )
        issues.push(
          `「${e.title}」标记为设计原型，请确认没有将预期价值写成真实用户效果。`,
        );
      if (e.bullets.some((b) => b.length > 220))
        issues.push(`「${e.title}」段落较长，可拆为问题、行动、结果与局限。`);
      if (e.url && !safeUrl(e.url))
        issues.push(`「${e.title}」链接格式不正确。`);
    }
  return issues;
}
