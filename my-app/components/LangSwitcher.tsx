"use client";

import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";

/**
 * 语言切换。原先挂在顶栏，现按需求移到页脚，渲染成与其它页脚卡片一致的样式。
 *
 * 必须是客户端组件：切换目标要用当前路径算出来（/zh/xxx ↔ /en/xxx），
 * 服务端组件拿不到 pathname。
 */
export default function LangSwitcher({
  label,
  name,
  title,
}: {
  /** 卡片小标题，如「语言」/「Language」 */
  label: string;
  /** 目标语言名，如 English / 中文 */
  name: string;
  /** 无障碍与悬停提示 */
  title: string;
}) {
  const pathname = usePathname() || "/";
  // /zh/xxx -> /en/xxx；根路径也要正确（replace 后为空串时补 /）
  const otherLang = pathname.startsWith("/en") ? "zh" : "en";
  const rest = pathname.replace(/^\/(zh|en)/, "") || "/";
  const target = `/${otherLang}${rest}`;

  return (
    <a className="footer-link" href={target} title={title} aria-label={title}>
      <span className="footer-link-label">
        <Icon
          icon={icons["mdi:translate"]}
          className="footer-link-icon"
          data-icon="mdi:translate"
          width="1.1em"
          height="1.1em"
        />
        {label}
      </span>
      <span className="footer-link-value">{name}</span>
    </a>
  );
}
