"use client";

import { useEffect, useRef } from "react";

export default function PostBody({ html, slug }: { html: string; slug: string }) {
  const ref = useRef<HTMLDivElement>(null);

  /* 块级公式太宽时缩到刚好放下。

     手机与桌面差很多，这是关键：
       桌面可用宽 ≈ 768px，一条 1000px 的公式缩到 0.77 就够；
       手机可用宽 ≈ 340px，同一条公式要缩到 0.34。
     所以「低于下限就不缩」这条策略在手机上会直接放弃 ——
     桌面看着修好了，手机却毫无变化。

     现在改成：尽力缩到下限为止（target = max(need, FLOOR)），
     缩不到的部分交给横向滚动；并且给仍然超宽的盒子加 is-scrollable，
     由 CSS 在右缘画一道渐隐，提醒读者可以往左滑
     （移动端不显示滚动条，没有这个提示就跟被截断一样）。

     为什么不用 transform: scale：.katex-display 同时是 overflow-x:auto 的裁剪容器，
     CSS 的顺序是「先按容器宽度裁剪，再对结果整体缩放」——被裁掉的右半截
     不会因为缩放重新出现。目标选错了。

     为什么改 font-size：KaTeX 内部全用 em 计量，改字号会真实改变布局宽度，
     于是不再有溢出、不需要裁剪，容器高度也自然跟着收。

     为什么必须用容器自己的 scrollWidth 量：它直接给出内容溢出后的真实宽度，
     不受子元素自身 width / display 规则影响。
     曾经量子元素的 getBoundingClientRect().width —— 一旦它的 width: max-content
     没生效（样式加载顺序变了、被覆盖了），量到的就是容器宽、永远判为「放得下」，
     于是什么都不做。这是前几版默默失效的另一个原因。

     每个公式盒会写 data-formula-fit 标记，开发者工具里一看属性就知道走了哪条分支。 */
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    /* 缩放下限。低于这个比例公式已经难认，宁可让它横向滑动。
       取 0.5：手机上大多数超宽公式能缩到这个量级并基本放下；
       再往下调（如 0.34）虽能完全放下，但字号已经小到读不清。 */
    const FLOOR = 0.5;
    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const fitOne = (box: HTMLElement) => {
      // 先复位，再量原始尺寸；否则会拿上一次的结果反复缩小
      box.style.fontSize = "";
      box.classList.remove("is-scrollable");

      const cs = getComputedStyle(box);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      const avail = box.clientWidth - padL - padR;
      if (avail <= 1) return;

      // scrollWidth 含内边距，减掉才是内容自身宽度
      const content = box.scrollWidth - padL - padR;
      if (content <= avail + 1) {
        box.dataset.formulaFit = "ok";
        return;
      }

      const base = parseFloat(cs.fontSize) || 16;
      const need = avail / content;
      // 尽力缩，但不小于下限
      let ratio = Math.max(need, FLOOR);

      // 宽度与字号近似成正比，但取整会带来误差，迭代几次收敛
      for (let i = 0; i < 5; i++) {
        box.style.fontSize = `${(base * ratio).toFixed(2)}px`;
        const w = box.scrollWidth - padL - padR;
        if (w <= avail + 0.5) {
          box.dataset.formulaFit = `fit:${ratio.toFixed(2)}`;
          return;
        }
        if (ratio <= FLOOR + 0.001) break; // 已到下限，无法再小
        ratio = Math.max(ratio * (avail / w), FLOOR);
      }

      // 己经缩到下限仍然放不下：保持缩后的字号（仍然可读），剩下的横向滑动。
      // 若连下限都没用上（理论上不会走到），则回到原样。
      box.style.fontSize = `${(base * Math.max(need, FLOOR)).toFixed(2)}px`;
      box.classList.add("is-scrollable");
      box.dataset.formulaFit = `scroll:${Math.max(need, FLOOR).toFixed(2)}`;
    };

    const fit = () => {
      root.querySelectorAll<HTMLElement>(".katex-display").forEach(fitOne);
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fit);
    };

    schedule();
    // KaTeX 字体是 font-display: block，字体到位前后度量会变，必须重量
    document.fonts?.ready.then(schedule).catch(schedule);
    // 外链的 katex.min.css 也可能晚于本脚本到达，再补几次
    [300, 1200, 3000].forEach((ms) => timers.push(setTimeout(schedule, ms)));

    window.addEventListener("resize", schedule);

    /* 只盯「宽度」变化，不盯高度——防死循环：
       fitOne 会改字号 → 容器高度跟着变 → 若按高度触发又会调 fitOne → 无限循环。
       而改字号不会改变容器宽度（它总是填满父级的块），拿宽度做闸门才安全。 */
    let lastW = root.clientWidth;
    const ro = new ResizeObserver(() => {
      const w = root.clientWidth;
      if (w === lastW) return;
      lastW = w;
      schedule();
    });
    ro.observe(root);

    // 字号调节改的是 <html data-font-scale>，阅读宽度改的是 data-width，
    // 两者都不触发 resize，得单独盯
    const mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-font-scale", "data-width"],
    });

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      mo.disconnect();
    };
  }, [html]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 收集副作用清理函数，避免路由切换后监听器、定时器和图表观察器继续占用资源。
    const cleanups: (() => void)[] = [];
    const addCleanup = (cleanup: () => void) => cleanups.push(cleanup);

    /* 正文图片加载失败时换成明确的占位块。
       默认的裂图图标既难看也说不清原因（404？防盗链？路径写错？），
       换成带 alt 文字的占位块后，读者与作者都能一眼看出是「图没加载出来」。
       常见原因：文件根本没上传（路径指向不存在的目录）、外链图床挂了或禁外链。 */
    el.querySelectorAll("img").forEach((img) => {
      const markMissing = () => {
        if (img.dataset.missing) return;
        img.dataset.missing = "1";
        const ph = document.createElement("div");
        ph.className = "figure-missing";
        ph.textContent = img.getAttribute("alt") || "图片未能加载";
        ph.title = `图片加载失败：${img.getAttribute("src") || ""}`;
        img.replaceWith(ph);
      };
      // 已加载完但尺寸为 0：多数浏览器对 404/decode 失败就是这个状态，
      // 此时 error 事件已经错过，不会再触发
      if (img.complete) {
        if (img.naturalWidth === 0) markMissing();
        return;
      }
      img.addEventListener("error", markMissing, { once: true });
      addCleanup(() => img.removeEventListener("error", markMissing));
    });

    // 代码复制按钮
    el.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "Copy";
      let resetTimer: ReturnType<typeof setTimeout> | undefined;
      btn.onclick = () => {
        const code = pre.querySelector("code");
        navigator.clipboard.writeText(code?.textContent || "").then(() => {
          btn.textContent = "Copied!";
          resetTimer = setTimeout(() => (btn.textContent = "Copy"), 1500);
        });
      };
      pre.appendChild(btn);
      addCleanup(() => {
        if (resetTimer) clearTimeout(resetTimer);
        btn.onclick = null;
        btn.remove();
      });
    });

    // Mermaid
    const mermaids = el.querySelectorAll(".mermaid");
    if (mermaids.length && !(window as any).mermaidLoaded) {
      (window as any).mermaidLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js",
        () => {
          (window as any).mermaid?.initialize({ startOnLoad: true, theme: "default" });
          (window as any).mermaid?.run?.();
        },
        () => mermaids.forEach((m: any) => { m.textContent = "Mermaid 加载失败"; })
      );
    }

    // ECharts
    const echarts = el.querySelectorAll(".echarts");
    if (echarts.length && !(window as any).echartsLoaded) {
      (window as any).echartsLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js",
        () => {
          echarts.forEach((c: any) => {
            // 图表容器需有明确高度，否则 canvas 高度为 0
            c.style.minHeight = "360px";
            c.style.width = "100%";
            try {
              const option = JSON.parse(c.getAttribute("data-option") || "{}");
              const chart = (window as any).echarts.init(c);
              chart.setOption(option);
              // 响应式
              const ro = new ResizeObserver(() => chart.resize());
              ro.observe(c);
              addCleanup(() => {
                ro.disconnect();
                chart.dispose();
              });
            } catch (e) {
              c.textContent = "ECharts 数据解析失败";
            }
          });
        },
        () => echarts.forEach((c: any) => { c.textContent = "ECharts 加载失败"; })
      );
    }

    // SmilesDrawer (化学结构式) — v2.x: parse 为异步回调 API
    const chems = el.querySelectorAll(".chem");
    if (chems.length && !(window as any).chemLoaded) {
      (window as any).chemLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/smiles-drawer@2.4.1/dist/smiles-drawer.min.js",
        () => {
          chems.forEach((c: any) => {
            const smiles = c.getAttribute("data-smiles");
            if (!smiles) return;
            const caption = c.getAttribute("data-caption");
            // 默认画布缩小；支持短代码指定 width/height
            const w = parseInt(c.getAttribute("data-width") || "220", 10);
            const h = parseInt(c.getAttribute("data-height") || "150", 10);
            try {
              (window as any).SmilesDrawer.parse(
                smiles,
                (tree: any) => {
                  const wrapper = document.createElement("div");
                  wrapper.style.cssText = "text-align:center;margin:1em 0;";
                  // 将尺寸传入 Drawer 构造函数，避免 draw 方法覆盖为默认 500x500
                  const drawer = new (window as any).SmilesDrawer.Drawer({ width: w, height: h });
                  const canvas = document.createElement("canvas");
                  // smiles-drawer 的 draw 方法接收 canvas 的 id 字符串（传 DOM 元素会失败）
                  const canvasId = `chem-canvas-${Math.random().toString(36).slice(2, 9)}`;
                  canvas.id = canvasId;
                  canvas.style.maxWidth = "100%";
                  canvas.style.height = "auto";
                  wrapper.appendChild(canvas);
                  if (caption) {
                    const cap = document.createElement("div");
                    cap.style.cssText = "font-size:0.85em;color:var(--text-secondary);margin-top:6px;";
                    cap.textContent = caption;
                    wrapper.appendChild(cap);
                  }
                  c.appendChild(wrapper);
                  drawer.draw(tree, canvasId, "light");
                },
                () => {
                  c.textContent = smiles;
                }
              );
            } catch (e) {
              c.textContent = smiles;
            }
          });
        },
        () => chems.forEach((c: any) => { c.textContent = c.getAttribute("data-smiles") || ""; })
      );
    }

    // Graphviz (viz.js) — 修正 await 优先级：先 await instance() 再调用方法
    const vizs = el.querySelectorAll(".graphviz");
    if (vizs.length && !(window as any).vizLoaded) {
      (window as any).vizLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/@viz-js/viz@3/lib/viz-standalone.js",
        async () => {
          for (const c of vizs) {
            const src = (c as any).getAttribute("data-src") || "";
            try {
              const viz = await (window as any).Viz.instance();
              const svg = viz.renderSVGElement(src);
              (c as any).appendChild(svg);
            } catch (e) {
              (c as any).textContent = "Graphviz 渲染失败";
            }
          }
        },
        () => vizs.forEach((c: any) => { c.textContent = "Graphviz 加载失败"; })
      );
    }

    // abc.js (乐谱)
    const abcs = el.querySelectorAll(".abc");
    if (abcs.length && !(window as any).abcLoaded) {
      (window as any).abcLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/abcjs@6.7.0/dist/abcjs-basic-min.js",
        () => {
          abcs.forEach((c: any) => {
            const src = c.getAttribute("data-src") || "";
            try {
              (window as any).ABCJS.renderAbc(c, src, {
                responsive: "resize",
                staffwidth: 600,
              });
            } catch (e) {
              c.textContent = "乐谱渲染失败";
            }
          });
        },
        () => abcs.forEach((c: any) => { c.textContent = "abc.js 加载失败"; })
      );
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [html]);

  return <div className="article" ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

function loadScript(src: string, onLoad: () => void, onError?: () => void) {
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  s.onload = onLoad;
  if (onError) s.onerror = onError;
  document.head.appendChild(s);
}
