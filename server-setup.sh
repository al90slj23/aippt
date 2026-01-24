#!/bin/bash

# 服务器初始化脚本
# 在服务器上运行此脚本以安装必要的软件和配置环境

set -e

echo "========================================="
echo "Banana Slides 服务器环境配置"
echo "========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then 
    echo -e "${YELLOW}警告: 建议使用普通用户运行此脚本${NC}"
fi

# 更新系统
echo -e "${GREEN}更新系统包...${NC}"
sudo apt update && sudo apt upgrade -y

# 安装基础工具
echo -e "${GREEN}安装基础工具...${NC}"
sudo apt install -y curl wget git vim htop

# 检查 Docker 是否已安装
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}安装 Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}Docker 已安装，请重新登录以使用户组生效${NC}"
else
    echo -e "${GREEN}Docker 已安装${NC}"
fi

# 检查 Docker Compose 是否已安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}安装 Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo -e "${GREEN}Docker Compose 已安装${NC}"
fi

# 检查 Nginx 是否已安装
if ! command -v nginx &> /dev/null; then
    echo -e "${GREEN}安装 Nginx...${NC}"
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
else
    echo -e "${GREEN}Nginx 已安装${NC}"
fi

# 创建项目目录
echo -e "${GREEN}创建项目目录...${NC}"
sudo mkdir -p /www/wwwroot/ppt.yysyyf.com
sudo chown -R $USER:$USER /www/wwwroot

# 配置防火墙（如果使用 ufw）
if command -v ufw &> /dev/null; then
    echo -e "${GREEN}配置防火墙...${NC}"
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    echo -e "${YELLOW}防火墙规则已添加，使用 'sudo ufw enable' 启用${NC}"
fi

# 设置 Docker 开机自启
echo -e "${GREEN}设置 Docker 开机自启...${NC}"
sudo systemctl enable docker

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}服务器环境配置完成！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "下一步:"
echo "1. 克隆项目到 /www/wwwroot/ppt.yysyyf.com"
echo "   cd /www/wwwroot"
echo "   git clone git@github.com:al90slj23/aippt.git ppt.yysyyf.com"
echo ""
echo "2. 配置环境变量"
echo "   cd ppt.yysyyf.com"
echo "   cp .env.example .env"
echo "   nano .env"
echo ""
echo "3. 配置 Nginx"
echo "   sudo cp nginx-site.conf /etc/nginx/sites-available/ppt.yysyyf.com"
echo "   sudo ln -s /etc/nginx/sites-available/ppt.yysyyf.com /etc/nginx/sites-enabled/"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
echo "4. 启动服务"
echo "   ./deploy.sh"
echo ""
