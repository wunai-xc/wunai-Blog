/* ==========================================================================
   AestheticsHome.tsx — 首页（首页长滚动那一版）
   --------------------------------------------------------------------------
   本文件是服务端组件（app/[lang]/page.tsx 直接渲染它），不要加 "use client"：
   它是 async 的、要读文件系统取文章，并已把需要浏览器能力的两件事交给客户端
   子组件（HomeFx 管滚动揭示与数字滚动、PaletteGrid 管换肤）。

   本次改动只落在 PostCard 上（见下面的注释）：
     · 卡片外面多套一层 .ah-card-glow 壳，用来画「斜切光板」——
       伪元素永远画在元素自己的背景之上，光板画在 .ah-card 上会盖住卡片内容；
     · 文章有封面图（post.thumbnail）时，封面里放一个铺满的 <img>，
       图挂了或本来就没有图，底下的渐变色露出来当兜底；
     · 悬停浮出的两个小玻璃方块 .ah-card-spark。
   这三样的样式都在 app/aesthetics-home.css 第六节，只对玻璃主题生效。
   ========================================================================== */

import {
  SITE,
  getHomeShowcase,
  getLoosePosts,
  getAllTags,
  getChangelog,
  readingMinutes,
  type Lang,
  type Post,
} from "@/lib/content";
import { SKIN_PALETTES } from "@/lib/settings";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";
import HomeFx from "./HomeFx";
import PaletteGrid from "./PaletteGrid";

/* 行内自定义属性（--d / --i / --ah-angle…）不在 React.CSSProperties 里，
   写个交叉类型省掉每处的 as 断言。 */
type CSSVars = React.CSSProperties & Record<string, string | number>;

/** 逐字拆开一行标题（空格原样保留成占位），每个字自己带序号，
 *  动画延迟按序号错开 —— 与静态站 chars() 的做法一致。
 *  注意每个字都是 inline-block，所以中文换行不会被拆坏（一行一个 .ah-line）。 */
function chars(text: string, lineDelay: number) {
  return Array.from(text).map((ch, i) =>
    ch === " " ? (
      <span key={`s${i}`} className="ah-space">
        {" "}
      </span>
    ) : (
      <span
        key={i}
        className="ah-word"
        style={{ "--i": i, "--line-delay": `${lineDelay}s` } as CSSVars}
      >
        {ch}
      </span>
    )
  );
}

/** 跑马灯：两条一模一样的轨道首尾相接（第二条 aria-hidden），
 *  所以循环处不会露空隙。整条是装饰，外层已 aria-hidden。 */
function Marquee({ items, xl }: { items: string[]; xl?: boolean }) {
  const track = (key: string, hidden: boolean) => (
    <div className="ah-marquee-track" key={key} aria-hidden={hidden ? "true" : undefined}>
      {items.map((item, i) => (
        <span key={i} aria-hidden={i % 2 === 1 ? "true" : undefined}>
          {item}
        </span>
      ))}
    </div>
  );
  return (
    <div className={`ah-marquee${xl ? " ah-marquee-xl" : ""}`} aria-hidden="true">
      {track("a", false)}
      {track("b", true)}
    </div>
  );
}

/** 文章卡片（斜切光板 + 玻璃面板）。
 *
 *  结构分三层，缺一不可：
 *    1. 外层壳 .ah-card-glow —— 斜切光板（::before / ::after）与浮出的小方块都画在这里。
 *       壳必须是栅格里的那一格：光板要探出卡片边缘，卡片不能有 overflow 裁剪；
 *       而伪元素永远在元素自己的背景之上，所以光板不能画在卡片本身上。
 *    2. 卡片 .ah-card —— 玻璃面（aesthetics.css 提供的 --glass-surface + 虚化），
 *       抬到 z-index 1，于是玻璃把背后的光板糊了一层，字仍然是清楚的。
 *    3. 封面 .ah-card-media —— 有封面图就铺图，没有就是一道按当前配色算的渐变。
 *
 *  封面图取 post.thumbnail（frontmatter 的 cover.image，没有则正文第一张图），
 *  与纸质主题的 .post-card-thumb 同一个数据源、同一个 referrerPolicy：
 *  图可能是外链，对方禁止外链时 img 什么都不画，底下的渐变露出来顶上。
 */
