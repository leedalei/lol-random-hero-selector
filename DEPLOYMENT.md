# 🚀 LOL随机英雄选择器部署指南

本项目支持多种部署方案，包括完全免费的一键部署和自服务器部署。

## 📋 部署方案概览

### 方案1: 一键部署到自服务器 ⭐ (推荐)
- **平台**: 您自己的VPS或云服务器
- **工具**: GitHub Actions + SSH
- **成本**: 服务器费用 (5-10美元/月)
- **优势**: 完全控制、高性能、支持WebSocket、数据独立

### 方案2: 前后端分离部署
- **前端**: Vercel (免费)
- **后端**: Render (免费)
- **优势**: 无需服务器、简单易用
- **限制**: WebSocket连接有限制、数据共享

### 方案3: Vercel Serverless
- **平台**: Vercel
- **限制**: WebSocket支持有限制
- **优势**: 完全免费
- **适用**: 纯API应用

## 🌐 前端部署 (Vercel)

### 方法1: GitHub集成部署 (推荐)

1. **推送代码到GitHub**
```bash
git add .
git commit -m "准备部署到Vercel"
git push origin main
```

2. **连接Vercel到GitHub**
   - 访问 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录
   - 点击 "New Project"
   - 导入你的GitHub仓库
   - Vercel会自动检测到是Vite项目

3. **配置环境变量**
   - 在Vercel项目设置中添加：
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

### 方法2: Vercel CLI部署

1. **安装Vercel CLI**
```bash
npm i -g vercel
```

2. **登录并部署**
```bash
vercel login
vercel --prod
```

## 🔧 后端部署 (Render)

### 准备后端代码

1. **更新server端CORS配置**
```javascript
// 在 server/index.js 中更新CORS配置
const cors = require('cors');

app.use(cors({
  origin: [
    'https://your-vercel-app.vercel.app', // 你的Vercel域名
    'http://localhost:3007',              // 本地开发
    'https://vercel.app'                 // Vercel预览域名
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
```

2. **确保服务器监听正确端口**
```javascript
const PORT = process.env.PORT || 3010;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});
```

### Render部署步骤

1. **准备Render配置**
   创建 `server/render.yaml` 文件：

```yaml
services:
  - type: web
    name: lol-hero-selector-server
    env: node
    plan: free
    buildCommand: "npm install"
    startCommand: "npm start"
    healthCheckPath: /health
    ports:
      - 3010
    envVars:
      - key: NODE_ENV
        value: production
```

