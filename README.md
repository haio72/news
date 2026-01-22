# NewsPulse | 智能新闻聚合器

一个纯静态的、可配置的新闻聚合页面，通过编辑 JSON 文件即可轻松管理新闻源和收藏网站。

## ✨ 特性

- 🔧 **零依赖配置** - 只需编辑 `feeds.json` 和 `bookmarks.json` 即可管理内容
- 🌐 **纯静态部署** - 支持 GitHub Pages / Cloudflare Pages / Netlify
- ⭐ **收藏网站** - 快速访问常用的网站和工具
- 🎨 **优雅设计** - 编辑杂志风格，深色主题，3D 悬停效果
- 🚀 **跨域解决** - 使用 RSS2JSON API 代理，无需后端
- 📱 **响应式布局** - 完美适配桌面、平板、手机
- 🏷️ **分类筛选** - 按类别快速过滤新闻源
- ⚡ **实时刷新** - 一键刷新所有新闻源
- 📂 **折叠功能** - 可收起收藏区域，节省空间

## 📁 项目结构

```
news-aggregator/
├── index.html          # 主页面（包含所有 CSS 和 JavaScript）
├── feeds.json          # 新闻源配置文件（你需要编辑这个）
├── bookmarks.json      # 收藏网站配置文件（你需要编辑这个）
└── README.md           # 说明文档
```

## 🚀 快速开始

### 方法一：本地测试

1. 克隆或下载项目
2. 由于浏览器 CORS 限制，需要使用本地服务器：

```bash
# 使用 Python 3
python -m http.server 8000

# 或使用 Node.js
npx serve

# 或使用 PHP
php -S localhost:8000
```

3. 打开浏览器访问 `http://localhost:8000`

### 方法二：部署到 GitHub Pages

1. 将项目上传到 GitHub 仓库
2. 进入仓库 **Settings** → **Pages**
3. 在 **Source** 中选择 `Deploy from a branch`
4. 选择 `main` 分支和 `/root` 目录
5. 点击 **Save**
6. 几分钟后访问 `https://你的用户名.github.io/仓库名`

### 方法三：部署到 Cloudflare Pages

1. 将项目上传到 GitHub 仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入 **Workers & Pages** → **Create application** → **Pages**
4. 连接你的 GitHub 仓库
5. 构建设置留空（纯静态项目）
6. 点击 **Save and Deploy**

## ⚙️ 配置新闻源

编辑 `feeds.json` 文件：

```json
{
  "feeds": [
    {
      "name": "机器之心",
      "rss": "https://www.jiqizhixin.com/rss",
      "description": "专业的人工智能媒体",
      "category": "AI"
    },
    {
      "name": "TechCrunch",
      "rss": "https://techcrunch.com/feed/",
      "description": "科技创业与投资新闻",
      "category": "Tech"
    }
  ],
  "settings": {
    "articlesPerFeed": 5,
    "refreshInterval": 30
  }
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 新闻源名称 |
| `rss` | string | ✅ | RSS 订阅地址 |
| `description` | string | ❌ | 简短描述 |
| `category` | string | ❌ | 分类（用于筛选） |

## ⭐ 配置收藏网站

编辑 `bookmarks.json` 文件来管理你的常用网站：

```json
{
  "categories": [
    {
      "name": "AI 工具",
      "icon": "🤖",
      "bookmarks": [
        {
          "name": "ChatGPT",
          "url": "https://chat.openai.com",
          "description": "OpenAI 的 AI 聊天助手"
        },
        {
          "name": "Claude",
          "url": "https://claude.ai",
          "description": "Anthropic 的 AI 助手"
        }
      ]
    }
  ]
}
```

### 字段说明

**分类层级**：
- `name`: 分类名称（必填）
- `icon`: Emoji 图标（选填，默认 📁）
- `bookmarks`: 网站列表数组

**网站条目**：
- `name`: 网站名称（必填）
- `url`: 网站链接（必填）
- `description`: 简短描述（选填）

### 添加收藏网站的示例

```json
{
  "categories": [
    {
      "name": "社交媒体",
      "icon": "💬",
      "bookmarks": [
        {
          "name": "Twitter",
          "url": "https://twitter.com",
          "description": "实时信息流"
        },
        {
          "name": "YouTube",
          "url": "https://youtube.com",
          "description": "视频平台"
        }
      ]
    },
    {
      "name": "开发工具",
      "icon": "🛠️",
      "bookmarks": [
        {
          "name": "GitHub",
          "url": "https://github.com",
          "description": "代码托管平台"
        }
      ]
    }
  ]
}
```

### 添加新闻源和收藏

**添加新闻源**：
1. 找到你想要的网站的 RSS 链接（通常在网站页脚）
2. 在 `feeds.json` 的 `feeds` 数组中添加新对象
3. 保存文件并刷新页面

**添加收藏网站**：
1. 打开 `bookmarks.json`
2. 在 `categories` 数组中添加新分类或网站
3. 保存文件并刷新页面

### 常用 RSS 源

**中文媒体**
- 36氪: `https://36kr.com/feed`
- 机器之心: `https://www.jiqizhixin.com/rss`
- InfoQ: `https://www.infoq.cn/feed`
- 少数派: `https://sspai.com/feed`

