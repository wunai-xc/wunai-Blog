/**
 * 站点设置：选项定义与取值换算
 *
 * 读取/写入完全靠 localStorage + <html> 上的 data-* 属性，
 * 与既有的 theme / fontscale 保持一致；首屏由 app/layout.tsx 的内联脚本预读，
 * 因此不会出现"先闪一下默认值再变成用户设置"。
 */

export type PaletteId = "blue" | "teal" | "violet" | "green" | "orange" | "rose" | "custom";
export type ReadWidth = "narrow" | "normal" | "wide";
export type BgMode = "full" | "dim" | "off";
export type Motion = "full" | "lite" | "off";

/** 视觉主题：aesthetics=玻璃（默认，定义在 app/aesthetics.css）、paper=纸质（回退，定义在 app/globals.css） */
export type Skin = "paper" | "aesthetics";
/** 玻璃主题的八套配色，前四套深色、后四套浅色；取值定义在 app/aesthetics.css */
export type SkinPaletteId =
  | "void"
  | "bloom"
  | "ember"
  | "abyss"
  | "solar"
  | "riso"
  | "porcelain"
  | "mint";

export interface PaletteOption {
  id: Exclude<PaletteId, "custom">;
  /** 预览色块用的颜色，与 globals.css 里 html[data-palette=…] 的取值保持一致 */
  swatch: string;
}

/** 预设配色。真正的颜色定义在 globals.css（声明式、切主题不闪），这里只用于取数 */
export const PALETTES: PaletteOption[] = [
  { id: "blue", swatch: "#a94e30" },
  { id: "teal", swatch: "#0d9488" },
  { id: "violet", swatch: "#7c3aed" },
  { id: "green", swatch: "#16a34a" },
  { id: "orange", swatch: "#ea580c" },
  { id: "rose", swatch: "#e11d48" },
];

export const READ_WIDTHS: ReadWidth[] = ["narrow", "normal", "wide"];
export const BG_MODES: BgMode[] = ["full", "dim", "off"];
export const MOTIONS: Motion[] = ["full", "lite", "off"];
export const SKINS: Skin[] = ["paper", "aesthetics"];

export interface SkinPaletteOption {
  id: SkinPaletteId;
  /** 预览色块用的颜色，与 app/aesthetics.css 里该配色 --aes-1 的取值保持一致 */
  swatch: string;
  /** 拉丁名，首页配色网格与设置页 title 用（专有名词，不做翻译） */
  name: string;
  /** 该套配色自带明暗（color-scheme 由配色决定，与 html.dark 无关） */
  scheme: "dark" | "light";
  /** 主色 / 副色 / 刺激色，顺序与 --aes-1/2/3 一致；首页配色网格的三条色块用它 */
  swatches: [string, string, string];
}

/** 玻璃主题的八套配色。真正的颜色定义在 app/aesthetics.css（声明式、切主题不闪），
 *  这里只用于取数：预览色块、首页配色网格、顶栏日夜按钮的轮换顺序。
 *  色值必须与 aesthetics.css 里那八组 --aes-1/2/3 逐字对齐，改色时两边一起改。 */
export const SKIN_PALETTES: SkinPaletteOption[] = [
  { id: "void", swatch: "#c8ff2f", name: "Void", scheme: "dark", swatches: ["#c8ff2f", "#6b5cff", "#ff4d6d"] },
  { id: "bloom", swatch: "#ff2fb9", name: "Bloom", scheme: "dark", swatches: ["#ff2fb9", "#00e5ff", "#ffd166"] },
  { id: "ember", swatch: "#ff6a13", name: "Ember", scheme: "dark", swatches: ["#ff6a13", "#ffe14d", "#ff2e63"] },
  { id: "abyss", swatch: "#14f1c8", name: "Abyss", scheme: "dark", swatches: ["#14f1c8", "#ffc857", "#4f8cff"] },
  { id: "solar", swatch: "#ff4b1f", name: "Solar", scheme: "light", swatches: ["#ff4b1f", "#1b3bd8", "#ffb703"] },
  { id: "riso", swatch: "#ff5c8a", name: "Riso", scheme: "light", swatches: ["#ff5c8a", "#2f6bff", "#ffd400"] },
  { id: "porcelain", swatch: "#4a3aff", name: "Porcelain", scheme: "light", swatches: ["#4a3aff", "#ff7a9c", "#12b981"] },
  { id: "mint", swatch: "#0f9d63", name: "Mint", scheme: "light", swatches: ["#0f9d63", "#ff6b5e", "#1a5cff"] },
];

export const DEFAULTS = {
  palette: "blue" as PaletteId,
  readWidth: "normal" as ReadWidth,
  bgMode: "full" as BgMode,
  acrylic: true,
  motion: "full" as Motion,
  /* 默认主题是玻璃（第二套视觉）。改这里必须同步 app/layout.tsx 内联脚本里的同一处
     判断（那边写的是 `localStorage.getItem('skin') || 'aesthetics'`），
     否则首屏会先画一遍纸质再跳到玻璃。 */
  skin: "aesthetics" as Skin,
  skinPalette: "void" as SkinPaletteId,
};

/** localStorage 键名。内联脚本里用的是同样的字符串，改这里要同步改 layout.tsx */
export const KEYS = {
  palette: "palette",
  readWidth: "readwidth",
  bgMode: "bgmode",
  acrylic: "acrylic",
  motion: "motion",
  skin: "skin",
  skinPalette: "skinpalette",
  accentLight: "accentL",
  accentDark: "accentD",
} as const;

/* ===== 自定义主色的明度换算 =====
   用户用取色器挑的颜色只保证"他喜欢"，不保证在浅底/深底上都看得清。
   所以两头都做一次明度收敛，并把收敛后的结果回显到预览色块上 ——
   所见即所得，不会出现"我选的和实际显示的不一样"。

   浅色主题：明度上限 62%（白底上够深）
   暗色主题：明度夹在 62%~78%（深底上够亮，又不刺眼） */

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** rgb → hsl，h 取 0–360，s/l 取 0–1 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = l - c / 2;
  const to = (v: number) =>
    Math.round(clamp(v + m, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(rgb[0])}${to(rgb[1])}${to(rgb[2])}`;
}

/** 把一个自定义主色收敛成"浅色主题用"与"暗色主题用"两个可用取值 */
export function deriveAccents(input: string): { light: string; dark: string } | null {
  const rgb = hexToRgb(input);
  if (!rgb) return null;
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  // 饱和度太低的灰在作为强调色时很难与正文区分，抬一点下限
  const sat = s > 0 && s < 0.3 ? 0.3 : s;
  return {
    light: hslToHex(h, sat, Math.min(l, 0.62)),
    dark: hslToHex(h, sat, clamp(Math.max(l, 0.62), 0.62, 0.78)),
  };
}
