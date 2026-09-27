"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";
import { DEFAULTS, KEYS, SKIN_PALETTES, type SkinPaletteId } from "@/lib/settings";

const ICONS = {
  light: icons["mdi:weather-sunny"],
  dark: icons["mdi:weather-night"],
  auto: icons["mdi:theme-light-dark"],
} as const;

type Mode = "light" | "dark" | "auto";

/**
 * 顶栏右侧那颗按钮。一个位置、两种职责：
 *
 * · 玻璃主题（现在的默认）：八套配色自带明暗（void/bloom/ember/abyss 深色，
 *   solar/riso/porcelain/mint 浅色），html.dark 对它不起作用 —— 所以这里
 *   改成「点一下换下一套配色」，图标按该套配色的明暗显示太阳/月亮，
 *   以此告诉用户刚换到深色还是浅色。
 * · 纸质主题（回退）：还是原来的日 / 夜 / 跟随系统三态。
 *
 * 写盘与设置页 components/SiteSettings.tsx 用同一组键名与同一对 <html> 属性，
 * 切完立即生效，不需要刷新。
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Mode>("auto");
  /* 首帧按默认主题（玻璃）渲染，与 app/layout.tsx 内联脚本的默认判断一致 */
  const [glass, setGlass] = useState(true);
  const [palette, setPalette] = useState<SkinPaletteId>(DEFAULTS.skinPalette);

  useEffect(() => {
    try {
      setTheme((localStorage.getItem("theme") as Mode) || "auto");
      setGlass((localStorage.getItem(KEYS.skin) || DEFAULTS.skin) === "aesthetics");
      const stored = localStorage.getItem(KEYS.skinPalette);
      if (SKIN_PALETTES.some((p) => p.id === stored)) {
        setPalette(stored as SkinPaletteId);
      }
    } catch {
      /* 隐私模式下读不到，保持默认值 */
    }
  }, []);

  function cyclePalette() {
    const idx = SKIN_PALETTES.findIndex((p) => p.id === palette);
    const next = SKIN_PALETTES[(idx + 1) % SKIN_PALETTES.length];
    setPalette(next.id);
    try {
      localStorage.setItem(KEYS.skin, "aesthetics");
      localStorage.setItem(KEYS.skinPalette, next.id);
    } catch {
      /* 写盘失败也照样切 */
    }
    const el = document.documentElement;
    el.setAttribute("data-theme", "aesthetics");
    el.setAttribute("data-skin-palette", next.id);
  }

  function apply(t: Mode) {
    localStorage.setItem("theme", t);
    setTheme(t);
    const dark = t === "dark" || (t === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }

  if (glass) {
    const current = SKIN_PALETTES.find((p) => p.id === palette);
    const scheme = current ? current.scheme : "dark";
    return (
      <button
        className="icon-btn"
        onClick={cyclePalette}
        title={`Palette: ${current ? current.name : palette}`}
        aria-label="Next glass palette"
      >
        <Icon
          icon={scheme === "light" ? ICONS.light : ICONS.dark}
          data-icon={scheme === "light" ? "mdi:weather-sunny" : "mdi:weather-night"}
          width="1.2em"
          height="1.2em"
        />
      </button>
    );
  }

  const next = theme === "light" ? "dark" : theme === "dark" ? "auto" : "light";

  return (
    <button
      className="icon-btn"
      onClick={() => apply(next)}
      title={`Theme: ${theme}`}
      aria-label="Toggle theme"
    >
      <Icon icon={ICONS[theme]} data-icon={theme === "light" ? "mdi:weather-sunny" : theme === "dark" ? "mdi:weather-night" : "mdi:theme-light-dark"} width="1.2em" height="1.2em" />
    </button>
  );
}
