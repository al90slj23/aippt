# 部署文档

## 快速部署指南

### 前置条件

1. **本地机器**：
   - Git
   - SSH 密钥配置完成

2. **服务器**：
   - Ubuntu 20.04+ / Debian 11+
   - 至少 2GB RAM
   - 至少 20GB 磁盘空间
   - 已配置 SSH 密钥登录

### 步骤 1: 配置 SSH 密钥登录

#### 在本地机器上：

```bash
# 查看你的公钥
cat ~/.ssh/al90slj23.pub
```

复制输出的公钥内容。

#### 在服务器上：

```bash
# 创建 .ssh 目录
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 添加公钥
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

#### 在本地配置 SSH：

编辑 `~/.ssh/config`：

```
Host ppt.yysyyf.com
    HostName 43.139.241.25
    User root
    IdentityFile ~/.ssh/al90slj23
    Port 22
```

测试连接：
```bash
ssh ppt.yysyyf.com
```

### 步骤 2: 推送代码到 GitHub

```bash
cd banana-slides

# 检查当前 remote
git remote -v

# 如果已有 origin，先移除
git remote remove origin

# 添加新的 GitHub 仓库
git remote add origin git@github.com:al90slj23/aippt.git

# 推送代码（首次推送）
git branch -M main
git push -u origin main
```

### 步骤 3: 服务器环境配置

SSH 连接到服务器：
```bash
ssh ppt.yysyyf.com
```

下载并运行环境配置脚本：
```bash
# 如果项目还未克隆，先临时下载脚本
curl -O https://raw.githubusercontent.com/al90slj23/aippt/main/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh
```

或者手动安装：
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装 Nginx
sudo apt install -y nginx git

# 重新登录以使 Docker 用户组生效
exit
ssh ppt.yysyyf.com
```

### 步骤 4: 克隆项目

```bash
# 创建项目目录
sudo mkdir -p /www/wwwroot
sudo chown -R $USER:$USER /www/wwwroot

# 克隆项目
cd /www/wwwroot
git clone git@github.com:al90slj23/aippt.git ppt.yysyyf.com
cd ppt.yysyyf.com
```

### 步骤 5: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**重要配置项**：

```env
# AI Provider 配置（必须）
AI_PROVIDER_FORMAT=gemini
GOOGLE_API_KEY=你的API密钥
GOOGLE_API_BASE=https://generativelanguage.googleapis.com

# 模型配置
TEXT_MODEL=gemini-3-flash-preview
IMAGE_MODEL=gemini-3-pro-image-preview

# Flask 配置
FLASK_ENV=production
SECRET_KEY=请生成一个随机密钥
BACKEND_PORT=5000

# CORS 配置（重要！）
CORS_ORIGINS=https://ppt.yysyyf.com,http://ppt.yysyyf.com

# 数据库配置（默认使用 SQLite，无需额外配置）
# SQLite 数据库文件会自动创建在 backend/instance/database.db
```

生成随机密钥：
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 步骤 6: 配置 Nginx

```bash
# 复制 Nginx 配置
sudo cp nginx-site.conf /etc/nginx/sites-available/ppt.yysyyf.com

# 创建软链接
sudo ln -s /etc/nginx/sites-available/ppt.yysyyf.com /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 步骤 7: 启动服务

```bash
# 使用部署脚本（推荐）
./deploy.sh

# 或手动启动
docker compose -f docker-compose.prod.yml up -d

# 查看日志
docker compose logs -f
```

### 步骤 8: 配置 SSL 证书（推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d ppt.yysyyf.com

# 测试自动续期
sudo certbot renew --dry-run
```

## 数据备份与恢复

### 备份数据

```bash
# 备份 SQLite 数据库
cp backend/instance/database.db backend/instance/database.db.backup-$(date +%Y%m%d)

# 备份上传文件
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

### 恢复数据

```bash
# 恢复 SQLite 数据库
cp backend/instance/database.db.backup-20250124 backend/instance/database.db
docker compose restart

# 恢复上传文件
tar -xzf uploads-backup-20250124.tar.gz
```

## 维护操作

### 查看日志

```bash
# 查看所有日志
docker compose logs -f

# 查看后端日志
docker compose logs -f backend --tail 100

# 查看前端日志
docker compose logs -f frontend --tail 100
```

### 重启服务

```bash
docker compose restart
```

### 更新代码

```bash
cd /www/wwwroot/ppt.yysyyf.com
git pull origin main
./deploy.sh
```

### 备份数据

```bash
# 备份 SQLite 数据库
cp backend/instance/database.db backend/instance/database.db.backup-$(date +%Y%m%d)

# 备份上传文件
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

### 恢复数据

```bash
# 恢复 SQLite
cp backend/instance/database.db.backup-20250124 backend/instance/database.db

# 恢复上传文件
tar -xzf uploads-backup-20250124.tar.gz
```

## 故障排查

### 1. 容器无法启动

```bash
# 查看容器状态
docker compose ps

# 查看详细日志
docker compose logs backend --tail 200
docker compose logs frontend --tail 200
```

### 2. 端口被占用

```bash
# 查看端口占用
sudo netstat -tulpn | grep -E ':(3000|5000)'

# 或使用 lsof
sudo lsof -i :3000
sudo lsof -i :5000
```

### 3. Nginx 配置错误

```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 4. 数据库连接失败

SQLite 数据库会自动创建，如果遇到问题：

```bash
# 检查数据库文件权限
ls -la backend/instance/

# 确保目录存在
mkdir -p backend/instance

# 重启容器
docker compose restart backend
```

### 5. API 请求超时

检查 `.env` 中的超时配置：
```env
GENAI_TIMEOUT=300.0
OPENAI_TIMEOUT=300.0
```

检查 Nginx 超时配置（`nginx-site.conf`）：
```nginx
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
```

## 性能优化

### 1. 启用 Nginx 缓存

在 `nginx-site.conf` 中添加：
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 60m;
    # ... 其他配置
}
```

### 2. 增加 Docker 资源限制

在 `docker-compose.yml` 中添加：
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### 3. 使用 Redis 缓存（可选）

添加 Redis 服务到 `docker-compose.yml`：
```yaml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## 监控和日志

### 1. 设置日志轮转

创建 `/etc/logrotate.d/banana-slides`：
```
/var/log/nginx/ppt.yysyyf.com.*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 2. 监控磁盘空间

```bash
# 查看磁盘使用
df -h

# 查看 Docker 磁盘使用
docker system df

# 清理未使用的 Docker 资源
docker system prune -a
```

## 安全建议

1. **定期更新系统和软件包**
2. **使用强密码和 SSH 密钥**
3. **配置防火墙（ufw）**
4. **启用 SSL/TLS 证书**
5. **定期备份数据**
6. **限制 API 访问频率**
7. **监控异常访问日志**

## 联系支持

如有问题，请查看：
- GitHub Issues: https://github.com/al90slj23/aippt/issues
- 原项目文档: https://github.com/Anionex/banana-slides
