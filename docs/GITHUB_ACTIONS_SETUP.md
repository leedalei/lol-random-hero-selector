# 🔐 GitHub Actions Secrets 配置指南

## 📋 必需的Secrets列表

在GitHub仓库的 `Settings > Secrets and variables > Actions` 中添加以下secrets：

### 🖥️ 服务器连接配置

| Secret名称 | 描述 | 示例值 |
|-----------|------|---------|
| `SERVER_HOST` | 服务器IP地址 | `123.456.789.123` |
| `SERVER_USER` | 服务器用户名 | `deploy` |
| `DEPLOY_PATH` | 部署路径 | `/var/www/lol-hero-selector` |
| `SERVER_DOMAIN` | 域名 | `your-domain.com` |
| `SSH_PRIVATE_KEY` | SSH私钥内容 | `-----BEGIN RSA PRIVATE KEY-----...` |

### 🔐 SSH密钥生成步骤

1. **生成SSH密钥对** (在你的本地机器上):
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@lol-hero-selector"
```

2. **将公钥添加到服务器**:
```bash
# 复制公钥内容
cat ~/.ssh/id_rsa.pub

# 在服务器上添加公钥
ssh deploy@your-server "mkdir -p ~/.ssh && echo '你的公钥内容' >> ~/.ssh/authorized_keys"
```

3. **将私钥添加到GitHub Secrets**:
```bash
# 复制私钥内容 (包括BEGIN和END行)
cat ~/.ssh/id_rsa
```

## 🚀 一键部署流程

### 第一次设置

1. **配置服务器环境**:
```bash
# 克隆仓库
git clone https://github.com/your-username/lol-random-hero-selector.git
cd lol-random-hero-selector

# 复制并配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的服务器信息

# 初始化服务器环境
./scripts/deploy.sh init
```

2. **配置GitHub Secrets**:
   - 进入仓库的 `Settings > Secrets and variables > Actions`
   - 添加上面表格中的所有secrets

3. **触发首次部署**:
```bash
# 推送代码触发自动部署
git add .
git commit -m "feat: 初始化自动化部署配置"
git push origin main
```

### 后续部署

每次推送代码到 `main` 或 `deploy` 分支都会自动触发部署：
```bash
git add .
git commit -m "feat: 更新功能"
git push origin main
```

或者手动触发：
```bash
# GitHub CLI (需要安装 gh)
gh workflow run deploy.yml

# 或者在GitHub网页上手动触发
```

## 📊 监控和维护

### 查看部署状态
```bash
./scripts/deploy.sh status
```

### 查看日志
```bash
./scripts/deploy.sh logs
```

### 重启服务
```bash
./scripts/deploy.sh restart
```

### 创建备份
```bash
./scripts/deploy.sh backup
```

## 🔧 高级配置

### 环境变量自定义

你可以在GitHub Actions中添加额外的环境变量：

| Secret名称 | 描述 | 示例 |
|-----------|------|---------|
| `NOTIFICATION_WEBHOOK` | 部署通知webhook | `https://hooks.slack.com/...` |
| `SENTRY_DSN` | 错误监控 | `https://sentry.io/...` |
| `SLACK_BOT_TOKEN` | Slack通知 | `xoxb-...` |

### 自定义部署分支

默认推送 `main` 或 `deploy` 分支会触发部署。修改 `.github/workflows/deploy.yml` 中的触发条件：

```yaml
on:
  push:
    branches: [ main, deploy, staging ]  # 添加staging分支
```

### 部署前测试

可以在部署前添加测试步骤：

```yaml
- name: 🧪 运行测试
  run: |
    npm run test
    npm run e2e
```

## 🛠️ 故障排除

### SSH连接失败
1. 检查SSH密钥是否正确添加到服务器
2. 检查服务器防火墙是否允许SSH连接
3. 验证GitHub Actions中的secrets配置

### 部署失败
1. 查看GitHub Actions日志获取详细错误信息
2. 检查服务器磁盘空间是否充足
3. 验证Node.js版本是否符合要求

### 服务无法启动
1. 检查端口3010是否被占用
2. 查看服务器日志：`./scripts/deploy.sh logs`
3. 验证依赖是否正确安装

### 健康检查失败
1. 确认后端服务正在运行
2. 检查防火墙配置
3. 验证Nginx反向代理设置

## 🔒 安全建议

1. **使用强密码**: 服务器用户密码要足够复杂
2. **定期更新**: 保持系统和依赖包的最新版本
3. **备份策略**: 定期备份重要数据
4. **监控告警**: 设置服务监控和告警
5. **访问控制**: 限制SSH访问来源IP

## 📱 移动端通知

可以配置Slack或Discord通知：

### Slack通知配置
1. 创建Slack App和Bot Token
2. 添加 `SLACK_BOT_TOKEN` 到GitHub Secrets
3. 更新deploy.yml添加通知步骤

### Discord通知配置
1. 创建Discord Webhook
2. 添加 `DISCORD_WEBHOOK` 到GitHub Secrets
3. 配置通知步骤

---

📖 更多详细信息请参考 [DEPLOYMENT.md](../DEPLOYMENT.md)