# 依赖升级记录

## 2026-10-27：deploy 分支升级至 Next.js 15

基线为 `origin/deploy@3e01368`，不合入上游 `main`，不涉及 Astro 博客。验证使用 Node.js 22.23.4、Yarn 1.22.22 和隔离工作区；本地升级验证阶段未推送、发布或调用真实 Notion/Clerk 服务；后续经用户批准的发布尝试见文末。

### 变更范围

- Next.js、`@next/bundle-analyzer`、`eslint-config-next` 对齐 15.5.28。
- 保留 Pages Router、React/React DOM 18.3.1、ESLint 8 和 TypeScript ESLint 7.18；后者通过解析约束保持单一兼容版本，避免重复插件实例。
- Clerk 保持 5.x，仅更新至修复中间件绕过问题的 5.7.6。React Hooks lint 插件按 Next 配置要求更新至 5.2。
- axios 更新至 1.20.0，移除原来无主版本上限的解析规则；PostCSS 更新至 8.5.31，包括 Next 内部固定版本的同主版本安全覆盖。
- 显式声明源码已使用的 lodash 4.18.1，解决升级后不再间接安装该包导致的构建缺失。不修改 lodash 调用或页面逻辑。
- 定向更新 form-data 4.0.6、js-cookie 3.0.8、tar-fs 2.1.5；按父依赖分别约束 analyzer 的 ws 7.5.13 与 jsdom 的 ws 8.22.0，避免混用主版本。
- 移除 Next.js 15 不再接受的 `swcMinify`；保留 Next 生成的类型入口更新，显式设置其要求的 TypeScript `ES2017` 编译目标。

### 可复现性与验证边界

原基线的 manifest 声明 `next@14.2.35`，但锁文件只有旧范围 `next@^14.2.30`，原始冻结安装失败。旧版对照使用在隔离目录内重新解析的 14.2.35 参考环境，不声称原锁文件可复现。

候选正常安装成功，随后通过 `yarn install --frozen-lockfile --non-interactive --ignore-scripts`。首次安装已运行生命周期脚本，冻结复核不重复运行。

- 升级前后 TypeScript 检查均通过。
- 升级前后 lint 均为 9 个错误、64 个警告；仅 Next 图片提示文案变化，无新增规则失败。原有 `ignoreDuringBuilds` 未调整，构建通过不等于 lint 通过。
- 升级前后 Jest 均为 3 项失败、21 项通过；另一个 LazyImage 测试文件在主题 mock 加载时失败。三个断言失败分别涉及邮件地址、URL、XSS 清理；本轮不改变这些既有业务行为。
- 使用固定 Notion 数据夹具、禁用真实数据源的 hexo 离线构建通过；32 个 HTML 路由的可见文本和链接与基线一致，公开文章及正文可见、草稿不可见，外网请求计数为 0。

- 本地 HTTP 验收：首页、文章、归档、RSS、sitemap 均返回 200；浏览器从首页进入文章的客户端导航、标题与正文正常。清除基线首轮失败夹具遗留的生成文件缓存并重建后，双方 RSS 的一条公开文章在 title、link、正文三个字段上相同，均不含草稿；不据此声称所有 HTTP 响应体与基线逐字相同。
- 草稿路径不暴露正文或标记，但返回 200 的软 404，基线同样如此；本轮不改变路由语义。
- 基线与候选浏览器均复现本地 SpeedInsights 脚本的 HTML 解析错误，以及同一个外部 Live2D 脚本的 `undefined[0]` 错误。因此不声称浏览器控制台零错误或第三方集成完整通过。

### 安全审计与剩余风险

Yarn 全量审计按依赖路径重复计数：原始 391 条（6 critical、256 high、112 moderate、17 low），最终 315 条（0 critical、209 high、90 moderate、16 low）。Notion 三件套对齐 7.10.0 后包含 2026-10-27 新公布、尚无修复版本的 Jest/deepmerge 开发链低危公告；本轮不强制覆盖。开发工具链仍有告警，不能将此次升级表述为全量安全审计通过。

生产依赖审计仍有两个不同公告：

