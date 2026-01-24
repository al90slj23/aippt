# Banana Slides 部署指南

## 服务器信息
- 服务器IP: 43.139.241.25
- 域名: ppt.yysyyf.com
- 项目目录: /www/wwwroot/ppt.yysyyf.com
- 数据库: SQLite (自动创建在 backend/instance/database.db)

## 部署步骤

### 1. 推送代码到 GitHub

```bash
cd banana-slides

# 移除原有的 git remote（如果存在）
git remote remove origin

# 添加新的 GitHub 仓库
git remote add origin git@github.com:al90slj23/aippt.git

# 推送代码
git push -u origin main
```

### 2. 服务器环境准备

SSH 连接到服务器：
```bash
ssh ppt.yysyyf.com
```

安装必要软件：
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装 Git
sudo apt install git -y

# 安装 Nginx（如果还没有）
sudo apt install nginx -y
```

### 3. 克隆项目到服务器

```bash
# 创建项目目录
sudo mkdir -p /www/wwwroot/ppt.yysyyf.com
sudo chown -R $USER:$USER /www/wwwroot/ppt.yysyyf.com

# 克隆项目
cd /www/wwwroot
git clone git@github.com:al90slj23/aippt.git ppt.yysyyf.com
cd ppt.yysyyf.com
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

关键配置项：
```env
# AI Provider 配置
AI_PROVIDER_FORMAT=gemini
GOOGLE_API_KEY=your-api-key-here
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

# 数据库配置（使用 SQLite，无需额外配置）
# 数据库文件会自动创建在 backend/instance/database.db
```

### 5. 启动 Docker 容器

```bash
# 使用预构建镜像快速启动
docker compose -f docker-compose.prod.yml up -d

# 或者从源码构建
# docker compose up -d --build

# 查看日志
docker compose logs -f
```

### 6. 配置 Nginx 反向代理

创建 Nginx 配置文件：
```bash
sudo nano /etc/nginx/sites-available/ppt.yysyyf.com
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name ppt.yysyyf.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 增加超时时间（AI 生成可能需要较长时间）
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # 文件上传大小限制
    client_max_body_size 200M;
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/ppt.yysyyf.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. 配置 SSL 证书（推荐）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
sudo certbot --nginx -d ppt.yysyyf.com

# 自动续期
sudo certbot renew --dry-run
```

### 8. 设置开机自启动

```bash
# Docker 容器自动重启已在 docker-compose.yml 中配置
# restart: unless-stopped

# 确保 Docker 服务开机自启
sudo systemctl enable docker
```

## 维护命令

### 查看日志
```bash
cd /www/wwwroot/ppt.yysyyf.com
docker compose logs -f --tail 100
```

### 重启服务
```bash
docker compose restart
```

### 更新代码
```bash
git pull
docker compose down
docker compose up -d --build
```

### 备份数据库
```bash
# SQLite 数据库备份
cp backend/instance/database.db backend/instance/database.db.backup-$(date +%Y%m%d)

# 备份上传文件
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

## 故障排查

### 检查容器状态
```bash
docker compose ps
```

### 检查端口占用
```bash
sudo netstat -tulpn | grep -E ':(3000|5000)'
```

### 检查 Nginx 状态
```bash
sudo systemctl status nginx
sudo nginx -t
```

### 查看详细错误日志
```bash
# 后端日志
docker compose logs backend --tail 200

# 前端日志
docker compose logs frontend --tail 200
```
