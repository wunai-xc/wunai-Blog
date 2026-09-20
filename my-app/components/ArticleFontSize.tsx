"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";

/* ===== 正文字号（文章页左边缘的第二个浮动按钮） =====

   与目录按钮同处一列、同一套交互（点击展开面板，点外部或 Esc 关闭），
   位置排在目录按钮下面一格；文章没有目录时自动补位到第一格（见 globals.css）。
   注意两个元素不能包进同一个外层容器：位置靠 `.toc-fab ~ .font-fab` 判断，
   包一层就不再是兄弟节点了。

   四条不能破坏的约定：

   1. **只管正文**。值写在 <html> 的 --article-fs-pref 上，但消费它的规则只在带
      data-article-font 的 .post-content 内部生效（见 globals.css）——所以顶栏、页脚、
      列表页，以及同样用 .article 的「关于」固定页都不受影响。
   2. **下限 5px，上限 32px**；不设值 = 自动，跟随站点字号（设置页的字号档位）。
   3. 正文内所有字号都写成 --article-fs 的倍数，标题 / 代码 / 脚注才会跟着一起缩放，
      不会出现「正文缩到 5px 而标题还是 25px」的断层。改排版时别把这条丢了。
   4. 值存 localStorage('articlefont')，并由 app/layout.tsx 的内联脚本预置成
      --article-fs-pref：首屏直接按用户字号绘制，不会先画一遍默认值再跳。 */

const MIN = 5;
const MAX = 32;
/** 「自动」态下按加减按钮的起点：1rem，与 CSS 里的默认字号一致 */
const BASE = 16;
const STORE_KEY = "articlefont";

const clamp = (n: number) => Math.min(MAX, Math.max(MIN, Math.round(n)));

/* 字号一变，页面里那些「按当时的字号量过尺寸」的东西都得重算：
   长公式的横向缩放（PostBody）与目录节点位置、阅读进度（PostNav）。
   两者都在等 resize，这里手动发一个 —— 比把控件和它们逐个耦合干净。
   拖动滑杆时会在同一帧里连续触发，所以合并成一帧一次：
   PostNav 的 computeDots 会逐个标题量位置，不管制的话拖一下就是几十次重排。 */
let relayoutRaf = 0;
function relayout() {
  if (relayoutRaf) return;
  relayoutRaf = requestAnimationFrame(() => {
    relayoutRaf = 0;
    window.dispatchEvent(new Event("resize"));
  });
}

export default function ArticleFontSize() {
  /** null = 自动（跟随站点字号，不由本控件覆盖） */
  const [size, setSize] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  /* 按钮与面板是兄弟节点（不能包一层：外层会挡住 .toc-fab ~ .font-fab 这个
     相邻选择器，位置就没法按「目录按钮在不在」来定了），所以存两个 ref */
  const fabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* 必须声明在下面那个 effect 之前：effect 的依赖数组在渲染时就求值，
     放到后面会撞上 TDZ（Cannot access 'apply' before initialization）。 */
  const apply = useCallback((next: number | null) => {
    const root = document.documentElement;
    if (next === null) {
      root.style.removeProperty("--article-fs-pref");
      localStorage.removeItem(STORE_KEY);
      setSize(null);
    } else {
      const v = clamp(next);
      root.style.setProperty("--article-fs-pref", `${v}px`);
      localStorage.setItem(STORE_KEY, String(v));
      setSize(v);
    }
    relayout();
  }, []);

  // 首屏的变量由内联脚本设好了，这里只把面板显示同步回来。
  // 存进去的值超出当前范围（改过范围、或手改过 localStorage）时，
  // 连 DOM 一起纠正 —— 否则会出现「面板显示 32px，实际没生效」。
  useEffect(() => {
    const n = parseFloat(localStorage.getItem(STORE_KEY) || "");
    if (!Number.isFinite(n)) return;
    const v = clamp(n);
    if (v === n) setSize(v);
    else apply(v);
  }, [apply]);

  // 点击面板外部关闭
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (fabRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Esc 关闭面板
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const current = size ?? BASE;
  const isAuto = size === null;

  return (
    <>
      <button
        ref={fabRef}
        className={`font-fab${open ? " open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="调整正文字号"
        aria-expanded={open}
        title="正文字号"
      >
        <Icon icon={icons["mdi:format-size"]} width="1.25em" height="1.25em" />
      </button>

      {/* 收起时 inert：面板只是透明不可点，但里面的按钮仍会进 Tab 顺序，
          键盘用户会掉进一个看不见的面板里 */}
      <div ref={panelRef} className={`font-panel${open ? " open" : ""}`} inert={!open}>
        <div className="font-panel-head">
          <Icon icon={icons["mdi:format-size"]} width="1em" height="1em" />
          <span>正文字号</span>
        </div>

        <div className="font-panel-body">
          <div className="font-row">
            <button
              className="font-step"
              onClick={() => apply(current - 1)}
              disabled={current <= MIN}
              aria-label="缩小字号"
              title="缩小 1px"
            >
              <Icon icon={icons["mdi:format-font-size-decrease"]} width="1.2em" height="1.2em" />
            </button>

            <span className={`font-value${isAuto ? " auto" : ""}`}>
              {isAuto ? "自动" : `${current}px`}
            </span>

            <button
              className="font-step"
              onClick={() => apply(current + 1)}
              disabled={current >= MAX}
              aria-label="放大字号"
              title="放大 1px"
            >
              <Icon icon={icons["mdi:format-font-size-increase"]} width="1.2em" height="1.2em" />
            </button>

            <button
              className="font-step font-auto"
              onClick={() => apply(null)}
              disabled={isAuto}
              aria-label="恢复自动字号"
              title="恢复自动（跟随站点字号）"
            >
              <Icon icon={icons["mdi:restore"]} width="1.15em" height="1.15em" />
            </button>
          </div>

          <input
            className="font-slider"
            type="range"
            min={MIN}
            max={MAX}
            step={1}
            value={current}
            onChange={(e) => apply(Number(e.target.value))}
            aria-label="正文字号（像素）"
          />

          <div className="font-range">
            <span>{MIN}px</span>
            <span>{MAX}px</span>
          </div>

          <p className="font-note">只影响文章正文；顶栏、页脚与其他页面不变。</p>
        </div>
      </div>
    </>
  );
}
