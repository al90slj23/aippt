#!/bin/bash
# ================================================================
# 文件名: go.git.sh
# 说明: GitHub 提交函数库
# ================================================================

# 加载 AI 库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if ! type call_ai_api &>/dev/null; then
    source "$SCRIPT_DIR/go.ai.sh"
fi

# 交互式确认提交摘要
confirm_commit_message() {
    local CURRENT_MSG="$1"

    while true; do
        printf "\n" >&2
        printf "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n" >&2
        printf "${GREEN}📌 AI 生成的提交摘要:${NC}\n" >&2
        printf "${CYAN}   %s${NC}\n" "$CURRENT_MSG" >&2
        printf "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n" >&2
        printf "\n" >&2
        printf "${YELLOW}请选择操作:${NC}\n" >&2
        printf "  ${GREEN}1${NC} - 确认使用此摘要 ${DIM}(默认, 10秒后自动确认)${NC}\n" >&2
        printf "  ${YELLOW}2${NC} - 自定义输入摘要\n" >&2
        printf "  ${CYAN}0${NC} - 重新生成 AI 摘要\n" >&2
        printf "\n" >&2
        
        read -t 10 -p "请输入选择 (1/2/0) [默认1]: " confirm_choice
        local read_status=$?
        
        if [ $read_status -gt 128 ] || [ -z "$confirm_choice" ]; then
            confirm_choice="1"
            printf "\n${GREEN}⏱️  自动确认使用此摘要${NC}\n" >&2
        fi

        case $confirm_choice in
            1)
                COMMIT_MSG="$CURRENT_MSG"
                break
                ;;
            2)
                printf "\n" >&2
                read -p "请输入自定义提交摘要: " CUSTOM_MSG
                if [ -n "$CUSTOM_MSG" ]; then
                    COMMIT_MSG="$CUSTOM_MSG"
                    break
                else
                    printf "${RED}摘要不能为空，请重新选择${NC}\n" >&2
                fi
                ;;
            0)
                printf "\n" >&2
                printf "${CYAN}🤖 重新生成 AI 提交摘要...${NC}\n" >&2
                CURRENT_MSG=$(get_ai_commit_message)
                ;;
            *)
                printf "${RED}无效选择，请输入 1、2 或 0${NC}\n" >&2
                ;;
        esac
    done

    echo "$COMMIT_MSG"
}
