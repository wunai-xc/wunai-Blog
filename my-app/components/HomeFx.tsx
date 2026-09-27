"use client";

import { useEffect } from "react";

/**
 * 首页动效的唯一入口（客户端）。
 *
 * 只做两件在服务端做不了的事，其余动效（逐字上升、跑马灯、扫描线、脉冲点）
 * 全是纯 CSS，写在 app/aesthetics-home.css 里：
 *
 *   1. 滚动揭示：给每个 [data-ah-reveal] 元素在进入视口时加 is-in。
 *      服务端渲染出来的就是隐藏态，所以禁用 JS 时必须有兜底 —— 见下面
 *      的 off 分支：判定为「不该动」时直接一次性点亮全部元素。
 *   2. 数字滚动：给 [data-ah-count] 从 0 数到元素文本里的目标值。
 *      服务端渲染的就是最终数字，禁用 JS / 关闭动效时用户看到的是正确数字，
 *      不会停在 0。
 *
 * 「该不该动」只看既有的两个开关（与全站其它动效同一口径）：
 * html[data-motion="off"]（设置页「动画强度：关闭」）与系统 prefers-reduced-motion。
 * 注意：CSS 里还有一份同样判断的降级规则，两边都要留着 ——
 * 这份管元素何时显示，那份管动画/过渡是否播放。
 */
export default function HomeFx() {
  useEffect(() => {
    const root = document.documentElement;
    const off =
      root.getAttribute("data-motion") === "off" ||
      (typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-ah-reveal]")
    );

    /* 数字滚动：目标值是服务端写好的文本，所以这里只负责「从 0 演到它」 */
    function countUp(el: HTMLElement, instant: boolean) {
      const target = el.querySelector<HTMLElement>("[data-ah-count]");
      if (!target) return;
      const to = parseInt(target.textContent || "0", 10);
      if (!Number.isFinite(to) || instant) return;
      const from = 0;
      const dur = 900;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        // easeOutQuad：先快后慢，数字最后几位停得稳
        const eased = 1 - (1 - p) * (1 - p);
        target.textContent = String(Math.round(from + (to - from) * eased));
        if (p < 1) requestAnimationFrame(tick);
        else target.textContent = String(to);
      };
      target.textContent = String(from);
      requestAnimationFrame(tick);
    }

    // 关闭动效、或内核没有 IntersectionObserver：不演，一次性点亮
    if (off || typeof IntersectionObserver === "undefined") {
      nodes.forEach((el) => {
        el.classList.add("is-in");
        countUp(el, true);
      });
      return () => {};
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.classList.add("is-in");
          countUp(el, false);
          io.unobserve(el);
        });
      },
      // 露出约一成再触发，避免刚露头就闪出来
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
