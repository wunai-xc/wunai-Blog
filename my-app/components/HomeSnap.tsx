"use client";

import { useEffect } from "react";

/**
 * 首页吸附的「加力」逻辑。CSS 里是 `scroll-snap-type: y proximity`。
 *
 * ⚠️ **这里刻意不用 `mandatory`，哪怕只是有条件地开。**
 *
 * mandatory 要求滚动容器**只能停在吸附点上**。而首页三屏之后还跟着页脚，
 * 页脚没有吸附点 —— 于是滚到第 3 屏起点后，再往下就被判定为「不在吸附点上」
 * 而被弹回，**页脚永远够不到**。
 *
 * 这与屏高无关：只要最后一屏后面还有内容，mandatory 就会把它封在外面。
 * （曾经按「三屏是否都装得下视口」判定后升级到 mandatory，就是错的：
 * 判定漏了「最后一屏之后还有页脚」这个条件。若卡片不足 6 张，第 3 屏会变矮、
 * 通过判定，页脚随即被封死。）
 *
 * 所以加力靠两个**辅助吸附**实现，它们都只是「停稳后帮一把」，
 * 不改变「滚动可以停在任意位置」这个前提，因此不会封住页脚：
 *
 *   1. 向前拉：停稳时若前方某屏的起点在半屏以内，就平滑滚过去。
 *   2. 向后并：停稳时若已经略微越过某屏起点（在 14% 屏高以内），就并回去。
 *
 * 并且**靠近文档底部时完全不动手**，从机制上保证页脚可达。
 */
const SETTLE_MS = 130;   // 滚动停稳多久后判定为「停住」
const PULL = 0.5;        // 向前拉：最多几个视口高
const SNAP_BACK = 0.14;  // 向后并：越过吸附点多少以内才并回去
const BOTTOM_GUARD = 1;  // 距文档底部不足这么多个视口高时，一律不介入

export default function HomeSnap() {
  useEffect(() => {
    const pages = () =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-home-page]"));
    const headerH = () =>
      document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // 尊重偏好：不介入滚动

    let settle = 0;
    let locked = false;

    const assist = () => {
      if (locked) return;

      const availH = window.innerHeight - headerH();
      if (availH <= 0) return;

      const y = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      // 守卫：进入文档末段就不再介入，页脚区域永远交给用户自己滚
      if (maxScroll - y < availH * BOTTOM_GUARD) return;

      let target: number | null = null;
      let bestDist = Infinity;

      for (const p of pages()) {
        const r = p.getBoundingClientRect();
        // 那一屏自己都放不下：吸过去只会让人看不到它的下半截
        if (r.height > availH + 1) continue;
        const top = y + r.top - headerH();
        const d = top - y; // > 0 在前方，< 0 已越过

        if (d > 1) {
          // 前方且在半屏以内 → 拉过去
          if (d <= availH * PULL && d < bestDist) {
            bestDist = d;
            target = top;
          }
        } else if (d > -availH * SNAP_BACK) {
          // 刚越过一点点 → 并回去（这一步让吸附手感变「准」）
          const back = -d;
          // 跳过已经对齐（back≈0）的情况，否则会发起一次原地不动的滚动
          if (back > 1 && back < bestDist) {
            bestDist = back;
            target = top;
          }
        }
      }
      if (target === null) return;

      locked = true;
      window.scrollTo({ top: target, behavior: "smooth" });
      // 平滑滚动约 300ms；锁一小段，免得用户中途接手时程序化滚动还在抢
      window.setTimeout(() => {
        locked = false;
      }, 420);
    };

    const onScroll = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(assist, SETTLE_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
