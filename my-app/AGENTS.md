<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 工作流约定

- **改代码前先拉取远端。** 每次动手修改前先执行 `git pull`，确认本地与 `origin/main` 同步后再改；避免出现非快进推送失败或与他人手动改动冲突。
- 提交信息用中文，一次改动一个主题；完成后推送并确认工作区干净。

## 文档同步（每次推送前必做）

三份文档描述的是同一个项目的不同侧面，**改动涉及的描述失效时必须同一次推送里更新**：

| 文档 | 路径 | 读者 | 何时必须更新 |
|---|---|---|---|
| README | `README.md` | 仓库访客 | 特性、技术栈、目录结构、部署方式有变 |
| 博客书写规范 | `my-app/content/zh/posts/博客书写规范/` | 作者与 AI | 约定、字段、文件结构、坑点有变 |
| 博客维护指南 | `my-app/content/zh/posts/维护指南/` | 作者本人 | 操作步骤有变（文件位置、流程、命令） |

判定标准：“**照着这份文档做，会不会做错？**” 会，就必须改。

**若本次确实不需要更新任何一份**，在提交信息末尾显式写一行说明原因，例如：

```
文档：无需更新（仅改友链数据，三份文档都未描述具体友链）
```

目的是让“未更新”成为一个显式决定而不是遗漏。三份文档互相引用，改一处时顺带检查交叉引用。

另外：**改了样式或组件后，不要直接声称“已完成”**，本机无法构建与预览（见维护指南下篇“七”），
必须把“需要验证什么”列清楚交给用户确认。
