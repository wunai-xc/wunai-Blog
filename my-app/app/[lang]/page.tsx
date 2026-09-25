import {
  SITE,
  getHomeShowcase,
  getChangelog,
  readingMinutes,
  type Lang,
} from "@/lib/content";
import PageIndicator from "@/components/PageIndicator";
import HomeSnap from "@/components/HomeSnap";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";

/**
 * 首页：三屏吸附式（scroll-snap）
 *
 *   第 1 屏  首屏问候 + 向下提示
 *   第 2 屏  更新内容（最近提交，数据来自 public/changelog.json）
 *   第 3 屏  随便看看（交错卡片）+ 全部文章入口
 *
 * 几点实现说明：
 *
 * 1. 吸附写在 <html> 上的 scroll-snap-type: y proximity（见 globals.css），
 *    而不是另建一个 100vh 的内部滚动容器。原因是页脚（语言切换/设置）在首页
 *    之后，如果让首页独占滚动，页脚会被永久挡住够不到。
 *    **强度只能用 proximity，不能用 mandatory**：它要求滚动容器只能停在吸附点上，
 *    而三屏之后还跟着页脚、页脚没有吸附点，滚到第 3 屏起点后再往下就会被弹回，
 *    页脚永远够不到（与屏高无关）。加力改由 HomeSnap 的辅助吸附提供。
 *
 * 2. 每屏高度取 calc(100svh - var(--header-h))，而不是 100vh：
 *    顶栏是 sticky 常驻的，扣掉它才能让每屏刚好填满可见区域；
 *    用 svh 而非 vh 是为了避开手机浏览器地址栏伸缩导致的跳动。
 *
 * 3. 高度用 min-height 而非 height：更新列表较长时允许本屏自然变高，
 *    不会像固定高度那样被裁掉内容。
 */
export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params;
  const lang = p.lang as Lang;
  const t = SITE.i18n[lang];
  const info = SITE.homeInfo[lang];

  const updates = getChangelog();
  const picks = getHomeShowcase(lang, 6);

  return (
    <div className="home-pager">
      {/* ===== 第 1 屏：首屏 ===== */}
      <section className="home-page" data-home-page id="home-page-1">
        <h1 className="hero-title">
          {t.heroLead} <em>{SITE.author}</em>{t.heroEnd}
        </h1>
        <p className="hero-sub">{info.content}</p>

        {/* 有更新就滚到第 2 屏，没有就直奔第 3 屏，避免停在空屏上 */}
        <a
          className="hero-hint"
          href={updates.length > 0 ? "#home-page-2" : "#home-page-3"}
          title={t.scrollDown}
          aria-label={t.scrollDown}
        >
          <span>{t.scrollDown}</span>
          <Icon icon={icons["mdi:chevron-down"]} width="1.1em" height="1.1em" />
        </a>
      </section>

      {/* ===== 第 2 屏：更新内容 ===== */}
      {updates.length > 0 && (
        <section className="home-page home-section" data-home-page id="home-page-2">
          <h2 className="section-title">{t.whatsNew}</h2>
          <p className="section-sub">{t.whatsNewSub}</p>

          <ul className="update-list">
            {updates.map((c, i) => (
              <li key={c.sha}>
                <a
                  className={`update-item${i === 0 ? " is-new" : ""}`}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* 日期拿不到时退回显示短 sha，保证左侧一列不会空掉 */}
                  <span className="update-date">{c.date ?? c.sha}</span>
                  <span className="update-title">{c.message}</span>
                  {i === 0 && <span className="update-tag">{t.newBadge}</span>}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ===== 第 3 屏：随便看看 ===== */}
      <section className="home-page home-section" data-home-page id="home-page-3">
        <h2 className="section-title">{t.picks}</h2>
        <p className="section-sub">{t.picksSub}</p>

        {/* 交错网格：右列整列下沉，两列各自纵向排列 */}
        <div className="stagger-grid">
          {[0, 1].map((col) => (
            <div className={`stagger-col${col === 1 ? " stagger-col-right" : ""}`} key={col}>
              {picks
                .filter((_, i) => i % 2 === col)
                .map((post) => (
                  <a
                    className={`home-card${post.isAI ? " ai" : ""}`}
                    key={post.slug}
                    href={`/${lang}/posts/${encodeURIComponent(post.slug)}/`}
                  >
                    {post.categories[0] && (
                      <span className="home-card-cat">{post.categories[0]}</span>
                    )}
                    <h3 className="home-card-title">{post.title}</h3>
                    {post.summary && <p className="home-card-desc">{post.summary}</p>}
                    <span className="home-card-meta">
                      <span>{post.date}</span>
                      <span>
                        {readingMinutes(post.wordCount)} {t.readingTime}
                      </span>
                    </span>
                  </a>
                ))}
            </div>
          ))}
        </div>

        <a className="all-posts-more" href={`/${lang}/posts/`}>
          {t.allPosts}
          <Icon icon={icons["mdi:arrow-right"]} width="1em" height="1em" />
        </a>
      </section>

      {/* 三屏都在时给出三个点；没有更新数据就只有两屏 */}
      <PageIndicator count={updates.length > 0 ? 3 : 2} label={t.pageNav} />

      {/* 吸附加力：三屏都放得下就升到 mandatory，否则做向前辅助吸附 */}
      <HomeSnap />
    </div>
  );
}