function PostCard({
  post,
  lang,
  index,
  feature,
  readLabel,
}: {
  post: Post;
  lang: Lang;
  index: number;
  feature?: boolean;
  readLabel: string;
}) {
  /* 渐变角度按序号错开，免得每张卡看起来都是同一块布 */
  const angle = `${105 + index * 14}deg`;
  const image = post.thumbnail;
  return (
    /* is-feature 两边都带：壳上那份管栅格占位（格子里现在放的是壳），
       卡片上那份留给既有的封面比例与标题字号规则。 */
    <div
      className={`ah-card-glow${feature ? " is-feature" : ""}`}
      data-ah-reveal="up"
      style={{ "--d": `${(index * 0.07).toFixed(2)}s` } as CSSVars}
    >
      <article className={`ah-card${feature ? " is-feature" : ""}`}>
        <a
          className="ah-card-link"
          href={`/${lang}/posts/${encodeURIComponent(post.slug)}/`}
          aria-label={post.title}
        />
        <div
          className={`ah-card-media${image ? " has-image" : ""}`}
          style={{ "--ah-angle": angle } as CSSVars}
        >
          {image ? (
            /* 图片可能是任意域名，用原生 img（next/image 需预声明 remotePatterns）；
               referrerPolicy="no-referrer" 与纸质主题的缩略图一致，避免图床拦外链。 */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className="ah-card-image"
              src={image}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="ah-card-lines" aria-hidden="true" />
          )}
          <span className="ah-card-num" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <div className="ah-card-body">
          {post.categories[0] && <p className="ah-card-cat">{post.categories[0]}</p>}
          <h3 className="ah-card-title">{post.title}</h3>
          {post.summary && <p className="ah-card-excerpt">{post.summary}</p>}
          <p className="ah-card-meta">
            <span>{post.date}</span>
            <span aria-hidden="true">/</span>
            <span>
              {readingMinutes(post.wordCount)} {readLabel}
            </span>
            {post.isAI && <span className="ah-flag">AI</span>}
          </p>
        </div>
      </article>
      {/* 悬停时从左上 / 右下浮出的两个小玻璃方块（见 aesthetics-home.css 第六节） */}
      <span className="ah-card-spark" aria-hidden="true" />
    </div>
  );
}

/**
 * 首页（第二套视觉第一期：整段照搬静态站的排版与动效）。
 *
 * 与上一版的区别：三屏吸附（.home-pager + 分页点 + HomeSnap 加力）换成一页
 * 长滚动，区块依次是：首屏 → 精选三篇 → 数据栏 → 八套配色 → 更多文章 →
 * 更新。逐字上升与跑马灯是纯 CSS，滚动揭示与数字滚动在 components/HomeFx.tsx。
 *
 * 只动观感与版式，不动数据来源：文章仍走 lib/content.ts（置顶优先、
 * AI 文与卡组不进展示位），更新列表仍读 public/changelog.json。
 */
