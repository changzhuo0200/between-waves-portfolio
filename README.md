# BETWEEN WAVES — Multi-page Homepage Demo

网站不需要安装依赖或运行构建命令。普通页面可直接打开；为了让本地视频稳定播放，建议在当前目录运行 `python3 -m http.server 8000`，再访问 `http://127.0.0.1:8000/index.html`。请保留全部 HTML、CSS、JavaScript 文件与 `assets/` 的相对位置。

交互说明：

- 移动指针可看到封套与唱片的轻微景深、悬浮与惯性倾斜。
- 点击中央方形封套或“点击进入卓畅的作品集”，进入完整 Selected Works 曲目页。
- 点击右侧彩胶进入 Side A；在曲目页可切换 Side A / Side B。
- Side A 使用暖调半透明蓝橙压片，Side B 使用冷调烟熏深蓝压片；切换时唱片会短暂翻面，减少动态效果模式下会立即切换。
- EXPLORE THE RECORD 展开或收回完整唱片套装，便于查看后方配件。
- 海报进入 Bonus Tracks；歌词本进入 Liner Notes；小档案卡进入 Credits。
- 每一首曲目都打开独立项目 URL，不再跳转到首页下方内容。
- 项目内页使用纵向滚动的歌词本跨页结构，视频采用本地压缩副本、原生播放控件与 `preload="metadata"`，不会自动播放。
- 移动端 MENU 是可点击的全屏纸张插页，可通过 CLOSE、Esc、导航链接或背景关闭。
- 顶部导航与右侧唱片目录进入同一套真实页面。
- `BACK TO THE RECORD` 返回首页，并恢复已展开的唱片套装。
- 开启系统“减少动态效果”后，持续漂移、倾斜、模糊与位移动画会自动关闭。

GitHub Pages 会在 `main` 分支更新后通过 `.github/workflows/deploy-pages.yml` 自动发布。内部审稿、QA 截图、临时 PDF 与超过 GitHub 单文件限制的视频母版不会进入公开仓库；页面使用 `assets/videos/` 中的 public 版本。

