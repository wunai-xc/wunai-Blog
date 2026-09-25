"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";
import type { PostGroup } from "../lib/site";
import { SITE, readingMinutes } from "../lib/site";

/**
 * 卡组卡片：多张卡片叠在一起，点进去看组内文章。
 *
 * 保留静态双层线框暗示“合集”，hover 仅改变边线与底色。
 */
export default function GroupCard({
  group,
  lang,
}: {
  group: PostGroup;
  lang: "zh" | "en";
}) {
  const t = SITE.i18n[lang];
  const [coverOk, setCoverOk] = useState(true);
  const href = `/${lang}/groups/${encodeURIComponent(group.slug)}/`;
  const showCover = !!group.cover && coverOk;

  return (
    <article className="collection-card">
      {/* 背后两层层叠卡片：负责「一摞卡」的观感 */}
      <div className="collection-stack" aria-hidden="true">
        <span className="stack" />
        <span className="stack stack-2" />
      </div>

      <Link className="collection-link" href={href}>
        {/* 封面：撑满边框内部，四周不留内边距 */}
        {showCover && (
          <div className="collection-cover">
            {/* 图片可能是任意域名，用原生 img（next/image 需预声明 remotePatterns） */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={group.cover}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setCoverOk(false)}
            />
          </div>
        )}

        <div className="collection-body">
          <div className="collection-head">
            <span className="collection-badge">
              <Icon icon={icons["mdi:folder-multiple-outline"]} width="1em" height="1em" />
              {group.posts.length} {t.groupCount}
            </span>
            <span className="collection-kind">{t.groupLabel}</span>
          </div>

          <h2 className="collection-title">{group.title}</h2>

          <div className="collection-meta">
            <span>{readingMinutes(group.wordCount)} {t.readingTime}</span>
            <span>{group.wordCount} {t.words}</span>
            {/* group.date 是组内最新一篇文章的日期，不是组内第一篇 */}
            <span>{group.date}</span>
          </div>

          {group.description && <p className="collection-summary">{group.description}</p>}
        </div>
      </Link>
    </article>
  );
}
