"use client";

import { useEffect, useState } from "react";

/**
 * 首页右侧的分页指示点。
 *
 * 首页是三屏吸附式布局，所以这里要做两件事：
 * 计算当前在哪一屏（高亮对应点）、点击跳页。
 *
 * 判断“当前屏”的做法：拿每一屏到吸附位置的垂直距离，取最近的那个。
 * 之所以不用 IntersectionObserver：本页可能超出视口高度（比如更新列表较长），
 * 阈值比例会变得不可靠；而“离吸附点最近”在任何高度下都成立。
 */
export default function PageIndicator({ count, label }: { count: number; label: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const pages = Array.from(
      document.querySelectorAll<HTMLElement>("[data-home-page]")
    );
    if (!pages.length) return;

    // 吸附位置在顶栏下方，用顶栏的实际高度而不是猜一个常量
    const headerOffset = () =>
      document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;

    let raf = 0;
    const update = () => {
      const offset = headerOffset();
      let best = 0;
      let bestDist = Infinity;
      pages.forEach((page, i) => {
        const dist = Math.abs(page.getBoundingClientRect().top - offset);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count]);

  function goTo(index: number) {
    const page = document.querySelectorAll<HTMLElement>("[data-home-page]")[index];
    if (!page) return;
    const header = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;
    window.scrollTo({
      top: window.scrollY + page.getBoundingClientRect().top - header,
      behavior: "smooth",
    });
  }

  return (
    <div className="page-indicator" role="tablist" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`page-dot${i === active ? " active" : ""}`}
          onClick={() => goTo(i)}
          aria-label={`${i + 1} / ${count}`}
          aria-selected={i === active}
          role="tab"
        />
      ))}
    </div>
  );
}