2. **通过GitHub部署到Render**
   - 访问 [render.com](https://render.com)
   - 使用GitHub账号登录
   - 点击 "New +" → "Web Service"
   - 连接GitHub仓库
   - 选择 `server` 文件夹
   - 配置如下设置：
     - **Name**: `lol-hero-selector-server`
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free`

3. **配置环境变量**
   - 在Render项目设置中添加必要的环境变量

## 🔄 连接前后端

### 更新前端Socket连接配置

在 `src/services/socket.ts` 中更新服务器URL：

```typescript
const serverUrl = import.meta.env.PROD
  ? 'https://your-backend-url.onrender.com'  // Render部署的后端URL
  : 'ws://localhost:3010';                   // 本地开发
```

### 获取后端URL

部署到Render后，从Render控制台获取你的应用URL，格式类似：
`https://your-app-name.onrender.com`

## 📝 部署检查清单

### 前端 (Vercel)
- [ ] 代码已推送到GitHub
- [ ] Vercel项目已创建
- [ ] 环境变量 `VITE_API_URL` 已设置
- [ ] 构建成功
- [ ] 域名可访问

### 后端 (Render)
- [ ] 代码已推送到GitHub
- [ ] Render Web Service已创建
- [ ] 健康检查通过 (`/health`)
- [ ] WebSocket连接正常
- [ ] CORS配置正确

### 连接测试
- [ ] 前端能连接到后端
- [ ] Socket.io通信正常
- [ ] 创建房间功能正常
- [ ] 实时通信正常

## 🛠️ 本地开发

同时运行前后端：
```bash
# 在项目根目录
npm run dev:full
```

或者分别在两个终端：
```bash
# 终端1: 前端
npm run dev

# 终端2: 后端
cd server && npm run dev
```

## 🔧 故障排除

### 常见问题

1. **CORS错误**
   - 确保Render的CORS配置包含Vercel域名
   - 检查环境变量是否正确设置

2. **WebSocket连接失败**
   - 确保后端服务正常运行
   - 检查健康检查端点
   - 验证端口配置

3. **环境变量问题**
   - 在Vercel和Render中都检查环境变量
   - 确保变量名正确

4. **构建失败**
   - 检查依赖是否正确安装
   - 查看构建日志获取具体错误信息

## 📱 访问应用

部署成功后：
- **前端**: `https://your-app-name.vercel.app`
- **后端**: `https://your-backend-name.onrender.com`
- **API**: `https://your-backend-name.onrender.com/health`

## 💡 优化建议

1. **添加自定义域名**
   - 在Vercel中添加自定义域名
   - 在DNS中配置CNAME记录

2. **监控和日志**
   - 使用Vercel Analytics监控前端性能
   - 使用Render Logs查看后端错误

3. **自动部署**
   - 连接GitHub仓库实现自动部署
   - 设置推送时自动构建和部署

## 🚀 GitHub Actions 自服务器一键部署 ⭐

### 📋 前置要求
- GitHub仓库 (需要推送代码)
- 一台Linux服务器 (Ubuntu 20.04+ 推荐)
- 服务器SSH访问权限
- 域名 (可选，用于HTTPS)

### 🛠️ 快速开始

1. **配置服务器**:
```bash
# 克隆仓库到服务器
git clone https://github.com/your-username/lol-random-hero-selector.git
cd lol-random-hero-selector

# 配置环境变量
cp .env.example .env
nano .env  # 填入你的服务器信息

# 一键初始化服务器环境
./scripts/deploy.sh init
```

2. **配置GitHub Secrets**:
   - 进入仓库的 `Settings > Secrets and variables > Actions`
   - 添加以下secrets：
     - `SERVER_HOST`: 服务器IP
     - `SERVER_USER`: 部署用户名
     - `SERVER_DOMAIN`: 域名
     - `DEPLOY_PATH`: 部署路径
     - `SSH_PRIVATE_KEY`: SSH私钥

3. **首次部署**:
```bash
git add .
git commit -m "feat: 初始化GitHub Actions部署"
git push origin main
```

### 🎮 部署命令

```bash
# 查看所有可用命令
./scripts/deploy.sh help

# 常用命令
./scripts/deploy.sh status    # 查看服务状态
./scripts/deploy.sh logs      # 查看日志
./scripts/deploy.sh restart   # 重启服务
./scripts/deploy.sh backup    # 创建备份
```

### 📊 监控和维护

- **自动部署**: 推送代码到main分支自动触发
- **健康检查**: 部署后自动验证服务状态
- **自动备份**: 部署前自动备份旧版本
- **失败回滚**: 部署失败时自动回滚到上一版本

### 🏆 服务器推荐配置

| 提供商 | 价格 | 配置 | 链接 |
|--------|------|------|------|
| Vultr | $5/月 | 1CPU 1GB 25GB SSD | [链接](https://www.vultr.com/) |
| DigitalOcean | $4/月 | 1CPU 1GB 25GB SSD | [链接](https://www.digitalocean.com/) |
| Linode | $5/月 | 1CPU 1GB 25GB SSD | [链接](https://www.linode.com/) |
| AWS Lightsail | $3.5/月 | 1CPU 512MB 20GB SSD | [链接](https://aws.amazon.com/lightsail/) |

---

📖 详细的GitHub Actions配置请查看 [GITHUB_ACTIONS_SETUP.md](./docs/GITHUB_ACTIONS_SETUP.md)

## 📞 技术支持

如果在部署过程中遇到问题：
- 检查构建日志获取详细错误信息
- 确保所有依赖都在package.json中正确列出
- 验证环境变量配置是否正确
- 参考GitHub Actions和SSH配置文档