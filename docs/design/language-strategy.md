# NotionNext 多语言实现方案

## 背景

NotionNext博客系统支持多语言功能，但在某些场景下的语言重定向策略需要优化。本文档详细说明了多语言实现的完整方案。

## 一、核心原则

1. **明确性**：语言选择应该是明确的，而不是基于推测
2. **一致性**：保持整站的语言体验一致
3. **可预期性**：用户应该能预期并控制自己的语言环境
4. **SEO友好**：有利于搜索引擎理解和收录

## 二、URL结构设计

```
# 根域名访问
example.com                 -> 默认语言版本
example.com/en             -> 英文版本首页
example.com/zh-CN          -> 中文版本首页

# 文章页面
example.com/article/xxx    -> 默认语言版本文章
example.com/en/article/xxx -> 英文版本文章
```

## 三、语言决策策略

### 1. 根域名访问策略
```javascript
ROOT_LANG_STRATEGY: {
  ENABLE_AUTO_REDIRECT: false,
  REDIRECT_PRIORITY: [
    'url_path',        // URL路径中的语言标识
    'user_preference', // 用户之前的选择（localStorage）
    'default_lang'     // 站点配置的默认语言
  ]
}
```

### 2. 站内导航策略
```javascript
NAVIGATION_STRATEGY: {
  ENABLE_AUTO_REDIRECT: true,
  REDIRECT_PRIORITY: [
    'url_path',        // URL路径中的语言标识
    'session_context', // 当前会话的语言上下文
    'user_preference', // 用户之前的选择
    'default_lang'     // 站点配置的默认语言
  ]
}
```

### 3. 直接着陆策略
```javascript
DIRECT_ACCESS_STRATEGY: {
  ENABLE_AUTO_REDIRECT: true,
  REDIRECT_PRIORITY: [
    'url_path',        // URL路径中的语言标识
    'user_preference', // 用户之前的选择
    'default_lang'     // 站点配置的默认语言
  ]
}
```

## 四、配置项设计

```javascript
const LANGUAGE_CONFIG = {
  // 默认语言设置
  DEFAULT_LANGUAGE: {
    code: 'zh-CN',
    name: '简体中文',
    fallback: 'en-US'  // 当前语言内容不存在时的后备语言
  },

  // 支持的语言列表
  SUPPORTED_LANGUAGES: ['zh-CN', 'en-US'],

  // 用户偏好设置
  USER_PREFERENCE: {
    storage_key: 'preferred_language',
    expires_days: 30
  },

  // SEO相关配置
  SEO: {
    use_hreflang: true,          // 是否使用hreflang标签
    use_alternate_links: true,   // 是否在头部添加alternate链接
    x_default: 'zh-CN'          // x-default语言设置
  },

  // 重定向行为
  REDIRECT: {
    status_code: 301,           // 重定向状态码
    preserve_query: true,       // 是否保留查询参数
    preserve_hash: true         // 是否保留URL hash
  }
}
```

## 五、关键实现细节

### 1. 语言切换处理
```javascript
function handleLanguageSwitch(newLang) {
  // 1. 验证语言代码
  if (!LANGUAGE_CONFIG.SUPPORTED_LANGUAGES.includes(newLang)) {
    return;
  }

  // 2. 构建新URL
  const currentPath = window.location.pathname;
  const segments = currentPath.split('/').filter(Boolean);
  
  if (isLanguageCode(segments[0])) {
    segments.shift();
  }
  
  const newPath = `/${newLang}/${segments.join('/')}`;
  
  // 3. 保存用户偏好
  saveLanguagePreference(newLang);
  
  // 4. 路由跳转
  router.push(newPath);
}
```

### 2. SEO优化
```html
<!-- 在头部添加语言元数据 -->
<head>
  <link rel="alternate" hreflang="zh-CN" href="https://example.com/zh-CN/article/xxx" />
  <link rel="alternate" hreflang="en-US" href="https://example.com/en/article/xxx" />
  <link rel="alternate" hreflang="x-default" href="https://example.com/article/xxx" />
</head>
```

### 3. 降级处理
```javascript
function handleLanguageFallback(requestedLang, content) {
  if (!content) {
    const fallbackLang = LANGUAGE_CONFIG.DEFAULT_LANGUAGE.fallback;
    return {
      content: getFallbackContent(fallbackLang),
      showFallbackNotice: true,
      originalLang: requestedLang,
      usedLang: fallbackLang
    };
  }
  return { content, showFallbackNotice: false };
}
```

