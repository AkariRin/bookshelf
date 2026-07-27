# Bookshelf

跑团日志阅读器。读取 [trpg](../trpg) 生成的 `.story` 归档，在浏览器中渲染发言时间线、检定卡片与人物卡快照。

## 特性

- **离线优先**：PWA 应用，安装后可离线使用
- **隐私保护**：默认不加载远程头像，避免向第三方 CDN 暴露阅读行为
- **加密支持**：自动识别加密归档并提示输入口令
- **大归档优化**：虚拟滚动处理数千条目，worker 线程解包避免主线程掉帧
- **无 HTML 注入风险**：正文一律作纯文本渲染，不解释任何标记

## 使用方式

### 本地文件

拖入或选择 `.story` 文件即可打开。文件只在本次浏览中保留在内存中，不会被保存或上传。

### 远程存储（可选）

在项目根目录创建 `.env` 文件，配置 Cloudflare R2 的公开读取端点：

```bash
cp .env.example .env
# 编辑 .env，填入你的 R2 公开端点 URL
```

配置后可在首页输入日志名称（不含 `.story` 后缀）直接打开。需在 R2 侧配置 CORS 允许本站域名。

## 开发

```bash
pnpm install
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm preview      # 预览生产构建
pnpm test         # 运行单元测试
pnpm lint         # 代码检查
pnpm type-check   # 类型检查
```

## 技术栈

- **框架**：Vue 3 + TypeScript + Vite
- **UI**：Vuetify 4 + Material Design Icons
- **状态**：Pinia + pinia-plugin-persistedstate
- **路由**：Vue Router
- **测试**：Vitest + @vue/test-utils
- **PWA**：vite-plugin-pwa + Workbox
- **解析**：[@aemeath-projects/trpg/story](../trpg)，msgpack + gzip 容器，Web Worker 解包

## 设计决策

### 为何不内置归档管理

本应用刻意不提供「归档库」功能（上传、列表、收藏等）：

1. **隐私**：日志内容敏感，托管在中心化服务会产生额外的信任要求与合规义务
2. **职责分离**：管理归档是存储层的事，阅读器只负责渲染已有字节
3. **灵活性**：用户可自行选择存储方式（本地文件、自建 R2、私有 NAS 等），阅读器通过统一的 `.story` 格式对接

### 为何默认不加载远程头像

`actor.avatar` 字段存放的是指向聊天平台 CDN 的 URL。加载它会：

- 向第三方暴露「谁在什么时间阅读了这份日志」
- 离线时必然失败

故默认只渲染名字首字作为占位，远程加载需用户在设置中显式开启。

### 为何正文不支持 Markdown / HTML

归档格式规范明确「只存纯文本」。引入任何标记渲染都会成为注入通道，且无对应收益——跑团日志的正文就是玩家原始发言，不需要也不该支持富文本。

### 为何用 Worker 解包

`unpackStory` 内部是 gunzipSync + msgpack 同步解码，在主线程直接调用会在大归档（数千条目）上造成掉帧。加密路径还要跑 600k 次 PBKDF2 迭代，更不能阻塞 UI。此外，解析不可信字节流天然适合隔离在独立上下文中。

## 许可

MIT
