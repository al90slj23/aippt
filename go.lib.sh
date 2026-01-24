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
DIM='\033[2m'
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
