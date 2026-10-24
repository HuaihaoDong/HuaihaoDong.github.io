# Tiger Captain · 董怀昊的个人站

线上地址：https://www.donghuaihao.com
源码仓库：HuaihaoDong/HuaihaoDong.github.io
部署：GitHub Pages，main 分支根目录。纯 HTML / CSS / JavaScript，内容由 JSON 驱动，无构建步骤、无服务端。

## 页面与内容

| 页面 | 内容来源 |
| --- | --- |
| index.html | 星空、粒子标题与个人入口 |
| about.html | 个人介绍、领队、兴趣、科研、朋友 |
| tools.html | 开源工具精选与常用工具外链 |
| story.html | activities.json、letter.json |
| group.html | group-events.json、海报与群二维码 |
| trek.html | trek.json |
| fitness.html | fitness.json |
| football.html | football.json、football-matches.json |
| reviews.html | reviews.json（评价截图展示） |
| detail.html | 根据 id 读取上述活动数据源中的记录 |

公共文件：common.css、nav.js、tiger.js；相册组件：album.css、album.js。

## 照片地址与本地预览

photos/、reviews/ 和老虎精灵图位于本站仓库。pics/、pics2/、pics3/、pics4/ 是同一账号的独立 GitHub Pages 项目仓库，在自定义域名下保留各自路径。不能仅因为本地缺少同名目录就判定线上图片失效。

本地运行（Python 3）：

```powershell
python scripts/preview.py
```

打开 http://127.0.0.1:8765 。预览服务只监听本机，把独立图床请求重定向至线上原地址；此部分预览需要联网。按 Ctrl+C 停止。

## 修改与检查

修改前先同步 main。保留每个活动的唯一 id，照片条目使用 src（原图）和 thumb（缩略图）。letter.json 尚未填写正文，信件内容由本人提供。

提交前运行（Python 3 与 Node.js）：

```powershell
python scripts/check-site.py
node --test scripts/animation.test.mjs
git -c core.whitespace=cr-at-eol diff --check
```

检查覆盖 HTML / JSON、脚本语法、本地资源、锚点、活动详情 id，以及动画暂停和恢复。独立图床地址只分类记录，未全量发起线上请求；外链可用性与真实触屏手势仍需人工抽查。

## 部署与费用

合并到 main 后由现有 GitHub Pages 自动部署。域名与阿里云 DNS 配置保持原有设置，CNAME 为 www.donghuaihao.com，不修改 NS。当前站点不需要付费服务或新增后端。

第一轮维护完善了手机导航与关于我布局、键盘操作、相册失败回退、后台动画暂停和详情参数校验；保留原有星空、粒子文字和老虎形象。
