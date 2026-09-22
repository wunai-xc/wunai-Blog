import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";
import { SITE, type Lang } from "@/lib/content";

/* ===== 「搜索 / 标签」浮动按钮（文章列表页 /<lang>/posts/）=====

   与文章详情页的目录、正文字号按钮同一套外观与格位算法（见 globals.css
   的「左边缘的浮动按钮列」），只是两页各一列：
     列表页 = 搜索 → 标签（本组件）
     详情页 = 目录 → 正文字号

   这两个是 <a> 而不是带面板的按钮 —— 它们指向已有的两个页面
   （/<lang>/search/、/<lang>/tags/），点一下就到，不需要任何客户端状态：
   - 搜索页自带输入框与 Fuse 全文索引（components/Search.tsx）；
   - 标签页是标签云（app/[lang]/tags/page.tsx）。
   在这里再抄一份搜索框/标签云，只会多一份要同步维护的实现。

   注意：这是服务端组件，不带 "use client"。 */
export default function ArticleQuickLinks({ lang }: { lang: Lang }) {
  const t = SITE.i18n[lang];

  return (
    <>
      <a
        className="search-fab"
        href={`/${lang}/search/`}
        title={t.search}
        aria-label={t.search}
      >
        <Icon icon={icons["mdi:magnify"]} width="1.25em" height="1.25em" />
      </a>

      <a
        className="tags-fab"
        href={`/${lang}/tags/`}
        title={t.tags}
        aria-label={t.tags}
      >
        <Icon icon={icons["mdi:tag-multiple-outline"]} width="1.25em" height="1.25em" />
      </a>
    </>
  );
}
