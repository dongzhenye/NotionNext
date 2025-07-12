# NotionNext 博客版本更新指南

## 项目架构说明

我使用 NotionNext 架构搭建个人博客，项目采用以下架构：

- **托管平台**: GitHub
- **部署平台**: Vercel
- **分支管理策略**:
  - `main` 分支：用于同步上游（tangly1024/NotionNext）的更新，保持原始代码
  - `deploy` 分支：生产环境分支，包含个性化配置和自定义修改
  - 其他分支：用于功能开发和实验

## 更新流程

### 前置准备

#### 1. 添加上游仓库（仅首次需要）

```bash
# 添加原始 NotionNext 仓库作为上游
git remote add upstream https://github.com/tangly1024/NotionNext.git

# 验证远程仓库配置
git remote -v
# 应该看到：
# origin    https://github.com/[你的用户名]/NotionNext.git (fetch)
# origin    https://github.com/[你的用户名]/NotionNext.git (push)
# upstream  https://github.com/tangly1024/NotionNext.git (fetch)
# upstream  https://github.com/tangly1024/NotionNext.git (push)
```

### 标准更新步骤

#### 1. 更新 main 分支

```bash
# 切换到 main 分支
git checkout main

# 获取上游最新代码
git fetch upstream

# 合并上游更新（通常是快进合并）
git merge upstream/main

# 推送到自己的仓库
git push origin main
```

#### 2. 合并到 deploy 分支

```bash
# 切换到 deploy 分支
git checkout deploy

# 合并 main 分支的更新
git merge main

# 如果出现冲突，见下方冲突解决部分
```

#### 3. 处理合并冲突

常见的冲突文件及解决策略：

- **yarn.lock / package-lock.json**
  ```bash
  # 对于依赖锁文件，接受上游版本
  git checkout --theirs yarn.lock
  git add yarn.lock
  ```

- **blog.config.js**
  ```bash
  # 手动编辑，保留个人配置，合并新功能配置项
  # 使用编辑器打开文件，仔细合并
  ```

- **public/ 目录下的文件**
  ```bash
  # 通常保留自己的版本（如 avatar.png, favicon.ico 等）
  git checkout --ours public/avatar.png
  ```

#### 4. 提交合并结果

```bash
# 添加所有已解决的文件
git add .

# 提交合并
git commit -m "merge: 更新上游变更到 deploy 分支

- 同步最新功能和修复
- 保留个性化配置
- 解决 [具体文件] 的冲突"

# 推送到远程
git push origin deploy
```

#### 5. 更新依赖并测试

```bash
# 安装/更新依赖
yarn install

# 本地测试
yarn dev

# 访问 http://localhost:3000 确认一切正常
```

## 冲突解决详解

### 策略原则

1. **配置文件**：保留个人配置，合并新增配置项
2. **依赖文件**：接受上游版本，重新生成
3. **静态资源**：保留个人版本
4. **主题文件**：如有自定义修改，需要仔细合并

### 具体文件处理

```bash
# blog.config.js - 需要手动合并
# 保留你的个人配置如：
# - TITLE, AUTHOR, BIO, LINK
# - NOTION_PAGE_ID
# - 各种 API keys
# 合并新增的配置项

# package.json - 通常接受上游
git checkout --theirs package.json

# 主题配置文件 - 根据实际情况
# 如果有自定义，需要手动合并
# 如果没有修改，接受上游版本
```

## 回滚操作

如果更新后出现问题：

```bash
# 查看提交历史
git log --oneline -10

# 回滚到指定提交
git reset --hard [commit-hash]

# 强制推送（谨慎使用）
git push origin deploy --force
```

## 最佳实践

### 1. 更新频率
- 建议每 1-2 周检查一次更新
- 重大版本发布后及时更新
- 避开重要内容发布期

### 2. 更新前准备
- 备份重要配置文件
- 记录自定义修改清单
- 查看上游更新日志

### 3. 个性化文件管理

创建 `.gitignore.local`（如需要）：
```
# 个人配置备份
/backup/
*.backup

# 本地测试文件
/test/
```

### 4. 自动化脚本

创建更新脚本 `update-upstream.sh`：
```bash
#!/bin/bash
# 自动更新脚本

echo "开始更新 NotionNext..."

# 切换到 main 并更新
git checkout main
git fetch upstream
git merge upstream/main
git push origin main

# 切换到 deploy
git checkout deploy

echo "准备合并到 deploy 分支..."
echo "请手动处理可能的冲突"

# 尝试合并
git merge main

echo "更新脚本执行完成！"
echo "如有冲突，请手动解决后执行："
echo "  git add ."
echo "  git commit"
echo "  git push origin deploy"
```

## 常见问题

### Q: 更新后网站无法访问
A: 检查 Vercel 部署日志，常见原因：
- 依赖安装失败：清除缓存重新部署
- 环境变量丢失：检查 Vercel 设置
- 构建错误：查看具体错误信息

### Q: 如何保持自定义主题的修改
A: 
1. 将修改记录在单独文档中
2. 使用 git stash 暂存修改
3. 更新后重新应用修改

### Q: 依赖冲突如何处理
A: 
```bash
# 删除 node_modules 和锁文件
rm -rf node_modules yarn.lock

# 重新安装
yarn install
```

## 更新日志

记录每次更新的重要信息：

```markdown
### 2025-07-12
- 从 commit [98b4d27e] 更新到 [c5e94337]
- 新增功能：proxio 和 typography 主题
- 修复：若干 bug 修复和性能优化
- 冲突文件：yarn.lock（已解决）
```

## 社区资源

- [NotionNext 官方仓库](https://github.com/tangly1024/NotionNext)
- [问题反馈](https://github.com/tangly1024/NotionNext/issues)
- [更新日志](https://github.com/tangly1024/NotionNext/releases)
- [部署文档](https://docs.tangly1024.com/zh/notionnext/deploy)

---

> 本文档会随着项目发展持续更新，建议定期查看以获取最新的更新指南。