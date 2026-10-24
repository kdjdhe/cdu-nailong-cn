// 从 prototype/index.html + prototype/assets/ 构建部署目录 dist/
// 用法：node build-worker.mjs                → 正常站点
//       node build-worker.mjs --maintenance  → 维护模式（ICP 备案审核期，全站 503）
// 部署：npx wrangler deploy   （读取 wrangler.toml，静态资产自动上传）
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

// ---------- 维护模式（ICP 备案审核期间） ----------
// 全站返回 503 + 中性维护页：不返回任何站点内容，也不出现站点名称，
// 避免审核时被判定"网站名称与内容不符"；自定义域名绑定保留，备案通过后正常构建即可恢复。
const MAINTENANCE = process.argv.includes('--maintenance');

if (MAINTENANCE) {
  const body = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<meta name="robots" content="noindex,nofollow">'
    + '<title>网站维护中</title><style>'
    + 'html,body{height:100%;margin:0}'
    + 'body{display:flex;align-items:center;justify-content:center;background:#14120e;'
    + 'color:#c9b689;font:15px/1.9 Georgia,"Songti SC",serif;text-align:center}'
    + '.box{padding:32px 26px}'
    + 'h1{margin:0 0 12px;font-size:16px;font-weight:500;letter-spacing:.34em;color:#d4af37}'
    + 'p{margin:0;font-size:13px;letter-spacing:.1em;opacity:.7}'
    + '</style></head><body><div class="box"><h1>网站维护中</h1>'
    + '<p>本站正在维护，请稍后再访问。</p></div></body></html>';

  const maintWorker = `// 维护模式构建产物（ICP 备案审核期间）——全站 503，不返回任何站点内容。
// 恢复：node build-worker.mjs（不带参数）→ cd dist && npx wrangler deploy
const BODY = ${JSON.stringify(body)};

export default {
  async fetch() {
    return new Response(BODY, {
      status: 503,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'retry-after': '86400',
        'x-robots-tag': 'noindex, nofollow, noarchive',
      },
    });
  },
};
`;

  rmSync('dist', { recursive: true, force: true });
  mkdirSync('dist', { recursive: true });
  writeFileSync('dist/_worker.js', maintWorker);
  writeFileSync('dist/wrangler.toml', `name = "cdu-nailong"
main = "_worker.js"
compatibility_date = "2026-10-01"

# 自定义域名绑定保持不变：备案审核期间域名不解绑，只让内容不可见
routes = [
  { pattern = "xn--psszg58c53lfp7dgls.cn", custom_domain = true },
  { pattern = "www.xn--psszg58c53lfp7dgls.cn", custom_domain = true }
]
`);
  console.log('dist/ built (MAINTENANCE mode):');
  console.log('  _worker.js  ', maintWorker.length, 'bytes — 全站 503');
  console.log('  wrangler.toml — 自定义域名绑定保留，静态资产不上传');
  console.log('deploy: cd dist && npx wrangler deploy');
  process.exit(0);
}

// ---------- 0. 小图内联：首屏小图转 data URI，砍掉高延迟链路上的额外往返 ----------
// 第一幕全部小图（勋章中心 + 12 颗环头像 + 门面剪影×2）+ 幽灵奶蛙×4 内联进 HTML。
// 每一个都是 4~6KB 的小文件，但在 CF 大陆→美西链路上每个请求都是一次 2~13s 的折返，
// 内联后首屏请求数从 16 个降到 2 个（HTML + 背景画 art-08）。
const INLINE = [
  'nailong-core.webp',
  ...Array.from({ length: 12 }, (_, i) => `ring-${String(i).padStart(2, '0')}.webp`),
  'gate-emblem-think.webp',
  'gate-emblem-laugh.webp',
  'frog-01.webp', 'frog-02.webp', 'frog-03.webp', 'frog-04.webp',
];
const dataUri = {};
for (const f of INLINE) {
  const buf = readFileSync(join('prototype/assets', f));
  const b64 = buf.toString('base64');
  const mime = f.endsWith('.webp') ? 'image/webp' : 'application/octet-stream';
  dataUri[f] = `data:${mime};base64,${b64}`;
}

let html = readFileSync('prototype/index.html', 'utf8');
let inlined = 0;
for (const [name, uri] of Object.entries(dataUri)) {
  // 只替换精确的资产路径引用（src="..."、url('...')、数组字符串），防止误伤同名前缀
  const parts = html.split(`assets/${name}`);
  if (parts.length > 1) inlined += parts.length - 1;
  html = parts.join(uri);
}
console.log(`inlined ${Object.keys(dataUri).length} images (${inlined} references) as data URIs`);
const esc = html.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

