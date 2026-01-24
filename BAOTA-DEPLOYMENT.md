# 宝塔面板纯源码部署指南

## 重要说明

这个项目是 **Python Flask + React** 项目，不是 PHP 项目！
- 后端：Python Flask (端口 5000)
- 前端：React (需要构建成静态文件)
- 数据库：SQLite (无需额外配置)

## 一、宝塔面板准备工作

### 1. 删除 PHP 项目，创建 Python 项目

在宝塔面板中：
1. 删除刚才创建的 PHP 项目
2. 点击「网站」→「Python 项目」→「添加 Python 项目」
3. 配置如下：
   - 项目名称：banana-slides
   - 项目路径：/www/wwwroot/ppt.yysyyf.com
   - Python 版本：3.10 或 3.11
   - 框架：Flask
   - 启动方式：gunicorn
   - 端口：5000

### 2. 安装必要软件

在宝塔面板「软件商店」中安装：
- ✅ Nginx (已安装)
- ✅ Python 项目管理器
- ✅ PM2 管理器 (用于管理 Node.js 进程)
- ✅ Node.js (版本 18+)

## 二、服务器环境配置

### 1. SSH 连接服务器

```bash
ssh ppt.yysyyf.com
```

### 2. 安装 uv (Python 包管理器)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.cargo/env
```

### 3. 克隆项目

```bash
cd /www/wwwroot
git clone git@github.com:al90slj23/aippt.git ppt.yysyyf.com
cd ppt.yysyyf.com

# 设置权限
chown -R www:www /www/wwwroot/ppt.yysyyf.com
```

## 三、后端部署

### 1. 配置环境变量

```bash
cd /www/wwwroot/ppt.yysyyf.com
cp .env.example .env
nano .env
```

**必须配置的内容**：
```env
# AI API 配置
AI_PROVIDER_FORMAT=gemini
GOOGLE_API_KEY=你的Gemini-API密钥
GOOGLE_API_BASE=https://generativelanguage.googleapis.com

# 模型配置
TEXT_MODEL=gemini-3-flash-preview
IMAGE_MODEL=gemini-3-pro-image-preview

# Flask 配置
FLASK_ENV=production
SECRET_KEY=生成一个随机密钥
BACKEND_PORT=5000

# CORS 配置
CORS_ORIGINS=https://ppt.yysyyf.com,http://ppt.yysyyf.com
```

生成随机密钥：
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 2. 安装 Python 依赖

```bash
cd /www/wwwroot/ppt.yysyyf.com

# 使用 uv 安装依赖
uv sync

# 初始化数据库
cd backend
uv run alembic upgrade head
```

### 3. 创建后端启动脚本

```bash
nano /www/wwwroot/ppt.yysyyf.com/start-backend.sh
```

内容：
```bash
#!/bin/bash
cd /www/wwwroot/ppt.yysyyf.com/backend
source ../.venv/bin/activate
export FLASK_ENV=production
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 300 app:app
```

设置权限：
```bash
chmod +x /www/wwwroot/ppt.yysyyf.com/start-backend.sh
```

### 4. 使用 Supervisor 管理后端进程

在宝塔面板中：
1. 进入「软件商店」→「已安装」→「Supervisor」→「设置」
2. 点击「添加守护进程」
3. 配置如下：
   - 名称：banana-slides-backend
   - 启动用户：www
   - 运行目录：/www/wwwroot/ppt.yysyyf.com/backend
   - 启动命令：/www/wwwroot/ppt.yysyyf.com/.venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 --timeout 300 app:app
   - 进程数量：1

或者手动创建配置文件：
```bash
nano /etc/supervisor/conf.d/banana-slides-backend.conf
```

内容：
```ini
[program:banana-slides-backend]
directory=/www/wwwroot/ppt.yysyyf.com/backend
command=/www/wwwroot/ppt.yysyyf.com/.venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 --timeout 300 app:app
user=www
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/www/wwwroot/ppt.yysyyf.com/backend/gunicorn.log
environment=FLASK_ENV="production"
```

重载 Supervisor：
```bash
supervisorctl reread
supervisorctl update
supervisorctl start banana-slides-backend
```

## 四、前端部署

### 1. 安装 Node.js 依赖

```bash
cd /www/wwwroot/ppt.yysyyf.com/frontend
npm install
```

### 2. 配置 API 地址

编辑前端 API 配置：
```bash
nano src/api/client.ts
```

确保 API 地址正确：
```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // 生产环境通过 Nginx 反向代理
  : 'http://localhost:5000';
