#!/bin/bash
# ================================================================
# 文件名: go.1.sh
# 说明: 选项 1 - 双通道部署（GitHub + rsync）
# ================================================================

echo -e "${GREEN}🚀 开始执行 GitHub + 服务器部署...${NC}"

# 生成部署标识
BUILD_ID=$(date '+%H%M%S')
BUILD_ID=$(printf "%07d" $BUILD_ID)
DEPLOY_ID="DEPLOY.${BUILD_ID}"

# 显示变更文件
echo ""
echo -e "${YELLOW}📋 本次变更文件:${NC}"
git status --short
echo ""

# 先 git add
git add .

# 生成 AI 提交摘要并交互确认
echo -e "${CYAN}🤖 正在生成 AI 提交摘要...${NC}"
AI_COMMIT_MSG=$(get_ai_commit_message)
COMMIT_MSG=$(confirm_commit_message "$AI_COMMIT_MSG")

echo ""
echo -e "${GREEN}📌 最终提交信息: ${CYAN}$COMMIT_MSG${NC}"
echo ""

# 前端构建
echo -e "${BLUE}📦 开始前端构建...${NC}"
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 前端构建失败${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}✓ 前端构建完成${NC}"
echo ""

# ========== 阶段1: GitHub 推送 ==========
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  阶段 1: GitHub 推送${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Git commit
echo -e "${CYAN}→ git commit...${NC}"
if git commit -m "$COMMIT_MSG" > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ 提交完成${NC}"
else
    echo -e "${YELLOW}  ⊘ 无新变更${NC}"
fi

# Git push
echo -e "${CYAN}→ git push mine main...${NC}"
if git push mine main; then
    echo -e "${GREEN}  ✓ 推送成功${NC}"
    GITHUB_RESULT="成功"
else
    echo -e "${RED}  ✗ 推送失败${NC}"
    GITHUB_RESULT="失败"
fi
echo ""

# ========== 阶段2: rsync 同步 ==========
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  阶段 2: rsync 同步到服务器${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${CYAN}→ rsync 开始同步...${NC}"

# 执行 rsync
rsync -rltzvh --progress \
    --exclude='.git' \
    --exclude='.venv' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='node_modules' \
    --exclude='.DS_Store' \
    --exclude='logs' \
    --exclude='backend/instance' \
    --exclude='backend/uploads' \
    ./ ppt.yysyyf.com:/www/wwwroot/ppt.yysyyf.com/

RSYNC_EXIT=$?

if [ $RSYNC_EXIT -eq 0 ]; then
    echo -e "${GREEN}  ✓ 同步完成${NC}"
    RSYNC_RESULT="成功"
else
    echo -e "${RED}  ✗ 同步失败${NC}"
    RSYNC_RESULT="失败"
fi
echo ""

# ========== 阶段3: 服务器操作 ==========
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  阶段 3: 服务器操作${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${CYAN}→ SSH 连接服务器...${NC}"

SERVER_SCRIPT='
cd /www/wwwroot/ppt.yysyyf.com

# 安装/更新 Python 依赖
echo "→ 更新 Python 依赖..."
cd backend
uv sync --no-dev
if [ $? -eq 0 ]; then
    echo "OK:python:deps"
else
    echo "FAIL:python:deps"
fi

# 运行数据库迁移
echo "→ 运行数据库迁移..."
uv run alembic upgrade head
if [ $? -eq 0 ]; then
    echo "OK:db:migrate"
else
    echo "FAIL:db:migrate"
fi

cd ..

# 重启后端服务
echo "→ 重启后端服务..."
/www/server/panel/pyenv/bin/supervisorctl -c /www/server/panel/plugin/supervisor/sample.conf restart yuanyu-ppt-backend:yuanyu-ppt-backend_00
if [ $? -eq 0 ]; then
    echo "OK:backend:restart"
else
    echo "FAIL:backend:restart"
fi

# 设置权限
echo "→ 设置权限..."
chown -R www:www /www/wwwroot/ppt.yysyyf.com
chmod -R 755 /www/wwwroot/ppt.yysyyf.com
chmod -R 777 backend/instance backend/uploads
echo "OK:permissions"

echo "DONE"
'

SSH_OUTPUT=$(echo "$SERVER_SCRIPT" | ssh ppt.yysyyf.com 'bash -s' 2>&1)
SSH_EXIT=$?

echo "$SSH_OUTPUT" | while IFS= read -r line; do
    case "$line" in
        "OK:"*) 
            step="${line#OK:}"
            echo -e "${GREEN}  ✓ $step${NC}"
            ;;
        "FAIL:"*)
            step="${line#FAIL:}"
            echo -e "${RED}  ✗ $step${NC}"
            ;;
        "→"*)
            echo -e "${CYAN}  $line${NC}"
            ;;
        "DONE")
            echo -e "${GREEN}  ✓ 服务器操作完成${NC}"
            ;;
    esac
done

if [ $SSH_EXIT -eq 0 ]; then
    SERVER_RESULT="成功"
else
    SERVER_RESULT="失败"
fi
echo ""

# ========== 最终结果 ==========
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}  部署结果${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$RSYNC_RESULT" = "成功" ] && [ "$SERVER_RESULT" = "成功" ]; then
    echo -e "${GREEN}✅ 部署成功！${NC}"
else
    echo -e "${RED}❌ 部署存在问题${NC}"
fi

echo -e "${CYAN}📡 GitHub:  ${GITHUB_RESULT}${NC}"
echo -e "${CYAN}📤 rsync:   ${RSYNC_RESULT}${NC}"
echo -e "${CYAN}🔧 服务器:  ${SERVER_RESULT}${NC}"
echo -e "${CYAN}📍 ID:      ${DEPLOY_ID}${NC}"

# 计算耗时
if [ -n "$DEPLOY_START_TIME" ]; then
    END_TIME=$(date +%s)
    ELAPSED=$((END_TIME - DEPLOY_START_TIME))
    MINS=$((ELAPSED / 60))
    SECS=$((ELAPSED % 60))
    echo -e "${CYAN}⏱️  耗时:    ${MINS}分${SECS}秒${NC}"
fi

echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}🌐 访问地址: https://ppt.yysyyf.com${NC}"
echo ""
