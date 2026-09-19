"use client";

import { useEffect } from "react";

/**
 * 首页吸附的「加力」逻辑。CSS 里默认是 `scroll-snap-type: y proximity`（温和）。
 * 本组件做两件事：
 *
 * 1. **三屏都装得下视口时，切成 `mandatory`** —— 那是最强的吸附。
 *    之所以要先判断：mandatory 下滚动只能停在吸附点上，一旦某屏高于视口，
 *    那一屏的中段就再也滚不到，读者被卡在屏起点。所以只在「没有任何一屏溢出」时才敢开。
 *    实测桌面能过（三屏都放得下），手机上的「随便看看」是单列、明显超一屏，会走第 2 条。
 *
 * 2. **放不下时保持 proximity，并做一次「向前拉一把」的辅助吸附**：
 *    滚动停稳后，若前方某屏的起点在半屏以内、且那一屏放得下，就平滑滚过去。
 *
 *    刻意**只向前、不向后**。向后拉有两个害处：
 *    · 把正在读长内容的读者拽回屏起点；
 *    · 在页面底部的页脚处把读者往上拽，导致页脚够不到 —— 这正是当初没有直接用
 *      mandatory 的原因，辅助吸附不能把它重新引入。
 *
 * 尊重 `prefers-reduced-motion`：只做强度判定，不介入滚动。
 */
const SETTLE_MS = 140; // 滚动停稳多久后判定为「停住了」
const PULL = 0.45;     // 最多向前拉这么多个视口高（半屏以内）

export default function HomeSnap() {
  useEffect(() => {
    const root = document.documentElement;
    const pages = () => Array.from(document.querySelectorAll<HTMLElement>("[data-home-page]"));
    const headerH = () =>
      document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* 三屏是否都装得下；只有装得下才敢用 mandatory */
    const measure = () => {
      const list = pages();
      if (!list.length) return;
      const availH = window.innerHeight - headerH();
      const allFit = list.every((p) => p.getBoundingClientRect().height <= availH + 1);
      root.dataset.snap = allFit ? "strong" : "soft";
    };

    measure();
    // 字体就位前后屏高会变（KaTeX 字体、图片加载），补测两次
    const t1 = window.setTimeout(measure, 400);
    const t2 = window.setTimeout(measure, 1500);

    if (reduced) {
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        root.removeAttribute("data-snap");
      };
    }

    let settle = 0;
    let pulling = false;

    const assist = () => {
      if (pulling) return;
      // 已是 mandatory，浏览器自己会吸附，再插手只会互相打架
      if (root.dataset.snap === "strong") return;

      const list = pages();
      const availH = window.innerHeight - headerH();
      const y = window.scrollY;

      let target: number | null = null;
      let bestDist = Infinity;
      for (const p of list) {
        const r = p.getBoundingClientRect();
        // 目标屏自己都放不下：吸过去只会让人看不到它的下半截
        if (r.height > availH + 1) continue;
        const top = y + r.top - headerH();
        const d = top - y;
        // 只考虑正前方的屏（d > 1），且在半屏以内
        if (d > 1 && d <= availH * PULL && d < bestDist) {
          bestDist = d;
          target = top;
        }
      }
      if (target === null) return;

      pulling = true;
      window.scrollTo({ top: target, behavior: "smooth" });
      // 平滑滚动约 300ms；锁一小段时间，免得用户中途接手时程序化滚动还在抢
      window.setTimeout(() => {
        pulling = false;
      }, 420);
    };

    const onScroll = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(assist, SETTLE_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      root.removeAttribute("data-snap");
    };
  }, []);

  return null;
}
