# cdu-nailong-cn · 成都奶龙大学.cn

成都奶龙大学（xn--psszg58c53lfp7dgls.cn）的着陆页 —— 「奶龙引渡处」两幕式戏仿着陆页。

> **本站为戏仿演示，非成都大学官方网站 · 内容与成都大学无关。**

## 仓库结构

| 路径 | 说明 |
|---|---|
| `prototype/index.html` | 页面本体（单文件 HTML/CSS/JS），双击即可本地预览 |
| `prototype/assets/` | 全部静态素材：33+ 幅馆藏画作 webp、头像表情环、门面肌理、幽灵奶蛙、音效 |
| `build-worker.mjs` | 构建脚本：把原型打包成部署目录 `dist/`（`node build-worker.mjs`；`--maintenance` 生成全站 503 维护页） |
| `deploy/` | 首尔 VPS 直接部署：`deploy-seoul.sh` 一键构建上传，`cdu-nailong.nginx.conf` 为服务器 nginx 站点配置 |
| `docs/设计说明.md` | 视觉与交互设计说明（三幕结构、动效细节） |

## 页面结构（三段）

**第一幕 · 勋章开屏** —— 金黑 Art-deco 舞台：奶龙勋章 + 12 颗可点击表情环（点击与中心交换）、
馆藏画作 Ken Burns 轮播背景、金尘粒子canvas、底部「立即前往CDU官网 / 统一身份认证」双按钮。

**龙门过渡** —— 滚动 1:1 驱动的 3D 龙门（铜钉浮雕 + 奶龙剪影肌理 + 门缝金光 + 门后探头彩蛋），
门开 85% 后渐隐让位。

**第二幕 · 引渡凭证** —— 纸张质感公函：凭证编号、馆藏三联画框（点击浮出展签故事卡，
卡内「放大欣赏」可开灯箱看大图 + 完整文案）、幽灵奶蛙彩蛋（光标划过纸面空白处留下淡奶蛙印记，
仅在第二幕完全占满视口时触发）、页脚免责声明与素材出处链接。

## 构建与部署

部署方式（2026-10-24 起）：**首尔 VPS 直接托管**（境外服务器免备案），不再走 Cloudflare Workers。

```bash
# 修改 prototype/ 后一键构建 + 上传首尔服务器
bash deploy/deploy-seoul.sh
```

服务器侧（已配置好，一般无需再动）：

- 站点目录 `/var/www/cdu-nailong`，nginx 站点配置 `/etc/nginx/sites-available/cdu-nailong.cn`
- TLS 证书：Let's Encrypt（certbot 已签发，DNS-only 记录 + HTTP-01，自动续期）
- DNS（Cloudflare，2026-10-24 切换）：`@` 与 `www` 两条 A 记录 → `43.128.131.154`，仅 DNS 不走 CF 代理；原 Worker 自定义域已删除
- 历史方案：Cloudflare Workers（`cd dist && npx wrangler deploy`）已弃用，构建产物 `dist/_worker.js` 仍保留，仅作为部署到其他 Workers 环境的备选

`dist/` 为构建产物，不入库（见 `.gitignore`）。

## 素材与致谢

- 馆藏画作出自「[奶蛙博物馆 · Musée du Milk Frog](https://works.cohub.live/w/157e937b-95da-4c17-add4-f916e37c3574/milk-frog-museum/2927949457b0/content/index.html)」与「[奶蛙艺术圣殿 · naiwa-wallpaper](https://github.com/Nailong-Studio/wallpaper)」素材库，版权归原作者所有
- 第三方素材原始库（wallpaper-main 等）不入版本库，请从上游仓库获取
- 出口按钮指向 [成都大学官网](https://www.cdu.edu.cn/) 与 [统一身份认证](https://id.cdu.edu.cn/login)

## License

页面代码仅供学习交流；「奶龙」形象及馆藏画作权利归各自原作者所有。

---

Web Powered By [kdjdhe](https://github.com/kdjdhe)
