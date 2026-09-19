"use client";

import { useEffect, useState } from "react";

/**
 * 阅读文章时的顶栏行为：滚动进入正文后自动隐藏，双击（鼠标或触屏）缓缓滑出。
 *
 * 只在文章页渲染（挂在 PostNav 旁），因此不会影响首页、列表页等需要常驻导航的地方。
 *
 * 两个设计决定：
 *
 * 1. **滚离顶部才隐藏。** 顶栏是 sticky 的，它的占位仍在文档最顶上；
 *    若在 scrollY = 0 就把它上移，页面顶部会露出一条与顶栏等高的空白带。
 *    滚过 TOP_ZONE 之后，那块占位已经在视口之上，上移只会揭出被它盖住的内容。
 *
 * 2. **双击切的是「临时呼出」，不是「永久显示」。** 双击后顶栏保持展开，
 *    回滚到页面顶部时自动复位，回到「跟随滚动」的常态。
 *    这样不会因为一次误触就把「阅读时隐藏」永久关掉。
 *
 * 实现方式是往 <html> 上写 data-header 属性，样式在 globals.css；
 * 组件卸载时移除该属性，离开文章页顶栏立刻恢复正常。
 */
const TOP_ZONE = 120;      // 距顶多少像素内不隐藏
const DOUBLE_TAP_MS = 320; // 两次轻触/点击的间隔上限
const SWALLOW_MS = 400;    // 同一次手势会同时触发 touch 与 mouse 两路事件，去重窗口

export default function ReadingHeader() {
  const [pastTop, setPastTop] = useState(false);
  const [revealed, setRevealed] = useState(false);

  /* 滚动：是否已离开顶部 */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const y = window.scrollY;
      setPastTop(y > TOP_ZONE);
      // 回到顶部即复位手动呼出状态，避免它一直粘着
      if (y <= TOP_ZONE) setRevealed(false);
    };
    const onScroll = () => {
      if (raf) return; // 已有 pending 帧，合并
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* 双击（鼠标 dblclick / 触屏 touchend）：呼出与收回 */
  useEffect(() => {
    let lastTap = 0;
    let lastHandled = 0;

    const onTap = () => {
      const now = Date.now();
      // touchend 之后浏览器常会补一个 dblclick，去重避免来回切两次
      if (now - lastHandled < SWALLOW_MS) return;
      const gap = now - lastTap;
      lastTap = now;
      if (gap > DOUBLE_TAP_MS) return; // 第一次，等第二下
      lastHandled = now;
      lastTap = 0;
      setRevealed((v) => !v);
    };

    document.addEventListener("touchend", onTap, { passive: true });
    document.addEventListener("dblclick", onTap);
    return () => {
      document.removeEventListener("touchend", onTap);
      document.removeEventListener("dblclick", onTap);
    };
  }, []);

  /* 把状态写到 <html> 上 */
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-header",
      pastTop && !revealed ? "hidden" : "shown"
    );
  }, [pastTop, revealed]);

  /* 离开文章页时清理，恢复各页共用的顶栏行为 */
  useEffect(() => {
    return () => document.documentElement.removeAttribute("data-header");
  }, []);

  return null;
}
