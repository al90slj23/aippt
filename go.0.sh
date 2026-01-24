#!/bin/bash
# ================================================================
# 文件名: go.0.sh
# 说明: 选项 0 - 本地开发服务器
# ================================================================

echo -e "${GREEN}🚀 启动本地开发环境...${NC}"
echo ""

# 检查依赖
if ! command_exists uv; then
    echo -e "${RED}❌ 未安装 uv，请先安装: https://docs.astral.sh/uv/getting-started/installation/${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ 未安装 npm${NC}"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 启动后端服务器
echo -e "${BLUE}📦 启动后端服务器...${NC}"
cd backend
uv run python app.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo -e "${GREEN}✓ 后端服务器已启动 (PID: $BACKEND_PID)${NC}"
echo -e "${CYAN}  日志: logs/backend.log${NC}"
echo -e "${CYAN}  地址: http://localhost:5000${NC}"
echo ""

# 等待后端启动
sleep 2

# 启动前端开发服务器
echo -e "${BLUE}📦 启动前端开发服务器...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}✓ 前端服务器已启动 (PID: $FRONTEND_PID)${NC}"
echo -e "${CYAN}  日志: logs/frontend.log${NC}"
echo -e "${CYAN}  地址: http://localhost:5173${NC}"
echo ""

# 保存 PID 到文件
echo "$BACKEND_PID" > logs/backend.pid
echo "$FRONTEND_PID" > logs/frontend.pid

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ 开发环境已启动${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}提示：${NC}"
echo -e "  - 后端: http://localhost:5000"
echo -e "  - 前端: http://localhost:5173"
echo -e "  - 查看日志: tail -f logs/backend.log 或 logs/frontend.log"
echo -e "  - 停止服务: kill \$(cat logs/backend.pid) \$(cat logs/frontend.pid)"
echo ""

# 等待用户按键
read -p "按回车键停止服务..." 

# 停止服务
echo -e "${YELLOW}正在停止服务...${NC}"
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
rm -f logs/backend.pid logs/frontend.pid
echo -e "${GREEN}✓ 服务已停止${NC}"
