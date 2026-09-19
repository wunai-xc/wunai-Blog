import { SITE, type Lang } from "../lib/content";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";
import ThemeToggle from "./ThemeToggle";
import FontSizeControl from "./FontSizeControl";
import LangSwitcher from "./LangSwitcher";
import HeaderIntro from "./HeaderIntro";

/**
 * 顶栏布局（结构对齐参考稿，视觉沿用本站的简白风格）：
 *
 *   [主题切换]  Wunai's Blog▌        ┆ 导航菜单 ┆ 友链      [ 图片区 ]
 *   wunai是谁？About……  all posts →  ┆
 *
 * 左区：主题切换（参考稿里的圆形开关位）+ 大号 logo（带闪烁光标）+ 小字行
 * 中区：导航菜单（沿用原菜单项与图标）+ 友链
 * 右区：图片区（图片由 CSS 背景承载，可换成真实图片 URL）
 *
 * 注意：菜单 href 必须带语言前缀，否则会跳出 /zh 或 /en 命名空间。
 */
export default function Header({ lang }: { lang: Lang }) {
  const menu = SITE.menu[lang];
  const t = SITE.i18n[lang];
  const isZh = lang === "zh";
  const about = `/${lang}/`;

  return (
    <header className="site-header">
      <ul className="navbar">
        {/* ===== 左：品牌区 ===== */}
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
              <a href={about}>{isZh ? "About……" : "About…"}</a>
            </span>
            <a className="all-posts" href={`/${lang}/posts/`}>
              all posts →
            </a>
          </div>
        </li>

        {/* ===== 中：导航菜单 ===== */}
        <li className="menu" data-fade>
          {menu.map((item) => (
            <a
              key={item.href}
              className="menu-link"
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <Icon icon={icons[item.icon]} width="1.15em" height="1.15em" />
              <span>{item.name}</span>
            </a>
          ))}
        </li>

        {/* ===== 中：友链 ===== */}
        <li className="friends" data-fade>
          <a className="friends-link" href={`/${lang}/links/`} title={t.links} aria-label={t.links}>
            <Icon
              icon={icons["mdi:account-multiple-outline"]}
              className="friends-icon"
              width="1.35em"
              height="1.35em"
            />
            <span className="friends-label">{t.links}</span>
          </a>
        </li>

        {/* ===== 右：工具栏 + 图片区 ===== */}
        <li className="header-tools-li" data-fade>
          <div className="header-tools">
            <FontSizeControl />
            <a
              href={`/${lang}/settings/`}
              className="icon-btn"
              title={t.settings}
              aria-label={t.settings}
            >
              <Icon icon={icons["mdi:cog-outline"]} width="1.2em" height="1.2em" />
            </a>
            <LangSwitcher />
          </div>
        </li>

        <li className="image-placeholder" data-fade aria-hidden="true" />
      </ul>

      <HeaderIntro />
    </header>
  );
}
