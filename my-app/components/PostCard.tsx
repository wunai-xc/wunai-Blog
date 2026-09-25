"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";
import type { Post } from "../lib/site";
import { SITE, readingMinutes } from "../lib/site";

export default function PostCard({
  post,
  lang,
  hidePinnedBadge = false,
}: {
  post: Post;
  lang: "zh" | "en";
  /* 首页展示位不再强调“置顶”字样，由调用方传入 */
  hidePinnedBadge?: boolean;
}) {
  const t = SITE.i18n[lang];
  const readingTime = readingMinutes(post.wordCount);
  /* 缩略图可能是外链（正文里的图床/外站图），对方可能禁止外链。
     出错时隐藏整个缩略图，而不是留一块碎图占位。 */
  const [thumbOk, setThumbOk] = useState(true);
  const href = `/${lang}/posts/${encodeURIComponent(post.slug)}/`;

  return (
    <article
      className={`post-card${post.isAI ? " ai" : ""}${post.thumbnail && thumbOk ? " has-thumb" : ""}`}
    >
      {/* 正文：包一层才能与右侧缩略图并排。
          不包的话 h2/meta/summary 会各自成为 flex 子项、被摆成一行。 */}
      <div className="post-card-body">
        <h2>
          <Link href={href}>{post.title}</Link>
          {post.pinned && !hidePinnedBadge && <span className="pinned-badge">{t.pinned}</span>}
        </h2>
        <div className="meta">
          <span>{post.date}</span>
          <span>{readingTime} {t.readingTime}</span>
          <span>{post.wordCount} {t.words}</span>
          {post.author && <span><Icon icon={icons["mdi:account-outline"]} width="1em" height="1em" /> {post.author}</span>}
        </div>
        {post.summary && <p className="summary">{post.summary}</p>}
      </div>

      {/* 右侧缩略图：与标题指向同一篇文章，给一个更大的点击区域 */}
      {post.thumbnail && thumbOk && (
        <Link className="post-card-thumb" href={href} tabIndex={-1} aria-hidden="true">
          {/* 图片可能是任意域名，用原生 img（next/image 需预声明 remotePatterns） */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setThumbOk(false)}
          />
        </Link>
      )}
    </article>
  );
}
