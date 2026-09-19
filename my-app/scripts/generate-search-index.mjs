// 生成搜索索引到 public/ 目录
import fs from "fs";
import path from "path";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const PUBLIC_ROOT = path.join(process.cwd(), "public");

function readMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const tomlMatch = raw.match(/^\+\+\+\s*\n([\s\S]*?)\n\+\+\+\s*\n?/);
  if (tomlMatch) {
    const body = raw.slice(tomlMatch[0].length);
    return { data: parseToml(tomlMatch[1]), content: body };
  }
  // 简易 YAML frontmatter 解析
  const yamlMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (yamlMatch) {
    const body = raw.slice(yamlMatch[0].length);
    return { data: parseYaml(yamlMatch[1]), content: body };
  }
  return { data: {}, content: raw };
}

function parseYaml(block) {
  const result = {};
  for (const line of block.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf(":");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    result[key] = parseVal(val);
  }
  return result;
}

function parseToml(block) {
  const result = {};
  for (const line of block.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    result[t.slice(0, i).trim()] = parseVal(t.slice(i + 1).trim());
  }
  return result;
}

function parseVal(v) {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    return inner ? inner.split(",").map((s) => parseVal(s.trim())) : [];
  }
  if (v === "true") return true;
  if (v === "false") return false;
  if (!isNaN(Number(v))) return Number(v);
  return v;
}

/* 收集一个语言下的全部文章，返回 { slug, filePath }[]。

   必须与 lib/content.ts 的扫描规则保持一致，支持三种写法：
     平铺：          <name>.md              → slug = name
     单篇文件夹：    <dir>/index.md          → slug = dir
     卡组：          <dir>/_index.md + 其它  → slug = 成员文件名（撞名时加组名前缀）
   _index.md 是卡组的组说明，本身不是文章，要跳过。

   为什么必须递归：卡组内的文章也是文章，只读顶层会让它们整个掉出搜索索引
   （同时也掉出 RSS）。拆分《博客书写规范》后曾因此从搜索里消失。 */
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
        // 没有 _index.md：只有 index.md 时按单篇文件夹处理，否则忽略该目录
        if (fs.existsSync(leafIndex)) out.push({ slug: unique(entry.name), filePath: leafIndex });
        continue;
      }
      // 卡组：跳过两个索引文件，其余按文件名顺序收集
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

for (const lang of ["zh", "en"]) {
  const dir = path.join(CONTENT_ROOT, lang, "posts");
  if (!fs.existsSync(dir)) continue;
  const docs = collectPosts(dir)
    .map(({ slug, filePath }) => {
      const { data, content } = readMarkdown(filePath);
      if (data.draft) return null;
      return {
        slug,
        title: data.title || slug,
        summary: data.summary || "",
        tags: data.tags || [],
        content: content.replace(/[#>*`\-\[\]]/g, " ").slice(0, 2000),
      };
    })
    .filter(Boolean);
  fs.writeFileSync(
    path.join(PUBLIC_ROOT, `search-index.${lang}.json`),
    JSON.stringify(docs)
  );
  console.log(`Generated search-index.${lang}.json (${docs.length} docs)`);
}
