# 快速部署指南

## 一、本地准备（在你的电脑上）

### 1. 配置 SSH 密钥登录

在**本地**查看公钥：
```bash
cat ~/.ssh/al90slj23.pub
```

复制输出内容，然后在**服务器**上执行：
```bash
# SSH 登录服务器（首次使用密码）
ssh root@43.139.241.25

# 添加公钥
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "粘贴你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

在**本地**配置 SSH 快捷方式，编辑 `~/.ssh/config`：
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

### 2. 推送代码到 GitHub

```bash
cd banana-slides

# 添加新的 GitHub 仓库
git remote add origin git@github.com:al90slj23/aippt.git

# 推送代码
git branch -M main
git push -u origin main
```

## 二、服务器部署（在服务器上）

### 1. 安装环境

```bash
# SSH 连接服务器
ssh ppt.yysyyf.com

# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装 Nginx
sudo apt update
sudo apt install -y nginx git

# 重新登录使 Docker 生效
exit
ssh ppt.yysyyf.com
```

### 2. 克隆项目

```bash
# 创建目录
sudo mkdir -p /www/wwwroot
sudo chown -R $USER:$USER /www/wwwroot

# 克隆项目
cd /www/wwwroot
git clone git@github.com:al90slj23/aippt.git ppt.yysyyf.com
cd ppt.yysyyf.com
```

### 3. 配置环境变量

```bash
# 复制配置文件
cp .env.example .env

# 编辑配置
nano .env
```

**必须修改的配置**：
```env
# AI API 配置（必须）
GOOGLE_API_KEY=你的Gemini-API密钥

# 生产环境配置
FLASK_ENV=production
SECRET_KEY=随机生成的密钥

# CORS 配置（重要）
CORS_ORIGINS=https://ppt.yysyyf.com,http://ppt.yysyyf.com
```

生成随机密钥：
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 4. 配置 Nginx

```bash
# 复制配置文件
sudo cp nginx-site.conf /etc/nginx/sites-available/ppt.yysyyf.com

# 启用站点
sudo ln -s /etc/nginx/sites-available/ppt.yysyyf.com /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 5. 启动服务

```bash
# 使用部署脚本
chmod +x deploy.sh
./deploy.sh

# 查看日志
docker compose logs -f
```

### 6. 配置 SSL（推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d ppt.yysyyf.com

# 测试自动续期
sudo certbot renew --dry-run
```

## 三、验证部署

访问以下地址：
- HTTP: http://ppt.yysyyf.com
- HTTPS: https://ppt.yysyyf.com (配置 SSL 后)
- 健康检查: http://ppt.yysyyf.com/health

## 四、常用命令

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
git pull origin main
./deploy.sh
```

### 备份数据
```bash
# 备份数据库（SQLite）
cp backend/instance/database.db backend/instance/database.db.backup-$(date +%Y%m%d)

# 备份上传文件
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

### 停止服务
```bash
docker compose down
```

## 五、故障排查

### 容器无法启动
```bash
docker compose ps
docker compose logs backend --tail 200
```

### 端口被占用
```bash
sudo netstat -tulpn | grep -E ':(3000|5000)'
```

### Nginx 错误
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

## 重要说明

1. **数据库**：项目使用 SQLite，数据文件在 `backend/instance/database.db`，无需额外配置 MySQL
2. **API 密钥**：必须配置有效的 Gemini API Key 才能使用 AI 功能
3. **域名解析**：确保 ppt.yysyyf.com 已正确解析到 43.139.241.25
4. **防火墙**：确保服务器开放 80 和 443 端口
5. **定期备份**：建议每天备份数据库和上传文件

## 获取帮助

- 详细文档：查看 `DEPLOYMENT.md`
- 原项目：https://github.com/Anionex/banana-slides
- 问题反馈：https://github.com/al90slj23/aippt/issues
