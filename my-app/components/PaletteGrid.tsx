"use client";

import { useEffect, useState } from "react";
import { SITE, type Lang } from "@/lib/site";
import {
  DEFAULTS,
  KEYS,
  SKIN_PALETTES,
  type SkinPaletteId,
} from "@/lib/settings";

/**
 * 首页「八套配色」网格。
 *
 * 点一下 = 把主题设为玻璃（skin=aesthetics）并把 skinpalette 换成这一套，
 * 与设置页 components/SiteSettings.tsx 的 update() 写入的是同一组 localStorage
 * 键名、同一对 <html> 属性 —— 两处必须一致，否则会出现「设置页显示 A、
 * 实际生效是 B」。
 *
 * 全部八套的色值是声明式的（app/aesthetics.css），这里只负责点选与记忆，
 * 因此切换是即时的：写属性即可，不需要刷新，也不会先闪一下旧配色。
 *
 * 首帧不渲染选中态（current 为 null），等读完 localStorage 再渲染，
 * 避免服务端 HTML 与客户端状态不一致。
 */
export default function PaletteGrid({ lang }: { lang: Lang }) {
  const t = SITE.i18n[lang];
  const [current, setCurrent] = useState<SkinPaletteId | null>(null);

  useEffect(() => {
    let id: string | null = null;
    try {
      id = localStorage.getItem(KEYS.skinPalette);
    } catch {
      // 隐私模式下读不到，回落到默认值
      id = null;
    }
    const known = SKIN_PALETTES.some((p) => p.id === id);
    setCurrent(known ? (id as SkinPaletteId) : DEFAULTS.skinPalette);
  }, []);

  function pick(id: SkinPaletteId) {
    setCurrent(id);
    try {
      localStorage.setItem(KEYS.skin, "aesthetics");
      localStorage.setItem(KEYS.skinPalette, id);
    } catch {
      // 写盘失败也照样切：这一下点击的意图是「现在就看到这套颜色」
    }
    const el = document.documentElement;
    el.setAttribute("data-theme", "aesthetics");
    el.setAttribute("data-skin-palette", id);
  }

  const active = current ?? DEFAULTS.skinPalette;
  const activeOption = SKIN_PALETTES.find((p) => p.id === active);

  return (
    <div data-ah-reveal="up">
      <div className="ah-palette-grid">
        {SKIN_PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`ah-palette-card${p.id === active ? " is-current" : ""}`}
            aria-pressed={p.id === active}
            onClick={() => pick(p.id)}
            title={`${p.name} · ${t.paletteMoods[p.id]}`}
          >
            <span className="ah-swatches" aria-hidden="true">
              {p.swatches.map((c, i) => (
                <i key={i} style={{ background: c }} />
              ))}
            </span>
            <span className="ah-palette-name">{p.name}</span>
            <span className="ah-palette-mood">
              {t.paletteMoods[p.id]} · {p.scheme === "light" ? t.paletteLight : t.paletteDark}
            </span>
          </button>
        ))}
      </div>
      <p className="ah-note" style={{ marginTop: "var(--ah-space-s)" }}>
        {t.homePaletteCurrent}
        <span className="ah-accent">{activeOption ? activeOption.name : active}</span>
        {"　·　"}
        {t.homePaletteSaved}
      </p>
    </div>
  );
}
