# 部署指南

## 环境配置

### DeepSeek API Key（用于 AI 生成提交信息）

1. 获取 API Key：https://platform.deepseek.com/api_keys
2. 设置环境变量：

```bash
# 方法1：在 ~/.zshrc 或 ~/.bashrc 中添加
export DEEPSEEK_API_KEY=your_api_key_here
# 或
export APIKEY_MacOS_Code_DeepSeek=your_api_key_here

# 方法2：创建本地配置文件
cp .env.deploy .env.deploy.local
# 编辑 .env.deploy.local，填入你的 API Key
```

## 快速开始

### 本地开发

```bash
./go.sh 0
```

这将启动：
- 后端服务器：http://localhost:5000
- 前端开发服务器：http://localhost:5173

日志文件：
- `logs/backend.log`
- `logs/frontend.log`

停止服务：按回车键或 `kill $(cat logs/backend.pid) $(cat logs/frontend.pid)`

### 部署到服务器

```bash
./go.sh 1
```

这将执行以下操作：

1. **前端构建**
   - 运行 `npm run build`
   - 生成生产环境文件到 `frontend/dist`

2. **GitHub 推送**
   - 提交代码到 Git
   - 推送到 GitHub 仓库

3. **rsync 同步**
   - 将代码同步到服务器
   - 排除 `.git`、`node_modules`、`__pycache__` 等

4. **服务器操作**
   - 更新 Python 依赖（uv sync）
   - 运行数据库迁移（alembic upgrade head）
   - 重启后端服务（supervisorctl restart）
   - 设置文件权限

## 服务器配置

### SSH 配置

确保 `~/.ssh/config` 中有以下配置：

```
Host ppt.yysyyf.com
    HostName 43.139.241.25
    User root
    IdentityFile ~/.ssh/al90slj23
    Port 22
```

### 服务器要求

- Python 3.11+
- uv（Python 包管理器）
- Node.js 20+
- Supervisor（进程管理）
- Nginx（Web 服务器）
- rsync（文件同步）

### Supervisor 配置

位置：`/etc/supervisor/conf.d/banana-slides.conf`

```ini
[program:banana-slides]
command=/root/.local/bin/uv run gunicorn -w 4 -b 127.0.0.1:5000 app:app
directory=/www/wwwroot/ppt.yysyyf.com/backend
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/banana-slides.err.log
stdout_logfile=/var/log/banana-slides.out.log
```

### Nginx 配置

位置：`/www/server/panel/vhost/nginx/html_ppt.yysyyf.com.conf`

关键配置：
- `root /www/wwwroot/ppt.yysyyf.com;`
- `client_max_body_size 200M;`
- API 反向代理到 `http://127.0.0.1:5000`
- 静态文件服务（前端 dist 目录）
- `/files/` 和 `/uploads/` 路径映射

## 目录结构

```
/www/wwwroot/ppt.yysyyf.com/
├── backend/                 # 后端代码
│   ├── instance/           # SQLite 数据库
│   ├── uploads/            # 用户上传文件
│   └── ...
├── frontend/               # 前端源码
│   ├── dist/              # 构建产物（Nginx 服务）
│   └── ...
└── ...
```

## 故障排查

### 后端服务无法启动

```bash
# 查看日志
ssh ppt.yysyyf.com "tail -f /var/log/banana-slides.err.log"

# 重启服务
ssh ppt.yysyyf.com "supervisorctl restart banana-slides"
```

### 前端页面 404

检查 Nginx 配置中的 `try_files` 指令：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 图片无法加载

检查 Nginx 中的 `/files/` 路径配置：

```nginx
location ^~ /files/ {
    alias /www/wwwroot/ppt.yysyyf.com/uploads/;
}
```

### 数据库迁移失败

```bash
# SSH 到服务器
ssh ppt.yysyyf.com

# 进入项目目录
cd /www/wwwroot/ppt.yysyyf.com/backend

# 手动运行迁移
uv run alembic upgrade head
```

## 环境变量

后端使用 `.env` 文件或数据库配置。主要配置项：

- `AI_PROVIDER_FORMAT`: openai 或 gemini
- `API_BASE_URL`: AI API 基础 URL
- `API_KEY`: AI API 密钥
- `MINERU_TOKEN`: MinerU 服务 Token
- `BAIDU_OCR_API_KEY`: 百度 OCR API Key

这些配置可以通过 Web 界面（/settings）进行修改。

## 更新日志

查看 Git 提交历史：

```bash
git log --oneline --graph --decorate
```

## 备份

### 数据库备份

```bash
ssh ppt.yysyyf.com "cp /www/wwwroot/ppt.yysyyf.com/backend/instance/database.db /backup/database-$(date +%Y%m%d).db"
```

### 上传文件备份

```bash
rsync -avz ppt.yysyyf.com:/www/wwwroot/ppt.yysyyf.com/backend/uploads/ ./backup/uploads/
```
