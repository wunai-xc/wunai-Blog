/* 全站 Service Worker — 预缓存首页，页面 SWR，静态资源 cache-first，CDN network-first */
/*
 * v5：除了提版本，还修了一个真 bug（下面 fetch 里）：
 * 原来不管响应成不成功都写进缓存。静态资源是 cache-first 且从不校验，
 * 于是「文件还没部署时缓存下的 404」会永久生效 —— 典型表现：
 *   先推了引用 /ESKAPE/*.webp 的文章，图片晚一小时才上传，
 *   期间打开过那篇文章 → 6 张图的 404 被缓存 → 图片上线后仍然显示不出来。
 * 现在只缓存成功响应，缓存里的非成功响应一律当未命中重新取。
 *
 * v4：再提版本，清掉旧缓存。
 *
 * 为什么每个版本都要提：静态资源（.js/.css）走 cache-first，而缓存名带着 VERSION，
 * 只要 VERSION 不变，旧 chunk 就永远不会被清。多次部署后会出现这种错配：
 *   - HTML 走 SWR，很快更新到新版本
 *   - 但页面里正在跑的 JS / CSS 还是缓存里的旧文件
 * 于是实际看到的是旧样式（例：改了好几次 KaTeX 公式溢出，页面却毫无变化）。
 * 提版本号 = 清一次缓存，让客户端拿回一致的 HTML/JS/CSS。
 *
 * 另：/sw.js 自身的更新不受 fetch 事件控制（SW 脚本请求不走 fetch），
 * 但会受 HTTP 缓存影响，必要时手动注销 SW 或清站点数据可立即生效。
 */
const VERSION = "v5";
const STATIC_CACHE = `static-${VERSION}`;
const PAGE_CACHE = `pages-${VERSION}`;
const CDN_CACHE = `cdn-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = ["/", "/zh/", "/offline.html", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => ![STATIC_CACHE, PAGE_CACHE, CDN_CACHE].includes(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* 把「可能为 undefined 的缓存命中」兜底成一个真正的响应。
   否则 respondWith(undefined) 会让浏览器直接报网络错误。 */
function orError(res) {
  return res || Response.error();
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 跨域 CDN：network-first
  if (url.origin !== self.location.origin) {
    e.respondWith(
      fetch(req).then((res) => {
        // 只缓存成功响应：失败响应一旦进缓存，下面 catch 里的回退
        // 也会一直拿它，等于把一次临时错误固化了
        if (res.ok) {
          const copy = res.clone();
          caches.open(CDN_CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then(orError))
    );
    return;
  }

  // 静态资源：cache-first
  if (/\.(css|js|woff2?|png|jpg|jpeg|gif|svg|ico|webp|avif|json)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((cached) => {
        // 关键：缓存里若躺着非成功响应（典型是文件还没部署时缓存下的 404），
        // 当成未命中并重新取。否则这张图会永远显示不出来。
        // 静态资源是 cache-first 且从不校验，一旦错过就是永久性的。
        if (cached && cached.ok) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => orError(cached));
      })
    );
    return;
  }

  // HTML 页面：SWR
  if (req.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      caches.open(PAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        // 缓存里的 404 页面同样不算有效内容
        const usable = cached && cached.ok ? cached : undefined;
        const network = fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => usable || caches.match(OFFLINE_URL).then(orError));
        return usable || network;
      })
    );
  }
});

// 通知客户端缓存状态
self.addEventListener("message", (e) => {
  if (e.data === "getCacheStatus") {
    e.source.postMessage({ type: "cacheStatus", cached: true });
  }
});
