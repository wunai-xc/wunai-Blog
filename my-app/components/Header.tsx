import { SITE, type Lang } from "../lib/content";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";
import ThemeToggle from "./ThemeToggle";
import HeaderIntro from "./HeaderIntro";

/**
 * 顶栏结构（严格对齐参考稿）：
 *
 *   [主题切换]  Wunai's Blog▌                (友链图标)        [ 图片 ]
 *   wunai是谁？About……  all posts →            友链
 *
 * 三个分区，除此之外没有别的东西：
 *   ① 品牌区：主题切换 + 大号 logo（带闪烁光标）+ 小字行
 *   ② 友链：竖排图标 + 文字
 *   ③ 图片区：撑满顶栏高度
 *
 * 视觉沿用本站简白（底色/边框/hover 都走现有令牌），圆角按站内直角约定。
 */
export default function Header({ lang }: { lang: Lang }) {
  const t = SITE.i18n[lang];
  const isZh = lang === "zh";

  return (
    <header className="site-header">
      <ul className="navbar">
        {/* ===== ① 品牌区 ===== */}
        <li className="brand">
          <div className="brand-switch" data-fade>
            <ThemeToggle />
          </div>

          <div className="brand-text" data-fade>
            <a className="logo-link" href={`/${lang}/`}>
              <span className="logo">
                {SITE.title}
                <span className="cursor" aria-hidden="true" />
              </span>
            </a>
          </div>

          <div className="tagline-row" data-fade>
            <span className="tagline">
              {isZh ? "wunai是谁？" : "Who is wunai?"}{" "}
              <a href={`/${lang}/`}>{isZh ? "About……" : "About…"}</a>
            </span>
            <a className="all-posts" href={`/${lang}/posts/`}>
              all posts →
            </a>
          </div>
        </li>

        {/* ===== ② 友链 ===== */}
        <li className="friends" data-fade>
          <a
            className="friends-link"
            href={`/${lang}/links/`}
            title={t.links}
            aria-label={t.links}
          >
            <Icon
              icon={icons["mdi:account-multiple-outline"]}
              className="friends-icon"
              width="1.3em"
              height="1.3em"
            />
            <span className="friends-label">{t.links}</span>
          </a>
        </li>

        {/* ===== ③ 图片区 ===== */}
        <li className="image-placeholder" data-fade aria-hidden="true">
          {/* 用现在在用的站点图片；换成别的只需改 src */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/LOGO/wunai_xc.jpg" alt="" />
        </li>
      </ul>

      <HeaderIntro />
    </header>
  );
}
