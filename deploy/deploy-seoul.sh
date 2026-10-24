#!/usr/bin/env bash
# 成都奶龙大学.cn —— 部署到首尔 VPS（nginx 直接托管，不经 Cloudflare）
# 用法：在仓库任意位置运行  bash deploy/deploy-seoul.sh
# 前提：ssh 别名 seoul 可用（见 ~/.ssh/config）；域名 DNS 已指向 43.128.131.154
# 首次部署之外的证书变更见 deploy/cdu-nailong.nginx.conf 注释（certbot 自动续期）。
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[1/4] 构建并导出静态站点"
node build-worker.mjs
node --input-type=module -e '
const m = await import("./dist/_worker.js");
const fs = await import("node:fs");
const mk = (p) => new Request("https://xn--psszg58c53lfp7dgls.cn" + p);
fs.writeFileSync("dist/public/index.html", await (await m.default.fetch(mk("/"))).text());
fs.writeFileSync("dist/public/favicon.svg", await (await m.default.fetch(mk("/favicon.svg"))).text());
fs.writeFileSync("dist/public/robots.txt", "User-agent: *\nDisallow: /\n");
console.log("static index/favicon/robots exported");
'

echo "[2/4] 打包上传"
tar -czf .tmp_deploy.tar.gz --exclude=_headers -C dist/public .
scp -q .tmp_deploy.tar.gz seoul:/home/ubuntu/.cdu-site.tar.gz

echo "[3/4] 服务器解压并重载 nginx"
ssh seoul 'sudo tar -xzf /home/ubuntu/.cdu-site.tar.gz -C /var/www/cdu-nailong && sudo chown -R ubuntu:ubuntu /var/www/cdu-nailong && sudo chmod -R a+rX /var/www/cdu-nailong && sudo nginx -t && sudo systemctl reload nginx'
rm -f .tmp_deploy.tar.gz

echo "[4/4] 完成。访问 https://xn--psszg58c53lfp7dgls.cn/ 检查（证书为 Let's Encrypt，certbot 自动续期）。"
