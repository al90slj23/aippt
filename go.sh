#!/bin/bash
# ================================================================
# 文件名: go.sh
# 项目: 元愈PPT - AI PPT 生成器
# 创建时间: 2025-01-24
# 作者: AI + al90slj23
# ================================================================
#
# 【文件职责】
# 统一入口脚本，负责加载库文件、显示菜单、调度子脚本
#
# 【拆分结构】
# go.sh          - 主入口（本文件）
# go.lib.sh      - 通用库：颜色定义、工具函数
# go.0.sh        - 选项 0: 本地开发服务器
# go.1.sh        - 选项 1: 双通道部署（GitHub + rsync）
#
# 【使用方法】
# ./go.sh        # 交互式菜单（5秒后默认选择1）
# ./go.sh 0      # 本地开发
# ./go.sh 1      # 部署到服务器
#
# ================================================================

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 加载库文件
source "$SCRIPT_DIR/go.lib.sh"

# 检查依赖
check_project_root

# 显示标题
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}    元愈PPT 部署系统${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 获取选择（支持命令行参数或交互式输入）
if [ -n "$1" ]; then
    choice="$1"
    echo -e "${GREEN}📌 执行选项: ${choice}${NC}"
else
    echo -e "${YELLOW}请选择操作：${NC}"
    echo "0. 本地开发服务器（后端 + 前端）"
    echo "1. 部署到服务器（GitHub + rsync）"
    read -t 10 -p "请输入选择 (0/1，10秒后自动选择1): " choice

    if [ -z "$choice" ]; then
        choice=1
        echo -e "\n${GREEN}⏱️  自动选择：部署到服务器${NC}"
    fi
fi
echo ""

# 记录部署开始时间（用于耗时统计）
DEPLOY_START_TIME=$(date +%s)
export DEPLOY_START_TIME

# 检查对应的子脚本是否存在
SUB_SCRIPT="$SCRIPT_DIR/go.${choice}.sh"
if [ -f "$SUB_SCRIPT" ]; then
    source "$SUB_SCRIPT"
else
    echo -e "${RED}❌ 无效选择，请输入 0 或 1${NC}"
    exit 1
fi
