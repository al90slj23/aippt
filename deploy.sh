#!/bin/bash

# Banana Slides 服务器部署脚本
# 用法: ./deploy.sh

set -e

echo "========================================="
echo "Banana Slides 部署脚本"
echo "========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}警告: .env 文件不存在，从 .env.example 复制...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}请编辑 .env 文件配置必要的环境变量${NC}"
    echo -e "${YELLOW}按 Enter 继续，或 Ctrl+C 取消...${NC}"
    read
fi

# 停止现有容器
echo -e "${GREEN}停止现有容器...${NC}"
docker compose down || true

# 拉取最新代码
echo -e "${GREEN}拉取最新代码...${NC}"
git pull origin main || echo -e "${YELLOW}警告: git pull 失败，继续部署...${NC}"

# 备份数据库
if [ -f "backend/instance/database.db" ]; then
    echo -e "${GREEN}备份数据库...${NC}"
    BACKUP_FILE="backend/instance/database.db.backup-$(date +%Y%m%d-%H%M%S)"
    cp backend/instance/database.db "$BACKUP_FILE"
    echo -e "${GREEN}数据库已备份到: $BACKUP_FILE${NC}"
fi

# 构建并启动容器
echo -e "${GREEN}构建并启动容器...${NC}"
docker compose -f docker-compose.prod.yml up -d --build

# 等待服务启动
echo -e "${GREEN}等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo -e "${GREEN}检查服务状态...${NC}"
docker compose ps

# 检查后端健康状态
echo -e "${GREEN}检查后端健康状态...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}后端服务启动成功！${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}后端服务启动失败，请查看日志${NC}"
        docker compose logs backend --tail 50
        exit 1
    fi
    echo "等待后端服务启动... ($i/30)"
    sleep 2
done

# 显示日志
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "访问地址:"
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:5000"
echo ""
echo "查看日志:"
echo "  docker compose logs -f"
echo ""
echo "停止服务:"
echo "  docker compose down"
echo ""