const htmlHash = /* 简易 FNV-1a 内容指纹，HTML 变则变 */
  (() => {
    let h = 0x811c9dc5;
    for (let i = 0; i < html.length; i++) { h ^= html.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return h.toString(36);
  })();

const workerIndex = `/**
 * 成都奶龙大学.cn —— 奶龙引渡处着陆页（构建产物，勿手改）
 * 源文件：prototype/index.html；重新构建：node build-worker.mjs
 *
 * 两幕结构：第一幕勋章开屏（不自动跳转），点击/下滑进入第二幕"引渡凭证"，
 * 点按后白闪 0.9s 跳转官网。背景轮播与第二幕画框使用「奶蛙博物馆」馆藏画作，
 * 已在页脚署名出处。
 *
 * 缓存策略：HTML 用 ETag 协商缓存（命中 304，弱网只回传几十字节）；
 * 静态资产由 _headers 设长缓存 + stale-while-revalidate。
 */

const HTML = \`${esc}\`;
const ETAG = "cdu-${html.length}-${htmlHash}";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();

    if (path === '/favicon.ico' || path === '/favicon.svg') {
      const svg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <path d="M44 30c-6-2-9.5-7.5-9-15 5.5 1.2 9.8 5.5 11 12z" fill="#d98f0a"/>
        <path d="M76 30c6-2 9.5-7.5 9-15-5.5 1.2-9.8 5.5-11 12z" fill="#d98f0a"/>
        <circle cx="60" cy="66" r="44" fill="#f7c22e"/>
        <ellipse cx="46" cy="58" rx="7.6" ry="9.6" fill="#241a08"/>
        <ellipse cx="74" cy="58" rx="7.6" ry="9.6" fill="#241a08"/>
        <circle cx="48.8" cy="54.2" r="2.7" fill="#fff"/>
        <circle cx="76.8" cy="54.2" r="2.7" fill="#fff"/>
        <ellipse cx="60" cy="86" rx="16" ry="11" fill="#fff4d2" opacity=".9"/>
        <path d="M53.5 87.5c3.8 3.6 9.2 3.6 13 0" fill="none" stroke="#6b4413" stroke-width="2.6" stroke-linecap="round"/>
      </svg>\`;
      return new Response(svg, {
        headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400', 'x-robots-tag': 'noindex' },
      });
    }

    if (path === '/robots.txt') {
      return new Response('User-agent: *\\\\nDisallow: /\\\\n', {
        headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' },
      });
    }

    if (path !== '/' && path !== '') {
      return new Response('Not found', { status: 404, headers: { 'x-robots-tag': 'noindex' } });
    }

    // HTML 协商缓存：内容没变 → 304（弱网下省掉 30KB 整页传输）
    const inm = request.headers.get('if-none-match');
    if (inm === ETAG) {
      return new Response(null, {
        status: 304,
        headers: {
          'etag': ETAG,
          'cache-control': 'public, max-age=0, must-revalidate',
          'x-robots-tag': 'noindex, nofollow, noarchive',
        },
      });
    }

    return new Response(HTML, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, must-revalidate',
        'etag': ETAG,
        'x-robots-tag': 'noindex, nofollow, noarchive',
        'referrer-policy': 'no-referrer',
        'content-security-policy':
          "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; "
          + "img-src 'self' data: blob: https://xn--psszg58c53lfp7dgls.cn; "
          + "media-src 'self'; "
          + "connect-src 'none'; form-action 'none'; base-uri 'none'",
      },
    });
  },
};
`;

// ---------- 2. 组装 dist/ ----------
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/assets', { recursive: true });
writeFileSync('dist/_worker.js', workerIndex);

// wrangler.toml：run_worker_first 保证 Worker 先处理（favicon/robots/noindex 头），
// 其余 /assets/* 由静态资产直接服务
writeFileSync('dist/wrangler.toml', `name = "cdu-nailong"
main = "_worker.js"
compatibility_date = "2026-10-01"

# 自定义域名绑定：部署时自动在 zone 里建 DNS 记录并签发边缘证书
routes = [
  { pattern = "xn--psszg58c53lfp7dgls.cn", custom_domain = true },
  { pattern = "www.xn--psszg58c53lfp7dgls.cn", custom_domain = true }
]

assets = { directory = "./public", binding = "ASSETS", run_worker_first = ["/favicon.ico", "/favicon.svg", "/robots.txt"] }
`);

// public/ 目录：静态资产（wrangler 的 assets.directory 必须与 main 分离）
mkdirSync('dist/public/assets', { recursive: true });
const srcAssets = 'prototype/assets';
for (const f of readdirSync(srcAssets)) {
  copyFileSync(join(srcAssets, f), join('dist/public/assets', f));
}

// _headers：静态资产长缓存（HTTP 标准的 immutable 策略）。
// 这些文件只随部署更新（wrangler 全量替换），且页面引用它们时不带版本号——
// 用 1 天 max-age + ETag 协商兜底：重复访问 304 一问一答，内容变了立刻生效。
writeFileSync('dist/public/_headers', `
/assets/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
`);

console.log('dist/ built:');
console.log('  _worker.js  ', workerIndex.length, 'bytes');
console.log('  wrangler.toml');
for (const f of readdirSync('dist/public/assets')) {
  console.log('  public/assets/' + f);
}
console.log('deploy: cd dist && npx wrangler deploy');
