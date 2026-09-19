"use client";

import { useEffect } from "react";

/**
 * 顶栏入场动画与光标控制。
 *
 * 从 Header 里抽出来是因为 Header 是服务端组件，而这段逻辑要跑在浏览器里。
 *
 * 渐进增强：默认可见（JS 完全失败时顶栏照常显示），
 * JS 就绪后才加 .fade-ready 隐藏，再逐个加 .is-visible 播放过渡。
 * 这一顺序很关键——反过来写会让顶栏在 JS 失败时永久不可见。
 */
export default function HeaderIntro() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-fade]");
    if (!items.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    // 1. 先隐藏（此时样式已就绪，transition 可用）
    items.forEach((el) => el.classList.add("fade-ready"));

    // 2. 下一帧再逐个显示，触发级联过渡
    const timers: number[] = [];
    const raf = requestAnimationFrame(() => {
      items.forEach((el, index) => {
        timers.push(
          window.setTimeout(() => el.classList.add("is-visible"), index * 90)
        );
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  /* 光标：页面切到后台时暂停闪烁（省电，且切回来不会乱闪） */
  useEffect(() => {
    const cursor = document.querySelector<HTMLElement>(".cursor");
    if (!cursor) return;
    const sync = () => cursor.classList.toggle("is-paused", document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return null;
}
