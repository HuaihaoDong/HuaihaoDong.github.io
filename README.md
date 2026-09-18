# 上线步骤（三步，全程零元）

## 第 0 步：先确认域名状态

阿里云控制台 → 域名 → 域名列表，看状态是不是「正常」。
如果是 Serverhold，说明实名认证没过，先提交身份证，通过后再继续。

## 第 1 步：建仓库并上传

1. 注册 GitHub，新建仓库，仓库名必须叫 `HuaihaoDong.github.io`（用户名部分一字不差）
2. 把本目录下 4 个文件全部上传到仓库根目录：

```
index.html    页面主体
style.css     样式
CNAME         自定义域名（改！）
README.md     就是这个文件
```

3. 打开 `CNAME`，把里面的 `www.donghuaihao.com` 换成你自己的域名，例如 `www.donghuaihao.com`
4. 打开 `index.html`，把 GitHub 链接和邮箱换成你自己的，项目卡片改成你真实的东西

## 第 2 步：开启 GitHub Pages

仓库 → Settings → Pages → Source 选 `main` 分支、根目录 `/` → Save。
等一两分钟，访问 `https://HuaihaoDong.github.io` 应该就能看到页面了。
勾上同一页里的 **Enforce HTTPS**。

## 第 3 步：阿里云解析里加记录

| 主机记录 | 记录类型 | 记录值 |
|---|---|---|
| `www` | CNAME | `HuaihaoDong.github.io` |
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |

NS 记录不用动，阿里云默认的就是。TTL 用默认 600 秒。
生效后访问 `https://www.donghuaihao.com` 即可。

## 常见情况

- **打不开**：解析最长要等 10 分钟；再不行用 `ping www.donghuaihao.com` 看解析是否生效
- **提示证书错误**：Enforce HTTPS 需要等 GitHub 签发证书，最多 24 小时
- **国内慢**：服务器在境外，属正常现象；把图片压小、别加外链脚本能明显改善
- **以后想改内容**：改完 `index.html` 提交到 GitHub，一两分钟后自动生效，不用重启任何东西