**国际媒体**
- TechCrunch: `https://techcrunch.com/feed/`
- The Verge: `https://www.theverge.com/rss/index.xml`
- Wired: `https://www.wired.com/feed/rss`
- Hacker News: `https://news.ycombinator.com/rss`

## 🎨 自定义样式

所有样式都在 `index.html` 的 `<style>` 标签中，你可以修改 CSS 变量：

```css
:root {
    /* 配色方案 */
    --bg-primary: #0f0f0f;        /* 主背景 */
    --accent-primary: #f59e0b;     /* 强调色 */

    /* 字体 */
    --font-display: 'Playfair Display', serif;
    --font-body: 'JetBrains Mono', monospace;
}
```

### 更改主题色

将 `--accent-primary` 改为你喜欢的颜色：

```css
--accent-primary: #3b82f6;  /* 蓝色 */
--accent-primary: #10b981;  /* 绿色 */
--accent-primary: #ec4899;  /* 粉色 */
```

### 更换字体

1. 访问 [Google Fonts](https://fonts.google.com/)
2. 选择你喜欢的字体
3. 替换 `<link>` 标签和 CSS 变量

## 🔧 工作原理

1. **读取配置** - JavaScript 从 `feeds.json` 加载新闻源列表
2. **获取 RSS** - 通过 RSS2JSON API 将 RSS 转为 JSON（解决跨域）
3. **渲染卡片** - 动态生成新闻卡片 HTML
4. **交互功能** - 分类筛选、刷新、悬停效果

### RSS2JSON API

项目使用 `https://api.rss2json.com/v1/api.json` 作为代理：
- ✅ 免费版：每天 10,000 次请求
- ✅ 自动处理 CORS
- ✅ 支持 RSS/Atom 格式

如需更高配额，可注册 [RSS2JSON](https://rss2json.com/) 获取免费 API Key。

## 🐛 故障排查

### 页面显示"加载失败"

**问题**：无法读取 `feeds.json`

**解决方案**：
- 确保文件名为 `feeds.json`（不是 `feeds.json.txt`）
- 使用本地服务器测试（不要直接双击 HTML 文件）
- 检查浏览器控制台（F12）查看具体错误

### 某些新闻源显示"暂无新闻"

**原因**：
- RSS 地址可能失效
- RSS2JSON API 无法解析该源
- 该源不提供标准 RSS 格式

**解决方案**：
1. 访问 [RSS2JSON 在线工具](https://rss2json.com/) 测试 RSS 地址
2. 尝试替换为其他 RSS 源
3. 某些网站需要注册才能获取 RSS

### 刷新后仍显示旧内容

**原因**：浏览器或 CDN 缓存

**解决方案**：
- 硬刷新：Ctrl + Shift + R (Windows) / Cmd + Shift + R (Mac)
- Cloudflare Pages：在设置中禁用缓存

## 📊 性能优化建议

1. **控制新闻源数量** - 建议不超过 20 个
2. **使用付费 API Key** - 提升请求速率限制
3. **启用 CDN 缓存** - 对静态资源启用长期缓存
4. **压缩图片** - 如果添加图片功能

## 🚀 进阶功能

### 添加搜索功能

在 `index.html` 的控制栏中添加：

```html
<input type="text" id="searchInput" placeholder="搜索文章...">
```

然后添加 JavaScript 搜索逻辑。

### 添加本地存储

保存用户的分类偏好：

```javascript
localStorage.setItem('selectedCategory', currentCategory);
```

### 添加导出功能

将配置导出为 OPML 文件（RSS 阅读器通用格式）。

## 📄 许可证

MIT License - 自由使用、修改、分发

## 🙏 致谢

- [RSS2JSON](https://rss2json.com/) - 提供 RSS 转 JSON API
- [Google Fonts](https://fonts.google.com/) - 提供开源字体
- [Obsidian](https://obsidian.md/) - 灵感来源

---

💡 **提示**：遇到问题？检查浏览器控制台（F12）查看详细错误信息。
