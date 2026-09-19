// 生成 RSS feed 到 public/rss.xml
import fs from "fs";
import path from "path";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const PUBLIC_ROOT = path.join(process.cwd(), "public");
const BASE = "https://blog.wunai.top";

function readMd(fp) {
  const raw = fs.readFileSync(fp, "utf8");
  const toml = raw.match(/^\+\+\+\s*\n([\s\S]*?)\n\+\+\+\s*\n?/);
  if (toml) return { data: parseToml(toml[1]), content: raw.slice(toml[0].length) };
  const yaml = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (yaml) return { data: parseYaml(yaml[1]), content: raw.slice(yaml[0].length) };
  return { data: {}, content: raw };
}
function parseYaml(b) {
  const r = {};
  for (const l of b.split("\n")) {
    const t = l.trim(); if (!t || t.startsWith("#")) continue;
    const i = t.indexOf(":"); if (i === -1) continue;
    r[t.slice(0, i).trim()] = parseVal(t.slice(i + 1).trim());
  }
  return r;
}
function parseToml(b) {
  const r = {};
  for (const l of b.split("\n")) {
    const t = l.trim(); if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("="); if (i === -1) continue;
    r[t.slice(0, i).trim()] = parseVal(t.slice(i + 1).trim());
  }
  return r;
}
function parseVal(v) {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  if (v.startsWith("[") && v.endsWith("]")) { const i = v.slice(1, -1).trim(); return i ? i.split(",").map(s => parseVal(s.trim())) : []; }
  if (v === "true") return true; if (v === "false") return false;
  if (!isNaN(Number(v))) return Number(v); return v;
}

/* 收集一个语言下的全部文章（与 scripts/generate-search-index.mjs 同规则）。
   必须递归子目录：卡组内的文章也是文章，只读顶层会让它们掉出 RSS。 */
function collectPosts(dir) {
  const out = [];
  const used = new Set();
  const unique = (base, group) => {
    if (!used.has(base)) return base;
    if (group && !used.has(`${group}--${base}`)) return `${group}--${base}`;
    let i = 2;
    while (used.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  };

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const sub = path.join(dir, entry.name);
      const groupIndex = path.join(sub, "_index.md");
      const leafIndex = path.join(sub, "index.md");
      if (!fs.existsSync(groupIndex)) {
        if (fs.existsSync(leafIndex)) out.push({ slug: unique(entry.name), filePath: leafIndex });
        continue;
      }
      fs.readdirSync(sub)
        .filter((f) => f.endsWith(".md") && f !== "_index.md" && f !== "index.md")
        .sort()
        .forEach((f) =>
          out.push({
            slug: unique(f.replace(/\.md$/, ""), entry.name),
            filePath: path.join(sub, f),
          })
        );
      continue;
    }
    if (!entry.name.endsWith(".md") || entry.name === "_index.md") continue;
    out.push({
      slug: unique(entry.name.replace(/\.md$/, "")),
      filePath: path.join(dir, entry.name),
    });
  }
  return out;
}

const allPosts = [];
for (const lang of ["zh", "en"]) {
  const dir = path.join(CONTENT_ROOT, lang, "posts");
  if (!fs.existsSync(dir)) continue;
  for (const { slug, filePath } of collectPosts(dir)) {
    const { data, content } = readMd(filePath);
    if (data.draft) continue;
    allPosts.push({ lang, slug, title: data.title, date: String(data.date), summary: data.summary || content.slice(0, 200) });
  }
}
allPosts.sort((a, b) => b.date.localeCompare(a.date));

const items = allPosts.slice(0, 20).map(p => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${BASE}/${p.lang}/posts/${encodeURIComponent(p.slug)}/</link>
      <guid>${BASE}/${p.lang}/posts/${encodeURIComponent(p.slug)}/</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description><![CDATA[${p.summary}]]></description>
    </item>`).join("");

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>wunai's blog</title>
    <link>${BASE}</link>
    <description>学习笔记与生活思考</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

fs.writeFileSync(path.join(PUBLIC_ROOT, "rss.xml"), rss);
console.log("Generated rss.xml");
