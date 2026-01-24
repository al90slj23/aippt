#!/bin/bash
# 在服务器上执行的部署命令

set -e

echo "========================================="
echo "开始部署 Banana Slides"
echo "========================================="

# 1. 克隆项目
echo "1. 克隆项目..."
cd /www/wwwroot
if [ -d "ppt.yysyyf.com" ]; then
    echo "目录已存在，拉取最新代码..."
    cd ppt.yysyyf.com
    git pull origin main
else
    git clone https://github.com/al90slj23/aippt.git ppt.yysyyf.com
    cd ppt.yysyyf.com
fi

# 2. 安装 uv
echo "2. 安装 uv..."
if ! command -v uv &> /dev/null; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

# 3. 配置环境变量
echo "3. 配置环境变量..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "请编辑 .env 文件配置 API 密钥："
    echo "nano .env"
    echo "按 Enter 继续..."
    read
fi

# 4. 安装 Python 依赖
echo "4. 安装 Python 依赖..."
uv sync

# 5. 初始化数据库
echo "5. 初始化数据库..."
cd backend
uv run alembic upgrade head
cd ..

# 6. 安装前端依赖
echo "6. 安装前端依赖..."
cd frontend
npm install

# 7. 构建前端
echo "7. 构建前端..."
npm run build
cd ..

# 8. 设置权限
echo "8. 设置权限..."
chown -R www:www /www/wwwroot/ppt.yysyyf.com

# 9. 配置 Supervisor
echo "9. 配置 Supervisor..."
cat > /etc/supervisor/conf.d/banana-slides.conf << 'EOF'
[program:banana-slides]
directory=/www/wwwroot/ppt.yysyyf.com/backend
command=/www/wwwroot/ppt.yysyyf.com/.venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 --timeout 300 app:app
user=www
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/www/wwwroot/ppt.yysyyf.com/backend/gunicorn.log
environment=FLASK_ENV="production"
EOF

# 10. 重载 Supervisor
echo "10. 启动后端服务..."
supervisorctl reread
supervisorctl update
supervisorctl start banana-slides

# 11. 检查服务状态
echo "11. 检查服务状态..."
sleep 3
supervisorctl status banana-slides

echo ""
echo "========================================="
echo "部署完成！"
echo "========================================="
echo ""
echo "访问地址: http://ppt.yysyyf.com"
echo ""
echo "查看后端日志:"
echo "  tail -f /www/wwwroot/ppt.yysyyf.com/backend/gunicorn.log"
echo ""
echo "管理后端服务:"
echo "  supervisorctl status banana-slides"
echo "  supervisorctl restart banana-slides"
echo ""
