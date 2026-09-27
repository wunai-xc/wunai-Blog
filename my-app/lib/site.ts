// 客户端安全的站点配置（不依赖 Node.js fs）
export type Lang = "zh" | "en";

export interface PostFrontmatter {
  title: string;
  date: string;
  draft?: boolean;
  author?: string;
  tags?: string[];
  categories?: string[];
  summary?: string;
  description?: string;
  pinned?: boolean;
  /* 卡组内文章的手动排序号；不写则按文件名数字前缀排 */
  order?: number;
  /* 作为「关于」文章：正文会渲染在首页首屏，并不再出现在下方展示位里 */
  about?: boolean;
  pinnedDescription?: string;
  hiddenInHomeList?: boolean;
  showToc?: boolean;
  cover?: { image?: string; caption?: string; hidden?: boolean; relative?: boolean };
  references?: { title: string; url?: string; author?: string; year?: string }[];
  keywords?: string[];
  canonicalURL?: string;
}

export interface Post {
  slug: string;
  lang: Lang;
  title: string;
  date: string;
  author?: string;
  tags: string[];
  categories: string[];
  summary: string;
  description?: string;
  pinned: boolean;
  about: boolean;
  /* 所属卡组的目录名；不属于任何卡组时为 undefined */
  group?: string;
  /* 卡组内的排序号（frontmatter 的 order） */
  order?: number;
  /* 卡片右侧缩略图：优先 frontmatter 的 cover.image，否则取正文第一张图。
     两者都没有则为 undefined，卡片不渲染图片。 */
  thumbnail?: string;
  pinnedDescription?: string;
  hiddenInHomeList: boolean;
  showToc: boolean;
  cover?: PostFrontmatter["cover"];
  references?: PostFrontmatter["references"];
  keywords?: string[];
  content: string;
  filePath: string;
  wordCount: number;
  isAI: boolean;
}

/* ===== 卡组（文章组） =====
   由 content/<lang>/posts/<组名>/_index.md 标记，同目录下的 .md 即组内文章。
   组本身没有日期，用组内最新文章的时间去列表里定位。 */
export interface PostGroup {
  /** 目录名，也是 URL 片段 */
  slug: string;
  lang: Lang;
  title: string;
  description?: string;
  /** 组内最新一篇文章的日期，用于列表排序 */
  date: string;
  /** 封面图：_index.md 的 cover.image，填满卡片边框内部 */
  cover?: string;
  /** 已按 order / 文件名前缀排好序的组内文章 */
  posts: Post[];
  wordCount: number;
}