```

### 3. 构建前端

```bash
cd /www/wwwroot/ppt.yysyyf.com/frontend
npm run build
```

构建完成后，静态文件会生成在 `frontend/dist` 目录。

## 五、Nginx 配置

### 方法一：在宝塔面板配置

1. 进入「网站」→ 找到 ppt.yysyyf.com → 点击「设置」
2. 点击「配置文件」
3. 替换为以下内容：

```nginx
server {
    listen 80;
    server_name ppt.yysyyf.com;
    
    # 日志
    access_log /www/wwwlogs/ppt.yysyyf.com.log;
    error_log /www/wwwlogs/ppt.yysyyf.com.error.log;
    
    # 文件上传大小限制
    client_max_body_size 200M;
    
    # 前端静态文件
    location / {
        root /www/wwwroot/ppt.yysyyf.com/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
        
        # 静态文件缓存
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 后端 API 反向代理
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 增加超时时间
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        access_log off;
    }
}
```

4. 点击「保存」
5. 重载 Nginx

### 方法二：命令行配置

```bash
nano /www/server/panel/vhost/nginx/ppt.yysyyf.com.conf
```

粘贴上面的配置，然后：
```bash
nginx -t
nginx -s reload
```

## 六、配置 SSL 证书

在宝塔面板中：
1. 进入「网站」→ ppt.yysyyf.com → 「设置」
2. 点击「SSL」
3. 选择「Let's Encrypt」
4. 点击「申请」

或使用命令行：
```bash
certbot --nginx -d ppt.yysyyf.com
```

## 七、验证部署

### 1. 检查后端服务

```bash
# 检查进程
supervisorctl status banana-slides-backend

# 检查日志
tail -f /www/wwwroot/ppt.yysyyf.com/backend/gunicorn.log

# 测试 API
curl http://localhost:5000/health
```

### 2. 检查前端

访问：http://ppt.yysyyf.com

### 3. 检查 Nginx

```bash
nginx -t
systemctl status nginx
```

## 八、更新部署

创建更新脚本：
```bash
nano /www/wwwroot/ppt.yysyyf.com/update.sh
```

内容：
```bash
#!/bin/bash
set -e

echo "开始更新..."

# 进入项目目录
cd /www/wwwroot/ppt.yysyyf.com

# 备份数据库
if [ -f "backend/instance/database.db" ]; then
    cp backend/instance/database.db backend/instance/database.db.backup-$(date +%Y%m%d-%H%M%S)
    echo "数据库已备份"
fi

# 拉取最新代码
git pull origin main

# 更新后端依赖
uv sync

# 运行数据库迁移
cd backend
uv run alembic upgrade head
cd ..

# 重启后端
supervisorctl restart banana-slides-backend

# 更新前端
cd frontend
npm install
npm run build
cd ..

# 设置权限
chown -R www:www /www/wwwroot/ppt.yysyyf.com

echo "更新完成！"
```

设置权限：
```bash
chmod +x /www/wwwroot/ppt.yysyyf.com/update.sh
```

使用：
```bash
cd /www/wwwroot/ppt.yysyyf.com
./update.sh
```

## 九、常用命令

### 后端管理

```bash
# 查看状态
supervisorctl status banana-slides-backend

# 启动
supervisorctl start banana-slides-backend

# 停止
supervisorctl stop banana-slides-backend

# 重启
supervisorctl restart banana-slides-backend

# 查看日志
tail -f /www/wwwroot/ppt.yysyyf.com/backend/gunicorn.log
```

### 前端重新构建

```bash
cd /www/wwwroot/ppt.yysyyf.com/frontend
npm run build
```

### 数据库备份

```bash
cp /www/wwwroot/ppt.yysyyf.com/backend/instance/database.db \
   /www/wwwroot/ppt.yysyyf.com/backend/instance/database.db.backup-$(date +%Y%m%d)
```

## 十、故障排查

### 1. 后端无法启动

```bash
# 查看详细日志
tail -f /www/wwwroot/ppt.yysyyf.com/backend/gunicorn.log

# 手动测试启动
cd /www/wwwroot/ppt.yysyyf.com/backend
source ../.venv/bin/activate
python app.py
```

### 2. 前端显示空白

```bash
# 检查构建是否成功
ls -la /www/wwwroot/ppt.yysyyf.com/frontend/dist

# 重新构建
cd /www/wwwroot/ppt.yysyyf.com/frontend
rm -rf dist
npm run build
```

### 3. API 请求失败

检查 Nginx 配置中的反向代理设置，确保：
- 后端端口正确（5000）
- CORS 配置正确

### 4. 权限问题

```bash
chown -R www:www /www/wwwroot/ppt.yysyyf.com
chmod -R 755 /www/wwwroot/ppt.yysyyf.com
```

## 十一、性能优化

### 1. 启用 Gzip 压缩

在 Nginx 配置中添加：
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 2. 增加 Gunicorn 工作进程

根据 CPU 核心数调整：
```bash
# 查看 CPU 核心数
nproc

# 修改 Supervisor 配置中的 -w 参数
# 建议：(2 × CPU核心数) + 1
```

### 3. 配置静态文件缓存

已在 Nginx 配置中包含。

## 十二、安全建议

1. **定期备份数据库**
2. **使用强密码和 SSH 密钥**
3. **启用 SSL 证书**
4. **限制 API 访问频率**（可在 Nginx 中配置）
5. **定期更新系统和依赖包**
6. **监控日志文件**

## 总结

这个部署方案的优势：
- ✅ 纯源码部署，方便修改代码
- ✅ 使用宝塔面板管理，操作简单
- ✅ 使用 Supervisor 管理进程，自动重启
- ✅ 前端构建为静态文件，性能更好
- ✅ 使用 SQLite，无需额外配置数据库
- ✅ 支持热更新，不影响用户访问

如有问题，查看日志文件：
- 后端日志：`/www/wwwroot/ppt.yysyyf.com/backend/gunicorn.log`
- Nginx 日志：`/www/wwwlogs/ppt.yysyyf.com.log`
- Supervisor 日志：`/var/log/supervisor/`
