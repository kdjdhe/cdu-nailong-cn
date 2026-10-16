# cdu-nailong-cn · 成都奶龙大学.cn

成都奶龙大学（xn--psszg58c53lfp7dgls.cn）着陆页源码仓库 —— 「奶龙引渡处」两幕式戏仿着陆页。

> 本站为戏仿演示，非成都大学官方网站 · 内容与成都大学无关。

## 页面结构

- **第一幕 · 勋章开屏**：金黑主题，奶龙勋章 + 表情环、馆藏画作背景轮播、金尘粒子
- **龙门过渡**：滚动 1:1 开合的 3D 龙门
- **第二幕 · 引渡凭证**：纸张质感凭证页，馆藏三联画框（点击浮出展签、可放大欣赏）、幽灵奶蛙彩蛋

## 技术栈

纯静态 HTML/CSS/JS 单文件页面，构建为 Cloudflare Worker 部署（`build-worker.mjs`）。

## 相关站点与致谢

- 馆藏画作出自「奶蛙博物馆 · Musée du Milk Frog」（works.cohub.live）与「奶蛙艺术圣殿 · naiwa-wallpaper」素材库，版权归原作者所有
- 部署：Cloudflare Workers

---

Web Powered By kdjdhe
