# 导出说明：博客视觉改版（Claude 风格）

补丁文件：`export/visual-refresh.patch`

## 工作区修改痕迹

当前工作区不是干净检出，至少包含以下本地修改：

| 文件 | 改动 |
|---|---|
| `my-app/app/globals.css` | 暖纸色 / 暖黑色主题、赭石强调色、衬线标题、统一圆角、卡片层次、键盘 focus、移动端适配，以及本次追加的 Claude 风格细化 |
| `my-app/app/[lang]/page.tsx` | 删除首页重复渲染的第二个 `<HomeSnap />` |
| `my-app/components/PostBody.tsx` | 为图片监听、复制按钮计时器、图表观察器补充路由切换清理 |
| `my-app/lib/settings.ts` | 将默认 blue 预设的预览色同步为暖赭石色 |
| `export/` | 保留视觉改版说明与基线补丁，便于追踪来源 |

`visual-refresh.patch` 是此前生成的基线补丁，并不包含后续对 `PostBody.tsx`、`lib/settings.ts` 和视觉细节的追加修改；当前应优先以工作区实际文件为准。

## 设计改动概要

- 亮色：暖纸底 `#f7f5f2` + 近墨文字 `#252422` + 赭石强调
- 暗色：暖黑底 `#181715` + 米白文字 `#f1eee9` + 柔橙强调
- 标题使用克制的衬线字体，正文保持清晰的无衬线阅读字体
- 卡片、面板、按钮、标签统一 12px 圆角，缩略图保持更紧凑的 9px
- 阴影改为低对比度暖色层次，hover 只做轻微抬升
- 增加键盘 focus-visible 反馈，关闭动画时不再强制卡片抬升
- 移动端收紧首页左右留白与标题字号

## 验证建议

本环境无法直接运行项目命令或浏览器预览。请在本地执行：

```sh
cd my-app
npm run lint
npm run build
```

并重点确认：

1. 首页三屏排版、滚动吸附与页脚仍可到达
2. 亮色 / 暗色 × 首页 / 列表页 / 详情页 / 设置页
3. 已保存的 teal / violet / green / orange / rose / custom 配色仍能正常覆盖赭石默认色
4. 手机宽度（≤480px）顶栏、文章卡片、首页标题不溢出
5. 鼠标 hover、键盘 Tab focus、`prefers-reduced-motion` 与设置中的动画关闭
6. 文章路由切换后图片、复制按钮和图表没有重复监听或残留
