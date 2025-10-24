#!/bin/bash

# 🚀 服务器自动部署脚本
# 用于首次设置服务器环境

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "检测到root用户，建议使用普通用户"
    fi
}

# 安装Node.js
install_nodejs() {
    log_info "检查Node.js安装状态..."

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2)
        log_success "Node.js已安装: $NODE_VERSION"

        # 检查版本是否符合要求 (>=18)
        if [[ $(echo "$NODE_VERSION >= 18" | bc -l 2>/dev/null || echo 0) -eq 1 ]]; then
            log_success "Node.js版本符合要求 (>=18)"
        else
            log_warning "Node.js版本较低，建议升级到18或更高版本"
        fi
    else
        log_info "安装Node.js..."

        # 检测Linux发行版
        if command -v apt-get &> /dev/null; then
            # Ubuntu/Debian
            log_info "使用apt安装Node.js..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command -v yum &> /dev/null; then
            # CentOS/RHEL
            log_info "使用yum安装Node.js..."
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        elif command -v dnf &> /dev/null; then
            # Fedora
            log_info "使用dnf安装Node.js..."
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo dnf install -y nodejs
        else
            log_error "不支持的Linux发行版，请手动安装Node.js"
            exit 1
        fi

        log_success "Node.js安装完成"
    fi
}

# 安装PM2 (进程管理器)
install_pm2() {
    log_info "检查PM2安装状态..."

    if command -v pm2 &> /dev/null; then
        log_success "PM2已安装: $(pm2 -v)"
    else
        log_info "安装PM2..."
        sudo npm install -g pm2
        log_success "PM2安装完成"
    fi
}

# 安装Nginx (可选)
install_nginx() {
    log_info "检查Nginx安装状态..."

    if command -v nginx &> /dev/null; then
        log_success "Nginx已安装"
    else
        read -p "是否安装Nginx进行反向代理? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "安装Nginx..."

            if command -v apt-get &> /dev/null; then
                sudo apt-get update && sudo apt-get install -y nginx
            elif command -v yum &> /dev/null; then
                sudo yum install -y nginx
            elif command -v dnf &> /dev/null; then
                sudo dnf install -y nginx
            fi

            sudo systemctl start nginx
            sudo systemctl enable nginx

            log_success "Nginx安装并启动完成"
        fi
    fi
}

# 创建部署用户
create_deploy_user() {
    log_info "检查部署用户..."

    if id "$DEPLOY_USER" &>/dev/null; then
        log_success "用户 $DEPLOY_USER 已存在"
    else
        read -p "是否创建部署用户 $DEPLOY_USER? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo adduser --disabled-password --gecos "" "$DEPLOY_USER"
            sudo usermod -aG sudo "$DEPLOY_USER"

            # 配置sudo免密码
            echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/$DEPLOY_USER

            log_success "用户 $DEPLOY_USER 创建完成"
        fi
    fi
}

# 创建SSH配置
setup_ssh() {
    log_info "配置SSH..."

    # 确保SSH目录存在
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh

    # 添加SSH密钥
    if [[ -n "$SSH_PUBLIC_KEY" ]]; then
        echo "$SSH_PUBLIC_KEY" >> ~/.ssh/authorized_keys
        chmod 600 ~/.ssh/authorized_keys
        log_success "SSH公钥配置完成"
    fi

    # 优化SSH配置
    sudo tee -a /etc/ssh/sshd_config > /dev/null <<EOF

# 安全配置
PasswordAuthentication no
PermitRootLogin no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

    sudo systemctl restart ssh
    log_success "SSH配置优化完成"
}

# 配置防火墙
setup_firewall() {
    log_info "配置防火墙..."

    # 检查防火墙类型
    if command -v ufw &> /dev/null; then
        # Ubuntu UFW
        sudo ufw allow ssh
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw --force enable
        log_success "UFW防火墙配置完成"
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS firewalld
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        log_success "Firewalld防火墙配置完成"
    else
        log_warning "未检测到防火墙管理工具，请手动配置"
    fi
}

# 设置Nginx反向代理
setup_nginx_proxy() {
    if command -v nginx &> /dev/null; then
        log_info "配置Nginx反向代理..."

        sudo tee /etc/nginx/sites-available/lol-hero-selector > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $SERVER_DOMAIN;

    # 前端静态文件
    location / {
        root $DEPLOY_PATH/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;

        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端API
    location /api/ {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:3010;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

        # 启用站点
        sudo ln -sf /etc/nginx/sites-available/lol-hero-selector /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default

        # 测试并重载Nginx
        sudo nginx -t && sudo systemctl reload nginx

        log_success "Nginx反向代理配置完成"
    fi
}

# 创建应用目录
create_app_directory() {
    log_info "创建应用目录..."

    sudo mkdir -p $DEPLOY_PATH
    sudo chown $DEPLOY_USER:$DEPLOY_USER $DEPLOY_PATH

    # 创建必要子目录
    mkdir -p $DEPLOY_PATH/{backups,logs,ssl}

    log_success "应用目录创建完成: $DEPLOY_PATH"
}

# 创建PM2配置文件
create_pm2_config() {
    log_info "创建PM2配置..."

    tee $DEPLOY_PATH/ecosystem.config.js > /dev/null <<EOF
module.exports = {
  apps: [{
    name: 'lol-hero-selector-server',
    script: 'server/index.js',
    cwd: '$DEPLOY_PATH',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3010
    },
    error_file: '$DEPLOY_PATH/logs/server-error.log',
    out_file: '$DEPLOY_PATH/logs/server-out.log',
    log_file: '$DEPLOY_PATH/logs/server-combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

    log_success "PM2配置文件创建完成"
}

# 主函数
main() {
    echo "🚀 LOL随机英雄选择器 - 服务器自动部署脚本"
    echo "==============================================="

    # 读取配置
    source .env 2>/dev/null || {
        log_error "未找到.env文件，请先创建配置文件"
        exit 1
    }

    check_root
    install_nodejs
    install_pm2
    install_nginx
    create_deploy_user
    setup_ssh
    setup_firewall
    create_app_directory
    create_pm2_config

    if command -v nginx &> /dev/null; then
        setup_nginx_proxy
    fi

    log_success "🎉 服务器环境配置完成！"
    echo ""
    echo "📋 下一步操作："
    echo "1. 配置GitHub Actions Secrets"
    echo "2. 推送代码到GitHub"
    echo "3. 触发自动部署"
    echo ""
    echo "🔧 服务器信息："
    echo "部署路径: $DEPLOY_PATH"
    echo "域名: $SERVER_DOMAIN"
    echo "用户: $DEPLOY_USER"
}

# 执行主函数
main "$@"