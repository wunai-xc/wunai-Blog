import { notFound } from "next/navigation";
import { getPage, type Lang } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import PostBody from "@/components/PostBody";

/* 「关于」独立页面。
 *
 * 文案不写在这里，而是写在各语言自己的 Markdown 里：
 *   content/zh/about.md
 *   content/en/about.md
 * 想改内容直接编辑上面两个文件，这个文件不用动。
 *
 * 它的定位是「固定页面」，与「文章」不同：
 *   - 不进文章列表 / 归档 / 标签 / 分类 / 搜索索引 / RSS；
 *   - frontmatter 只需要 title（可选 description），没有 date 也不会报错。
 *
 * 正文交给 PostBody 渲染，所以公式、mermaid、代码高亮、
 * 代码复制按钮这些正文能力它全都有。
 */
export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params;
  const lang = p.lang as Lang;
  const page = getPage(lang, "about");
  // 文件不存在时给 404，而不是渲染一个空壳页面
  if (!page) notFound();

  /* slug 只影响「相对路径的图片」如何解析（会变成 /<lang>/posts/about/...）。
     独立页面没有文章目录，所以正文里的图片请用 / 开头的绝对路径。 */
  const html = await renderMarkdown({
    lang,
    slug: page.name,
    content: page.content,
    references: page.references,
  });

  return (
    <div className="post-layout">
      <article className="post-content">
        <header className="post-header">
          <h1>{page.title}</h1>
          {page.description && <p className="page-description">{page.description}</p>}
        </header>

        <PostBody html={html} slug={page.name} />
      </article>
    </div>
  );
}