## 六、核心设计决策

### 1. 为什么移除浏览器语言检测？

在根域名访问时，我们选择不使用浏览器语言进行自动重定向。

**原有方案**：
- 检测浏览器语言设置
- 根据语言设置自动重定向到对应语言版本
- 参考了一些国际化网站的实践

**存在的问题**：
1. 违背用户意图：
   - 用户直接访问主域名可能有明确的语言预期
   - 自动重定向可能导致困惑和不必要的跳转
2. 与站点配置冲突：
   - 站点管理者通过默认语言配置表达了明确意图
   - 忽略这个配置违背了站点运营策略
3. SEO影响：
   - 动态语言切换可能影响搜索引擎的理解
   - 不同爬虫可能获得不同的语言版本

**最终决策**：
- 仅使用：URL路径 > 用户选择 > 站点默认语言
- 提供清晰的语言切换界面
- 记住用户的语言选择

### 2. URL路径 vs URL参数？

在表达语言版本时，我们选择使用URL路径而不是URL参数。

**路径方式**：`example.com/en/article/123`
**参数方式**：`example.com/article/123?lang=en`

**决策依据**：
1. **持久性考虑**
   - 路径：✓ 表达资源的永久性特征
   - 参数：✗ 通常用于临时或可选设置

2. **SEO影响**
   - 路径：✓ 搜索引擎更好理解不同语言版本
   - 参数：✗ 可能被视为同一内容的变体

3. **缓存效率**
   - 路径：✓ CDN和浏览器更容易基于路径缓存
   - 参数：✗ 参数可能影响缓存策略

4. **用户体验**
   - 路径：✓ 用户可以直观看到语言环境
   - 参数：✗ 不够直观，分享时可能丢失

### 3. 为什么区分站内导航和直接着陆？

我们为不同的访问场景设计了不同的语言策略。

**场景差异**：
1. **站内导航**
   - 用户已在特定语言环境中浏览
   - 存在明确的会话上下文
   - 期望保持一致的语言体验

2. **直接着陆**
   - 可能来自搜索引擎或外部链接
   - 没有先前的语言上下文
   - 需要考虑更多默认行为

**策略区别**：
- 站内导航：优先保持当前会话的语言上下文
- 直接着陆：更多依赖URL路径和用户历史选择

### 4. 常见问题（FAQ）

**Q1: 为什么不同时支持路径和参数方式？**
- 增加了系统复杂性
- 可能导致重复内容问题
- 不利于SEO和缓存优化
- 建议统一使用路径方式

**Q2: 用户语言选择应该保存多久？**
- 默认30天
- 可通过配置调整
- 考虑到用户可能在不同场景下有不同需求
- 提供清除选择的选项

**Q3: 如何处理内容不存在的情况？**
- 使用配置的fallback语言
- 显示清晰的提示信息
- 提供切换到可用语言版本的选项
- 记录缺失内容以便后续补充

**Q4: 搜索引擎如何处理多语言版本？**
- 使用hreflang标签指明语言关系
- 设置清晰的x-default语言
- 避免混合使用不同的URL结构
- 确保语言版本间的一致性链接

## 七、实现步骤

1. **配置更新**
   - 更新 `blog.config.js` 添加新的语言配置项
   - 确保配置向后兼容

2. **路由调整**
   - 修改 Next.js 路由配置支持新的URL结构
   - 实现语言中间件处理重定向逻辑

3. **组件开发**
   - 语言切换组件
   - 语言提示组件（当使用降级内容时）
   - SEO相关组件

4. **工具函数**
   - 语言检测和验证
   - URL处理
   - 用户偏好管理

## 八、注意事项

1. **性能考虑**
   - 服务端完成语言检测和重定向
   - 适当使用缓存减少重定向判断开销
   - 避免客户端重定向导致的闪烁

2. **兼容性处理**
   - 保持对旧版本URL格式的支持
   - 提供平滑的迁移方案
   - 处理特殊字符和编码问题

3. **监控和分析**
   - 添加语言相关的数据统计
   - 监控重定向性能
   - 收集用户语言偏好数据

## 参考资料

1. [MDN - 网站国际化最佳实践](https://developer.mozilla.org/zh-CN/docs/Web/International)
2. [Google搜索中心 - 国际化网站管理](https://developers.google.com/search/docs/advanced/crawling/managing-multi-regional-sites)
