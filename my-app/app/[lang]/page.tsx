import { type Lang } from "@/lib/content";
import AestheticsHome from "@/components/AestheticsHome";

/**
 * 首页（第二套视觉第一期：一页长滚动）。
 *
 * 上一版是三屏吸附（.home-pager + 右侧分页点 + HomeSnap 加力）。
 * 这一版把静态站（aesthetics-blog）的首页整段搬过来：首屏三行大标题 +
 * 跑马灯、精选三篇、数据栏与引文、八套配色网格、更多文章、更新。
 * 具体组成与数据来源见 components/AestheticsHome.tsx 的注释。
 *
 * 两点说明：
 * 1. 吸附写在 `<html>` 上的 `:has(.home-pager)`（见 globals.css）——
 *    这一版不再输出 .home-pager，所以长滚动不会被吸附打断；
 *    HomeSnap 与 PageIndicator 不做渲染，留在仓库里等确定不再用再删。
 * 2. 文案全部走 lib/site.ts 的 i18n（中英各一份），页面里不内联中文字符串。
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const p = await params;
  const lang = p.lang as Lang;
  return <AestheticsHome lang={lang} />;
}
