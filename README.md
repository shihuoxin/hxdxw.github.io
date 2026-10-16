# 火芯の小窝

基于 Vue 3、Vite 和 Tailwind CSS 的个人主页。页面包含个人资料、SVG 问候气泡、天气胶囊、随天气变化的 SVG 二维动态背景、音乐播放器和一言。

项目为纯前端应用，可构建为静态文件部署。天气、定位、一言和歌单由浏览器直接请求第三方接口，当前无需配置 API Key 或自建后端。

## 功能

- **个人资料**：头像、昵称、简介；悬停头像或通过键盘聚焦时显示一体 SVG 问候气泡。
- **天气胶囊**：显示城市、天气与温度，提供半透明毛玻璃样式的设置面板。
- **定位与城市搜索**：首次通过 IP 定位，也可手动搜索城市或重新通过 IP 定位。
- **SVG 动态背景**：晴、多云、阴、雾、雨、雪、雷雨七种天气场景，以及未识别天气时的中性场景；支持昼夜配色、场景淡入切换和手动选择。
- **动态效果适配**：适配不同屏幕尺寸，页面隐藏时暂停背景动画，遵循系统的“减少动态效果”偏好。
- **音乐播放器**：接入 `xf-music-player`，加载云歌单，默认随机播放、音量 50%。
- **一言**：支持刷新、复制和百度搜索；接口不可用时使用本地语句。

## 技术栈

| 技术 | 用途 |
| --- | --- |
| Vue 3 | 页面组件与响应式状态 |
| Vite 7 | 本地开发与生产构建 |
| Tailwind CSS 4 | 布局、响应式与交互样式 |
| SVG / SMIL | 天气场景、粒子动画与问候气泡 |
| Lucide Vue Next | 界面图标 |
| xf-music-player | 音乐播放 |


### 天气与定位

1. 页面打开时显示“正在获取定位…”，并行尝试多个 IP 定位服务，按城市级结果定位。
2. 定位成功后，请求对应城市的天气。
3. 所有 IP 定位尝试失败后，显示“IP 定位失败，正在使用北京定位”，后台请求北京天气；用户也可以在定位期间手动选择城市。
4. 天气请求失败时显示错误，保留已定位的城市。

IP 定位使用支持浏览器跨域请求的 ZXINC、ipwho.is 和 ipapi.co，优先匹配本地城市目录。仅省份信息不会被当作城市；已识别城市但天气坐标补充失败时，保留城市并报告天气查询失败。首屏和设置中的“重新通过 IP 定位”使用同一条城市级 IP 定位链路。

悬停天气胶囊或通过键盘聚焦，可展开设置按钮。设置中可以：

- 输入城市名称，点击“定位”，再选择搜索结果。
- 点击“重新通过 IP 定位”。定位失败时显示错误；成功后将壁纸恢复为“跟随天气”。
- 从下拉菜单选择固定天气背景，或恢复“跟随天气”。手动选择城市会保留当前壁纸模式。

### 背景昼夜与状态

背景优先通过天气数据中的 `isDay` 字段判断昼夜，其次检查天气文字是否包含“夜”。缺少这些信息时显示白天场景。当前 Open-Meteo 返回昼夜字段，中国天气网和 Itboy 接口的结果未补充该字段。

城市与壁纸选择保存在当前页面内存中。刷新页面后会重新进行 IP 定位，并恢复自动壁纸模式。天气在首次进入、选城或重新定位时查询，当前没有定时刷新。

### 一言与音乐

悬停一言区域或通过键盘聚焦，可显示复制、刷新和搜索按钮。接口请求失败，或刷新间隔小于 2.2 秒时，会选择本地语句。

播放器当前使用网易云歌单 `7004942977`，并请求自动播放。浏览器可能要求先进行点击等交互，才允许播放音频。

## 目录结构

```text
.
├── .github/
│   └── workflows/deploy.yml        # 推送 main 后构建并发布到 GitHub Pages
├── CNAME                           # 自定义域名
├── public/
│   └── avatar.jpg                 # 头像
├── src/
│   ├── components/
│   │   ├── ProfileCard.vue        # 个人资料与 SVG 问候气泡
│   │   ├── WeatherWidget.vue      # 天气显示、定位与请求状态
│   │   ├── WeatherSettingsDialog.vue # 城市与壁纸设置
│   │   ├── WeatherBackground.vue  # 天气映射、SVG 场景与动画控制
│   │   ├── HitokotoWidget.vue     # 一言及其操作
│   │   └── MusicPlayer.vue        # 音乐播放器接入与销毁
│   ├── constants/
│   │   └── weather.js             # 壁纸选项与天气类型校验
│   ├── services/
│   │   ├── weather.js             # 定位、城市搜索与多源天气请求
│   │   └── hitokoto.js            # 一言请求、限频与本地兜底
│   ├── utils/
│   │   └── http.js                # 请求超时与响应解析
│   ├── App.vue                    # 页面布局与组件间状态传递
│   ├── main.js                    # 应用入口
│   └── style.css                  # 全局样式与背景明暗主题
├── index.html                     # 网页标题、描述与挂载节点
├── vite.config.js                # 构建配置与部署路径
├── package.json
└── package-lock.json
```

`WeatherWidget.vue` 将天气和壁纸模式传给 `App.vue`，再由 `WeatherBackground.vue` 绘制场景。背景组件返回明暗主题，页面据此调整个人资料和一言的文字颜色。

## 个性化配置

| 内容 | 修改位置 |
| --- | --- |
| 网页标题、描述、浏览器主题色 | `index.html` |
| 头像 | 替换 `public/avatar.jpg` |
| 昵称、简介、气泡文字与形状 | `src/components/ProfileCard.vue` |
| 个人导航 | `ProfileCard.vue` 中的导航占位代码，目前处于注释状态 |
| 歌单、默认音量、播放模式 | `src/components/MusicPlayer.vue` 的 `attributes` |
| 天气配色、SVG 图形、动画参数 | `src/components/WeatherBackground.vue` |
| 壁纸选项名称 | `src/constants/weather.js` |
| 定位和天气接口、常用城市目录 | `src/services/weather.js` |
| 一言接口和本地语句 | `src/services/hitokoto.js` |
| 全局颜色、天气胶囊和一言样式 | `src/style.css` |
| 部署路径 | `vite.config.js` 的 `base` |

修改音乐来源时，可调整 `apiUrl` 中的 `platform` 和 `playlistId`，或替换为播放器支持的歌单接口。当前项目没有统一的 `.env` 配置入口，上述选项直接在对应文件中维护。

## 部署

推送到 `main` 会触发 `.github/workflows/deploy.yml`。工作流使用 Vite 构建，再通过 GitHub Pages 官方 Actions 上传并发布构建产物。`pages` 并发组会让部署按顺序执行，避免多个运行同时创建 Pages deployment。

仓库的 **Settings → Pages → Build and deployment → Source** 需要选择 **GitHub Actions**。如果此前选择过分支发布，请先取消仍在进行的旧 Pages deployment，再重新运行最新工作流。

当前自定义域名为 `www.hxdxw.cn`，域名解析和 HTTPS 状态需要在 GitHub Pages 设置中确认。
