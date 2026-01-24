#!/bin/bash
# ================================================================
# 文件名: go.0.sh
# 说明: 选项 0 - 本地开发服务器（仅前端，连接远程后端）
# ================================================================

echo -e "${GREEN}🚀 启动本地开发环境...${NC}"
echo ""

# 检查依赖
if ! command_exists npm; then
    echo -e "${RED}❌ 未安装 npm${NC}"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 检查 .env.local 是否存在
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  未找到 .env.local 文件，创建默认配置...${NC}"
    cat > .env.local << EOF
# 本地开发环境配置
# 前端连接到远程服务器的后端 API
VITE_API_BASE_URL=https://ppt.yysyyf.com
EOF
    echo -e "${GREEN}✓ 已创建 .env.local${NC}"
fi

echo -e "${BLUE}📦 启动前端开发服务器...${NC}"
echo -e "${CYAN}  连接到远程后端: https://ppt.yysyyf.com${NC}"
echo ""

cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 等待前端启动
sleep 2

echo -e "${GREEN}✓ 前端服务器已启动 (PID: $FRONTEND_PID)${NC}"
echo -e "${CYAN}  日志: logs/frontend.log${NC}"
echo -e "${CYAN}  地址: http://localhost:5173${NC}"
echo ""

# 保存 PID 到文件
echo "$FRONTEND_PID" > logs/frontend.pid

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ 开发环境已启动${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}提示：${NC}"
echo -e "  - 前端: http://localhost:5173"
echo -e "  - 后端: https://ppt.yysyyf.com (远程)"
echo -e "  - 查看日志: tail -f logs/frontend.log"
echo -e "  - 停止服务: kill \$(cat logs/frontend.pid)"
echo ""

# 等待用户按键
read -p "按回车键停止服务..." 

# 停止服务
echo -e "${YELLOW}正在停止服务...${NC}"
kill $FRONTEND_PID 2>/dev/null
rm -f logs/frontend.pid
echo -e "${GREEN}✓ 服务已停止${NC}"