1. `@clerk/nextjs@5.7.6 → @clerk/clerk-react@5.12.0`：高风险 [GHSA-w24r-5266-9c3c](https://github.com/advisories/GHSA-w24r-5266-9c3c)，涉及组合组织、计费或重新验证条件时的授权校验。修复需要 clerk-react 5.61.6 及以后，超出当前 SDK 的精确依赖声明；本轮不强行覆盖。启用或发布 Clerk 权限保护相关功能前，应升级兼容 SDK 并验证实际认证流程。
2. `react-notion-x@7.10.0 → katex@0.16.21`：低风险 [GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7)，既有原型污染可能绕过信任限制。上游 7.10.0 精确锁定 KaTeX 0.16.21，比此分支原解析的 0.16.22 低一个补丁版，但两者均受影响。修复版本为 0.18.2，超出渲染器的精确依赖声明；需单独验证渲染器升级。

真实 Notion 数据、Clerk 登录、第三方集成和生产部署尚未验收。发布需另行确认，并结合实际启用功能评估上述风险。


### 已授权发布尝试与阻断

用户于 2026-10-27 确认发布，升级候选已推送并创建 [PR #3](https://github.com/dongzhenye/NotionNext/pull/3)，目标仍为 `deploy`。尚未合并或切换正式域名。

首个 Vercel Preview `dpl_7QM8KumcRKqWWNj2bd7m5Ca2w6zq` 构建失败：真实 Notion `loadPageChunk` 请求返回 403 Forbidden，分类页随后因缺少数据报错。本地用相同版本的 Notion SDK 只读请求也返回 403；未修改数据源权限、添加认证凭据、写入 Notion 或用空数据绕过构建。

云端日志另发现 `engines.node >=20` 覆盖项目的 Node 22 设置并自动选择 Node 24，现收紧为 `22.x`，与 `.nvmrc` 及本地已验证环境对齐。该单行修正经独立复核、冻结安装通过；不将它视为已解决数据源 403。

发布前正式站点的首页文章列表为空、标题为 `undefined | undefined`，三个 RSS 文章地址均返回无正文的 loading 页面；这些现象已在上线前记录，不归因于未上线的候选。生产仍保留原部署 `dpl_EsAQUMNv39nwi6amPXU7jgxBzrGb`。

2026-11-04 根因复现确认：旧 `www.notion.so/api/v3` 端点在 Node 请求未带 `User-Agent` 时返回 403；同一页面仅增加标识性请求头即成功，`app.notion.com/api/v3` 也能直接读取。本轮只采用上游已使用的最小修复：

- 默认端点改为 `https://app.notion.com/api/v3`，保留 `API_BASE_URL` 环境变量覆盖能力。
- 向 `notion-client` 的 `ofetchOptions` 注入项目标识型 `User-Agent`，不增加私人 Notion token，不修改页面分享权限。
- `notion-client`、`notion-utils`、`react-notion-x` 从 7.7.1 对齐到上游的 7.10.0；7.7.1 能读取根页面，但不能完整处理当前 collection query。
- 移植上游的最小 record-map 解包适配，将新的 `{ spaceId, value: { value, role } }` 结构恢复为该分支数据管道使用的 `{ value }` 形式。适配同时覆盖站点列表、单篇文章和批量补拉 block，使根页属性清理、URL 预处理与父子 block 关系仍按旧语义执行。不移植上游的站点架构、缓存、OAuth 或主题变更。
- 新增回归测试保护端点和请求头的组合；测试在修复前按预期失败，修复后通过。
- 新增 record-map 双层包装回归测试；测试在适配器存在前因模块缺失而失败，适配后通过。

修复后的冻结安装、TypeScript 检查和离线内容构建通过；离线构建读取夹具 42 次、外发请求 0，公开文章与正文生成、草稿排除四项检查全部通过。完整 Jest 仍为既有 3 项断言失败和 LazyImage 套件加载失败；新增 4 项回归测试通过。使用真实公开内容源的 Node 22 本地生产构建生成 90/90 个静态页面并退出 0；该构建仅读取 Notion，未使用私人 token。英文内容源的个别 `queryCollection` 请求仍返回 403，`notion-client` 降级处理后未阻断构建；需在 Preview 抽样英文页面，不将 90/90 等同于所有 collection view 完整。

适配器在站点数据转换、单篇文章转换和批量补拉入口执行。最外层缓存若命中过去保存的双层包装，仍可绕过转换器；新 Vercel 构建未配置 Redis 且不复用本地 `data.json`，不受旧缓存影响。其他持久化环境在升级时应失效 Notion 数据缓存。待新 Vercel Preview 使用真实内容源验证成功后再合并发布。

Next.js 15 预览另暴露 RSS 时序问题：首页 `getStaticProps` 启动异步 `generateRss` 后立即返回，Vercel 在文件写完前已收集 `public/`，导致 `/rss/feed.xml` 落入动态页面路由。现在显式等待 RSS 生成，并用先失败后通过的回归测试保护该构建边界。
