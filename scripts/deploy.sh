#!/bin/bash

# 🚀 快速部署助手脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 显示帮助信息
show_help() {
    echo "🚀 LOL随机英雄选择器 - 快速部署助手"
    echo "==============================================="
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  init      - 初始化部署环境"
    echo "  deploy    - 执行部署"
    echo "  status    - 查看部署状态"
    echo "  logs      - 查看日志"
    echo "  restart   - 重启服务"
    echo "  stop      - 停止服务"
    echo "  backup    - 创建备份"
    echo "  help      - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 init     # 初始化服务器环境"
    echo "  $0 deploy   # 部署应用"
    echo "  $0 status   # 查看服务状态"
}

# 加载环境变量
load_env() {
    if [[ -f .env ]]; then
        source .env
        log_success "环境变量加载完成"
    else
        log_error "未找到.env文件，请先复制.env.example并配置"
        exit 1
    fi
}

# 检查SSH连接
check_ssh() {
    log_info "检查SSH连接..."

    if ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "echo 'SSH连接成功'" >/dev/null 2>&1; then
        log_success "SSH连接正常"
    else
        log_error "SSH连接失败，请检查以下配置："
        echo "  - 服务器IP: $SERVER_HOST"
        echo "  - 用户名: $SERVER_USER"
        echo "  - SSH密钥配置"
        exit 1
    fi
}

# 初始化服务器
init_server() {
    log_info "🔧 初始化服务器环境..."

    # 检查必要的环境变量
    if [[ -z "$SERVER_HOST" || -z "$SERVER_USER" || -z "$SERVER_DOMAIN" || -z "$DEPLOY_PATH" ]]; then
        log_error "缺少必要的环境变量，请检查.env文件"
        exit 1
    fi

    # 复制部署脚本到服务器并执行
    log_info "上传部署脚本到服务器..."
    scp -q scripts/server-setup.sh $SERVER_USER@$SERVER_HOST:/tmp/

    log_info "在服务器上执行初始化脚本..."
    ssh $SERVER_USER@$SERVER_HOST "
        cd /tmp
        chmod +x server-setup.sh
        sudo ./server-setup.sh
    "

    log_success "🎉 服务器初始化完成！"
}

# 部署应用
deploy_app() {
    log_info "🚀 开始部署应用..."

    # 检查SSH连接
    check_ssh

    # 运行GitHub Actions工作流
    log_info "触发GitHub Actions部署..."

    # 可以通过API触发，或手动推送代码
    if command -v gh &> /dev/null; then
        # 使用GitHub CLI触发部署
        if git status --porcelain | grep -q .; then
            log_info "检测到未提交的更改，正在提交..."
            git add .
            git commit -m "自动部署: $(date)"
            git push origin main
        else
            # 推送到deploy分支
            git push origin main
        fi
    else
        log_info "请手动推送代码到main分支来触发部署"
    fi

    log_success "部署请求已发送！"
}

# 查看状态
check_status() {
    log_info "🔍 检查服务状态..."

    check_ssh

    ssh $SERVER_USER@$SERVER_HOST "
        echo '📊 服务器状态报告'
        echo '=================='
        echo ''

        # 检查进程
        if pgrep -f 'node.*index.js' > /dev/null; then
            echo '✅ 后端服务运行中'
            ps aux | grep 'node.*index.js' | grep -v grep
        else
            echo '❌ 后端服务未运行'
        fi

        echo ''

        # 检查端口
        if netstat -tuln | grep :3010 > /dev/null; then
            echo '✅ 端口3010已监听'
        else
            echo '❌ 端口3010未监听'
        fi

        echo ''

        # 检查健康状态
        if curl -s http://localhost:3010/health > /dev/null; then
            echo '✅ 健康检查通过'
            curl -s http://localhost:3010/health | jq .
        else
            echo '❌ 健康检查失败'
        fi

        echo ''

        # 检查磁盘空间
        echo '💾 磁盘使用情况:'
        df -h $DEPLOY_PATH

        echo ''

        # 检查内存使用
        echo '🧠 内存使用情况:'
        free -h
    "
}

# 查看日志
show_logs() {
    log_info "📋 查看服务日志..."

    check_ssh

    ssh $SERVER_USER@$SERVER_HOST "
        echo '📝 实时日志 (按Ctrl+C退出):'
        echo '================================='
        tail -f $DEPLOY_PATH/logs/server.log
    "
}

# 重启服务
restart_service() {
    log_info "🔄 重启服务..."

    check_ssh

    ssh $SERVER_USER@$SERVER_HOST "
        cd $DEPLOY_PATH

        # 停止旧服务
        if pgrep -f 'node.*index.js' > /dev/null; then
            pkill -f 'node.*index.js'
            echo '已停止旧服务'
            sleep 3
        fi

        # 启动新服务
        cd server
        npm ci --production
        cd ..
        nohup npm run start:server > logs/server.log 2>&1 &
        echo \$! > server.pid

        echo '✅ 服务重启完成'

        # 检查状态
        sleep 5
        if curl -s http://localhost:3010/health > /dev/null; then
            echo '✅ 服务运行正常'
        else
            echo '❌ 服务启动失败'
        fi
    "

    log_success "服务重启完成"
}

# 停止服务
stop_service() {
    log_info "⏹️  停止服务..."

    check_ssh

    ssh $SERVER_USER@$SERVER_HOST "
        if pgrep -f 'node.*index.js' > /dev/null; then
            pkill -f 'node.*index.js'
            echo '服务已停止'
        else
            echo '服务未运行'
        fi
    "

    log_success "服务停止完成"
}

# 创建备份
create_backup() {
    log_info "💾 创建备份..."

    check_ssh

    BACKUP_DIR="$DEPLOY_PATH/backups"
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)

    ssh $SERVER_USER@$SERVER_HOST "
        cd $DEPLOY_PATH

        # 创建备份目录
        mkdir -p $BACKUP_DIR

        # 备份前端
        if [[ -d 'dist' ]]; then
            tar -czf $BACKUP_DIR/dist-$TIMESTAMP.tar.gz dist/
            echo '✅ 前端备份完成'
        fi

        # 备份后端
        if [[ -d 'server' ]]; then
            tar -czf $BACKUP_DIR/server-$TIMESTAMP.tar.gz server/
            echo '✅ 后端备份完成'
        fi

        # 备份数据库 (如果有)
        # TODO: 添加数据库备份

        # 清理旧备份 (保留最近7天)
        find $BACKUP_DIR -name '*.tar.gz' -mtime +7 -delete 2>/dev/null || true

        echo '📋 备份列表:'
        ls -la $BACKUP_DIR/*.tar.gz 2>/dev/null || echo '暂无备份文件'
    "

    log_success "备份创建完成"
}

# 主函数
main() {
    case "$1" in
        init)
            load_env
            init_server
            ;;
        deploy)
            load_env
            deploy_app
            ;;
        status)
            load_env
            check_status
            ;;
        logs)
            load_env
            show_logs
            ;;
        restart)
            load_env
            restart_service
            ;;
        stop)
            load_env
            stop_service
            ;;
        backup)
            load_env
            create_backup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"