export const SITE = {
  title: "wunai's blog",
  author: "wunai",
  url: "https://blog.wunai.top",
  defaultLang: "zh" as Lang,
  description: "学习笔记与生活思考：数学、物理、化学、医学、技术文章集合",
  /* ===== 联系方式：邮箱 / GitHub / 本仓库 / 社交账号 =====
     文案（标签、说明、仓库名）在下面 i18n 里，中英文各一份；
     这里只放与语言无关的地址与账号 */
  contact: {
    email: "3234319738@qq.com",
    github: "https://github.com/wunai-xc",
    repo: "https://github.com/wunai-xc/wunai-blog",
    /* 可直接跳转的两个账号 */
    bilibili: "https://b23.tv/2alhnm5",
    bilibiliName: "WUNAI-XC",
    youtube: "https://youtube.com/@wunai-xc",
    youtubeName: "@wunai-xc",
    /* 只能展示、无法链接的：微信 ID；Discord 通过邮箱加好友，说明文案在 i18n */
    wechat: "wunaixc",
  },
  homeInfo: {
    zh: { title: "Hi there", content: "欢迎来到我的博客，这里记录我的学习笔记与生活思考。" },
    en: { title: "Hi there", content: "Welcome to my blog — notes on tech and life." },
  },
  menu: {
    zh: [
      { name: "首页", href: "/zh/" },
      { name: "文章", href: "/zh/posts/" },
      { name: "搜索", href: "/zh/search/" },
      { name: "归档", href: "/zh/archives/" },
      { name: "友链", href: "/zh/links/" },
      { name: "DMCC", href: "https://dmcc.wunai.top/", external: true },
    ],
    en: [
      { name: "Home", href: "/en/" },
      { name: "Posts", href: "/en/posts/" },
      { name: "Search", href: "/en/search/" },
      { name: "Archives", href: "/en/archives/" },
      { name: "Links", href: "/en/links/" },
      { name: "DMCC", href: "https://dmcc.wunai.top/", external: true },
    ],
  },
  i18n: {
    /* 末尾以 home* / palette* 开头的一组键是首页（第二套视觉，见
       components/AestheticsHome.tsx 与 components/PaletteGrid.tsx）新增的，
       中英各一份，缺一边会导致取值为 undefined。 */
    zh: { home: "首页", posts: "文章", tags: "标签", search: "搜索", archives: "归档", categories: "分类", prev: "上一篇", next: "下一篇", readingTime: "分钟阅读", words: "字", pinned: "置顶", aiWarning: "本文由 AI 生成，可能存在误区，斟酌阅读！！", comments: "评论", searchPlaceholder: "输入关键词搜索...", noResults: "没有找到相关结果。", allPosts: "全部文章", onThisPage: "本页目录", printSingle: "打印", mdDownload: "下载 MD", scrollDown: "向下滚动", heroLead: "你好，我是", whatsNew: "更新内容", whatsNewSub: "按时间倒序排列", picks: "随便看看", picksSub: "一些我自己喜欢的文章", newBadge: "NEW", pageNav: "页面导航", heroEnd: ".", continueReading: "继续阅读", links: "友链", linksIntro: "这里是一些朋友的站点。觉得本站有些意思、也想交换链接的话，欢迎通过页面底部的邮箱或 QQ 联系我，写上你的站名、地址和一句介绍就行。", email: "邮箱", github: "GitHub", bilibili: "哔哩哔哩", youtube: "YouTube", wechat: "微信", discord: "Discord", discordHint: "通过邮箱加我为好友", authorPrefix: "作者：", language: "语言", switchLang: "切换到英文", languageName: "English", settingsSummary: "配色 · 宽度 · 动效", contactLabel: "欢迎随时来友好交流", contactBody: "仓库完全公开，欢迎 clone、参考与自定义修改（文章内容请注明出处）。发现问题或有想聊的，随时找我。", repoLabel: "本站仓库", groupLabel: "文章组", groupCount: "篇", groupBack: "返回文章组", thanks: "感谢你的阅读 :D", updates: "最近更新", settings: "设置", settingsHint: "这些设置只保存在当前浏览器（localStorage），不会上传。", palette: "配色方案", paletteCustom: "自定义", customAccent: "自选主色", skinLabel: "主题", skinPaper: "纸质", skinAesthetics: "玻璃", skinPalette: "玻璃配色", skinHint: "玻璃主题的明暗由配色自己决定，顶栏的日/夜切换对它不起作用。", readWidth: "阅读宽度", widthNarrow: "窄", widthNormal: "标准", widthWide: "宽", bgEffect: "背景动效", bgFull: "完整", bgDim: "减弱", bgOff: "关闭", acrylic: "亚克力材质", acrylicOn: "开（毛玻璃）", acrylicOff: "关（实色）", motion: "动画强度", motionFull: "完整", motionLite: "精简", motionOff: "关闭", resetSettings: "恢复默认", homeLive: "已上线", homeKicker1: "Next.js · 静态导出", homeKicker2: "八套配色系统", homeHeroLines: ["你好，我是", "wunai", "写下学习与生活"], homeMarquee: ["学习笔记", "✳", "生活思考", "✳", "数学 · 物理 · 化学", "✳", "医学 · 技术", "✳"], homeStartReading: "开始阅读", homeFeaturedEyebrow: "精选", homeFeaturedTitle: "先读这三篇", homeFeaturedThin: "，没有置顶时就是最新的三篇", homeQuote: "写作是把想清楚的东西留下来。先把问题写下来，答案才知道自己该站在哪里。", homeQuoteCite: "— wunai 的写作笔记", homeStatPosts: "篇文章", homeStatPalettes: "套配色", homeStatTags: "个标签", homeStatLangs: "种语言", homeStructureLabel: "结构约定", homeStructure: ["1 个 Next.js 应用，中英两种语言，App Router 静态导出", "八套玻璃配色 = 一组 CSS 变量，换肤不改版式", "文章写在 content/<lang>/posts 的 Markdown 里：加一篇 = 放一个文件", "零外链字体：全站走系统字体栈"], homePaletteEyebrow: "色彩系统", homePaletteTitle: "八套配色", homePaletteThin: "，点一下整站换血", homePaletteCurrent: "当前配色：", homePaletteSaved: "偏好保存在本机（localStorage）", paletteDark: "深色", paletteLight: "浅色", paletteMoods: { void: "深空酸柠", bloom: "霓虹绽放", ember: "余烬", abyss: "深海", solar: "正午烈阳", riso: "丝网印", porcelain: "瓷白", mint: "薄荷" }, homeMoreEyebrow: "长期笔记", homeMoreTitle: "更多文章", homeMoreThin: "，关于数学、化学、医学与技术", homeRssTitleLines: ["没有邮件列表", "只有一条 RSS"], homeRssBody: "纯静态站点没有后端，订阅框填了也发不出去，所以这里不放表单。想第一时间看到新文章就订阅 RSS；不想订阅，收藏这个页面也一样。", homeSubscribeRss: "订阅 RSS", homeUpdatesNote: "按时间倒序，数据在构建前从仓库提交记录抓取。", homeUpdatesEmpty: "暂无提交记录（本地开发未跑 prebuild 时属于这种情况）。" },
    en: { home: "Home", posts: "Posts", tags: "Tags", search: "Search", archives: "Archives", categories: "Categories", prev: "Previous", next: "Next", readingTime: "min read", words: "words", pinned: "Pinned", aiWarning: "This article was generated by AI and may contain inaccuracies. Read with caution!", comments: "Comments", searchPlaceholder: "Search posts...", noResults: "No results found.", allPosts: "All Posts", onThisPage: "On this page", printSingle: "Print", mdDownload: "Download MD", scrollDown: "Scroll down", heroLead: "Hello, I'm", whatsNew: "What's new", whatsNewSub: "Newest first", picks: "A few posts I like", picksSub: "Hand-picked from the archive", newBadge: "NEW", pageNav: "Page navigation", heroEnd: ".", continueReading: "Continue reading", links: "Links", linksIntro: "Some sites run by friends. If you'd like to exchange links, reach me via the email or QQ at the bottom of the page — just send your site name, URL and a one-line intro.", email: "Email", github: "GitHub", bilibili: "Bilibili", youtube: "YouTube", wechat: "WeChat", discord: "Discord", discordHint: "Add me via email", authorPrefix: "By ", language: "Language", switchLang: "Switch to Chinese", languageName: "中文", settingsSummary: "Palette · Width · Motion", contactLabel: "Say hi any time", contactBody: "The repo is public — feel free to clone it, learn from it and adapt it (please credit the source for article content). Found a bug, or just want to chat? Get in touch.", repoLabel: "Repository", groupLabel: "Collection", groupCount: "articles", groupBack: "Back to collection", thanks: "Thanks for reading :D", updates: "Recent updates", settings: "Settings", settingsHint: "Preferences are stored in this browser only (localStorage), never uploaded.", palette: "Color scheme", paletteCustom: "Custom", customAccent: "Custom accent", skinLabel: "Theme", skinPaper: "Paper", skinAesthetics: "Glass", skinPalette: "Glass palette", skinHint: "In the glass theme, light or dark comes from the palette itself — the header's day/night switch has no effect there.", readWidth: "Reading width", widthNarrow: "Narrow", widthNormal: "Normal", widthWide: "Wide", bgEffect: "Background animation", bgFull: "Full", bgDim: "Dimmed", bgOff: "Off", acrylic: "Acrylic material", acrylicOn: "On (frosted)", acrylicOff: "Off (solid)", motion: "Animation level", motionFull: "Full", motionLite: "Lite", motionOff: "Off", resetSettings: "Reset to defaults", homeLive: "Live", homeKicker1: "Next.js · static export", homeKicker2: "Eight palettes", homeHeroLines: ["Hello, I'm", "wunai", "writing about study and life"], homeMarquee: ["Study notes", "✳", "Life thoughts", "✳", "Math · Physics · Chemistry", "✳", "Medicine · Tech", "✳"], homeStartReading: "Start reading", homeFeaturedEyebrow: "Selected", homeFeaturedTitle: "Start with these three", homeFeaturedThin: " — the newest three unless something is pinned", homeQuote: "Writing is how a thought survives. Put the question down first — the answer will find its place.", homeQuoteCite: "— wunai, writing notes", homeStatPosts: "posts", homeStatPalettes: "palettes", homeStatTags: "tags", homeStatLangs: "languages", homeStructureLabel: "How it's built", homeStructure: ["One Next.js app, two languages, App Router static export", "Eight glass palettes = one set of CSS variables; re-skinning never touches the layout", "Posts are Markdown in content/<lang>/posts: one file per post", "No web fonts: system font stack only"], homePaletteEyebrow: "Color system", homePaletteTitle: "Eight palettes", homePaletteThin: ", one click to re-skin the whole site", homePaletteCurrent: "Current palette: ", homePaletteSaved: "saved in this browser (localStorage)", paletteDark: "dark", paletteLight: "light", paletteMoods: { void: "deep-space lime", bloom: "neon bloom", ember: "ember", abyss: "deep sea", solar: "noon sun", riso: "riso print", porcelain: "porcelain", mint: "mint" }, homeMoreEyebrow: "Archive", homeMoreTitle: "More posts", homeMoreThin: ", on math, chemistry, medicine and tech", homeRssTitleLines: ["No mailing list", "just one RSS feed"], homeRssBody: "A static site has no backend — a subscribe box here would go nowhere, so there isn't one. Follow the RSS feed to catch new posts, or bookmark this page.", homeSubscribeRss: "Subscribe via RSS", homeUpdatesNote: "Newest first; fetched from the repository before each build.", homeUpdatesEmpty: "No commits recorded yet (this happens in local dev when prebuild hasn't run)." },
  },
};

// 阅读时长（分钟）：按 400 字/分钟估算，至少 1 分钟
export const WORDS_PER_MINUTE = 400;

export function readingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}
