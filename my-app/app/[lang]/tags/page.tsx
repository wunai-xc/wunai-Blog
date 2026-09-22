import { getAllTags, getPostsByTag, SITE, type Lang } from "@/lib/content";

/* 标签云（此前只有 /<lang>/tags/<tag>/ 单个标签页，缺一个总览页；
   文章页左边缘的「标签」浮动按钮需要一个落脚点，这里补上）。
   与 categories/page.tsx 同一套结构与样式。 */
export default async function TagsPage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params;
  const lang = p.lang as Lang;
  const tags = getAllTags(lang);

  return (
    <div className="container">
      <h1 className="page-title" style={{ fontSize: "1.6rem", margin: "24px 0 16px" }}>
        {SITE.i18n[lang].tags}
      </h1>
      {tags.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>{lang === "zh" ? "还没有标签。" : "No tags yet."}</p>
      ) : (
        <div className="term-cloud">
          {tags.map((tag) => (
            <a
              key={tag}
              href={`/${lang}/tags/${encodeURIComponent(tag)}/`}
              className="term-item"
            >
              #{tag}
              <span className="term-count">{getPostsByTag(lang, tag).length}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
