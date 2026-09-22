import { getGroups, getLoosePosts, type Lang, type Post, type PostGroup } from "@/lib/content";
import PostCard from "@/components/PostCard";
import GroupCard from "@/components/GroupCard";
import ArticleQuickLinks from "@/components/ArticleQuickLinks";

export const dynamicParams = false;

/* 卡组与独立文章混在一张列表里。
   排序规则沿用文章原有的「非 AI 在前、AI 在后，各自按日期降序」：
   卡组本身没有作者，归入非 AI 组，用组内最新文章的日期去定位。 */
type Entry = { kind: "post"; post: Post; date: string; isAI: boolean } | { kind: "group"; group: PostGroup };

function buildEntries(lang: Lang): Entry[] {
  const entries: Entry[] = [
    ...getLoosePosts(lang).map((post) => ({ kind: "post" as const, post, date: post.date, isAI: post.isAI })),
    ...getGroups(lang).map((group) => ({ kind: "group" as const, group })),
  ];
  const dateOf = (e: Entry) => (e.kind === "post" ? e.date : e.group.date);
  const bucket = (e: Entry) => (e.kind === "post" ? (e.isAI ? 1 : 0) : 0);
  return entries.sort((a, b) =>
    bucket(a) - bucket(b) || dateOf(b).localeCompare(dateOf(a))
  );
}

export default async function PostsPage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const entries = buildEntries(lang);
  return (
    <div className="container">
      <h1 className="page-title" style={{ fontSize: "1.6rem", margin: "24px 0 16px" }}>{lang === "zh" ? "文章" : "Posts"}</h1>
      {entries.map((e) =>
        e.kind === "group" ? (
          <GroupCard key={`group:${e.group.slug}`} group={e.group} lang={lang} />
        ) : (
          <PostCard key={e.post.slug} post={e.post} lang={lang} />
        )
      )}

      {/* 左边缘浮动按钮：搜索 / 标签。
          放在这一页的理由：列表页本身就是「文章太多、想快点找到某一篇」的场景，
          而搜索页与标签云此前在界面上没有任何入口（SITE.menu 是死数据）。 */}
      <ArticleQuickLinks lang={lang} />
    </div>
  );
}
