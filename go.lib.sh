#!/bin/bash
# ================================================================
# 文件名: go.lib.sh
# 说明: 通用库文件 - 颜色定义、工具函数
# ================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 检查项目根目录
check_project_root() {
    if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        echo -e "${RED}❌ 错误：请在项目根目录运行此脚本${NC}"
        exit 1
    fi
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 生成 AI 提交摘要
get_ai_commit_message() {
    local diff_output=$(git diff --cached --stat)
    local status_output=$(git status --short)
    
    if [ -z "$diff_output" ] && [ -z "$status_output" ]; then
        echo "chore: 更新配置"
        return
    fi
    
    # 简单的提交信息生成（可以后续集成 AI）
    local changed_files=$(echo "$status_output" | wc -l | tr -d ' ')
    echo "feat: 更新 ${changed_files} 个文件"
}

# 确认提交信息
confirm_commit_message() {
    local ai_msg="$1"
    echo -e "${CYAN}AI 建议的提交信息: ${YELLOW}$ai_msg${NC}"
    read -p "是否使用此信息？(直接回车使用/输入自定义信息): " confirm
    
    if [ -z "$confirm" ]; then
        echo "$ai_msg"
    else
        echo "$confirm"
    fi
}