export default async function AestheticsHome({ lang }: { lang: Lang }) {
  const t = SITE.i18n[lang];
  const info = SITE.homeInfo[lang];

  const picks = getHomeShowcase(lang, 3);
  const allPosts = getLoosePosts(lang);
  const picksSlugs = new Set(picks.map((p) => p.slug));
  const more = allPosts.filter((p) => !picksSlugs.has(p.slug)).slice(0, 6);
  const tagCount = getAllTags(lang).length;
  const updates = getChangelog().slice(0, 6);

  return (
    <div className="ah">
      {/* ===== 首屏 ===== */}
      <section className="ah-hero">
        <div className="ah-container ah-hero-inner">
          <p className="ah-kicker">
            <span className="ah-live">
              <i aria-hidden="true" />
              {t.homeLive}
            </span>
            <span>{t.homeKicker1}</span>
            <span aria-hidden="true">✳</span>
            <span>{t.homeKicker2}</span>
          </p>

          <h1 className="ah-hero-title">
            {t.homeHeroLines.map((line, i) => (
              <span className="ah-line" key={i}>
                {i === 1 ? <em>{chars(line, 0.16)}</em> : chars(line, i * 0.16)}
              </span>
            ))}
          </h1>

          <p className="ah-hero-sub">{info.content}</p>

          <div className="ah-hero-actions">
            <a className="ah-btn ah-btn-primary" href={`/${lang}/posts/`}>
              {t.homeStartReading}
              <span className="ah-btn-arrow" aria-hidden="true">
                →
              </span>
            </a>
            <a className="ah-btn" href={`/${lang}/settings/`}>
              {t.settings}
            </a>
            <span className="ah-cue">
              <span className="ah-cue-line" aria-hidden="true" />
              {t.scrollDown}
            </span>
          </div>

          {/* 三个色彩角色块：直接显示当前配色的主色 / 副色 / 刺激色 */}
          <div className="ah-figures" aria-hidden="true">
            {([
              ["C1", "--ah-c1"],
              ["C2", "--ah-c2"],
              ["C3", "--ah-c3"],
            ] as const).map(([label, token]) => (
              <div className="ah-figure" key={label} title={label}>
                <span style={{ "--ah-fc": `var(${token})` } as CSSVars}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ah-container">
          <div className="ah-marquee-band">
            <Marquee items={t.homeMarquee} xl />
          </div>
        </div>
      </section>

      {/* ===== 精选三篇（数据仍是首页展示位：有置顶用置顶，否则最新三篇） ===== */}
      {picks.length > 0 && (
        <section className="ah-section">
          <div className="ah-container">
            <div className="ah-head">
              <div className="ah-spread">
                <div>
                  <p className="ah-eyebrow">{t.homeFeaturedEyebrow}</p>
                  <h2 className="ah-h2">
                    {t.homeFeaturedTitle}
                    <span className="ah-thin">{t.homeFeaturedThin}</span>
                  </h2>
                </div>
                <a className="ah-btn ah-btn-ghost" href={`/${lang}/posts/`}>
                  {t.allPosts}
                  <span className="ah-btn-arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              </div>
            </div>

            <div className="ah-grid">
              {picks.map((post, i) => (
                <PostCard
                  key={post.slug}
                  post={post}
                  lang={lang}
                  index={i}
                  feature={i === 0}
                  readLabel={t.readingTime}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 引文 + 数据（数字由 HomeFx 从 0 滚到目标值） ===== */}
      <section className="ah-section">
        <div className="ah-container ah-rail">
          <div className="ah-quote" data-ah-reveal="up">
            <p>{t.homeQuote}</p>
            <cite>{t.homeQuoteCite}</cite>
          </div>

          <div className="ah-stack" data-ah-reveal="up" style={{ "--d": "0.1s" } as CSSVars}>
            <div className="ah-cluster ah-stats">
              <div className="ah-stat">
                <span className="ah-stat-value">
                  <span data-ah-count>{allPosts.length}</span>
                </span>
                <span className="ah-stat-label">{t.homeStatPosts}</span>
              </div>
              <div className="ah-stat">
                <span className="ah-stat-value">
                  <span data-ah-count>{SKIN_PALETTES.length}</span>
                </span>
                <span className="ah-stat-label">{t.homeStatPalettes}</span>
              </div>
              <div className="ah-stat">
                <span className="ah-stat-value">
                  <span data-ah-count>{tagCount}</span>
                </span>
                <span className="ah-stat-label">{t.homeStatTags}</span>
              </div>
              <div className="ah-stat">
                <span className="ah-stat-value">
                  <span data-ah-count>2</span>
                </span>
                <span className="ah-stat-label">{t.homeStatLangs}</span>
              </div>
            </div>

            <div className="ah-divider" aria-hidden="true" />

            <p className="ah-label">{t.homeStructureLabel}</p>
            <ul className="ah-list">
              {t.homeStructure.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== 八套配色（点一下换肤，与设置页写同一组键） ===== */}
      <section className="ah-section">
        <div className="ah-container">
          <div className="ah-head">
            <div className="ah-spread">
              <div>
                <p className="ah-eyebrow">{t.homePaletteEyebrow}</p>
                <h2 className="ah-h2">
                  {t.homePaletteTitle}
                  <span className="ah-thin">{t.homePaletteThin}</span>
                </h2>
              </div>
              <a className="ah-btn" href={`/${lang}/settings/`}>
                {t.settings}
                <span className="ah-btn-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            </div>
          </div>

          <PaletteGrid lang={lang} />
        </div>
      </section>

      {/* ===== 更多文章 ===== */}
      {more.length > 0 && (
        <section className="ah-section">
          <div className="ah-container">
            <div className="ah-head">
              <div>
                <p className="ah-eyebrow">{t.homeMoreEyebrow}</p>
                <h2 className="ah-h2">
                  {t.homeMoreTitle}
                  <span className="ah-thin">{t.homeMoreThin}</span>
                </h2>
              </div>
            </div>

            <div className="ah-grid">
              {more.map((post, i) => (
                <PostCard
                  key={post.slug}
                  post={post}
                  lang={lang}
                  index={i + 3}
                  readLabel={t.readingTime}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 更新：RSS 说明 + 仓库提交（原第 2 屏的内容保住了，只是换了排版） ===== */}
      <section className="ah-section">
        <div className="ah-container ah-rail">
          <div className="ah-stack" data-ah-reveal="up">
            <p className="ah-eyebrow">{t.updates}</p>
            <h2 className="ah-h2">
              {t.homeRssTitleLines.map((line, i) => (
                <span className="ah-line" key={i}>
                  {line}
                </span>
              ))}
            </h2>
            <p className="ah-lede">{t.homeRssBody}</p>
            <div className="ah-cluster">
              <a className="ah-btn" href="/rss.xml">
                <Icon icon={icons["mdi:arrow-right"]} width="1em" height="1em" />
                {t.homeSubscribeRss}
              </a>
              <a className="ah-btn ah-btn-ghost" href={`/${lang}/posts/`}>
                {t.allPosts}
              </a>
            </div>
          </div>

          <div className="ah-stack" data-ah-reveal="up" style={{ "--d": "0.1s" } as CSSVars}>
            <p className="ah-label">{t.updates}</p>
            {updates.length > 0 ? (
              <ul className="ah-updates">
                {updates.map((c, i) => (
                  <li key={c.sha}>
                    <a
                      className="ah-update"
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="ah-update-date">{c.date ?? c.sha}</span>
                      <span className="ah-update-title">{c.message}</span>
                      {i === 0 && <span className="ah-update-tag">{t.newBadge}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ah-note">{t.homeUpdatesEmpty}</p>
            )}
            <p className="ah-note">{t.homeUpdatesNote}</p>
          </div>
        </div>
      </section>

      <HomeFx />
    </div>
  );
}
