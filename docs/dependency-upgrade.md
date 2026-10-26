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

Yarn 全量审计按依赖路径重复计数：原始 391 条（6 critical、256 high、112 moderate、17 low），更新后 295 条（0 critical、209 high、72 moderate、14 low）。去重后公告数量为 124 → 48，涉及包数量为 28 → 17。开发工具链仍有告警，不能将此次升级表述为全量安全审计通过。

生产依赖审计仍有两个不同公告：

1. `@clerk/nextjs@5.7.6 → @clerk/clerk-react@5.12.0`：高风险 [GHSA-w24r-5266-9c3c](https://github.com/advisories/GHSA-w24r-5266-9c3c)，涉及组合组织、计费或重新验证条件时的授权校验。修复需要 clerk-react 5.61.6 及以后，超出当前 SDK 的精确依赖声明；本轮不强行覆盖。启用或发布 Clerk 权限保护相关功能前，应升级兼容 SDK 并验证实际认证流程。
2. `react-notion-x@7.7.1 → katex@0.16.22`：低风险 [GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7)，既有原型污染可能绕过信任限制。修复版本为 0.18.2，超出渲染器声明的 `^0.16.21`；需单独验证渲染器升级。

真实 Notion 数据、Clerk 登录、第三方集成和生产部署尚未验收。发布需另行确认，并结合实际启用功能评估上述风险。


### 已授权发布尝试与阻断

用户于 2026-10-27 确认发布，升级候选已推送并创建 [PR #3](https://github.com/dongzhenye/NotionNext/pull/3)，目标仍为 `deploy`。尚未合并或切换正式域名。

首个 Vercel Preview `dpl_7QM8KumcRKqWWNj2bd7m5Ca2w6zq` 构建失败：真实 Notion `loadPageChunk` 请求返回 403 Forbidden，分类页随后因缺少数据报错。本地用相同版本的 Notion SDK 只读请求也返回 403；未修改数据源权限、添加认证凭据、写入 Notion 或用空数据绕过构建。

云端日志另发现 `engines.node >=20` 覆盖项目的 Node 22 设置并自动选择 Node 24，现收紧为 `22.x`，与 `.nvmrc` 及本地已验证环境对齐。该单行修正经独立复核、冻结安装通过；不将它视为已解决数据源 403。

发布前正式站点的首页文章列表为空、标题为 `undefined | undefined`，三个 RSS 文章地址均返回无正文的 loading 页面；这些现象已在上线前记录，不归因于未上线的候选。生产仍保留原部署 `dpl_EsAQUMNv39nwi6amPXU7jgxBzrGb`。后续先恢复并核验现有内容源读取，再继续发布；不借依赖升级扩大为内容源迁移或权限重构。
