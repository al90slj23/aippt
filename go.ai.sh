#!/bin/bash
# ================================================================
# 文件名: go.ai.sh
# 说明: AI API 调用库（DeepSeek）
# ================================================================

[[ "${BASH_SOURCE[0]}" != "${0}" ]] && _GO_AI_SOURCED=true || _GO_AI_SOURCED=false

# 通用 AI API 调用函数
call_ai_api() {
    local PROMPT="$1"
    local SYSTEM_PROMPT="${2:-你是一个专业的AI助手。}"
    local MAX_TOKENS="${3:-1200}"

    if [ -z "$PROMPT" ]; then
        echo "错误：请提供 prompt" >&2
        return 1
    fi

    # 检查 DeepSeek API Key
    if [ -z "$DEEPSEEK_API_KEY" ] && [ -z "$APIKEY_MacOS_Code_DeepSeek" ]; then
        echo "错误：未配置 DEEPSEEK_API_KEY 或 APIKEY_MacOS_Code_DeepSeek 环境变量" >&2
        return 1
    fi

    local API_KEY="${DEEPSEEK_API_KEY:-$APIKEY_MacOS_Code_DeepSeek}"
    local API_URL="https://api.deepseek.com/chat/completions"
    local MODEL="deepseek-chat"

    # 使用 Python 调用 API
    local RESULT=$(python3 -c "
import json
import urllib.request
import sys

prompt = '''${PROMPT}'''
system_prompt = '''${SYSTEM_PROMPT}'''

data = {
    'model': '${MODEL}',
    'messages': [
        {'role': 'system', 'content': system_prompt},
        {'role': 'user', 'content': prompt}
    ],
    'temperature': 0.3,
    'max_tokens': ${MAX_TOKENS}
}

req = urllib.request.Request(
    '${API_URL}',
    data=json.dumps(data).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${API_KEY}'
    }
)

try:
    with urllib.request.urlopen(req, timeout=60) as response:
        result = json.loads(response.read().decode('utf-8'))
        content = result['choices'][0]['message']['content'].strip()
        print(content)
        sys.exit(0)
except urllib.error.HTTPError as e:
    print(f'HTTP错误 {e.code}: {e.reason}', file=sys.stderr)
    sys.exit(1)
except urllib.error.URLError as e:
    print(f'网络错误: {e.reason}', file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f'错误: {e}', file=sys.stderr)
    sys.exit(1)
" 2>&1)
    
    local EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo "$RESULT"
        return 0
    else
        echo "错误: $RESULT" >&2
        return 1
    fi
}

# 生成 Git 提交摘要
get_ai_commit_message() {
    # 检查是否有变更
    if [ -z "$(git status --porcelain)" ]; then
        echo "chore: 自动部署 $(date '+%Y-%m-%d %H:%M')"
        return
    fi

    # 获取变更信息（优先使用已暂存的变更）
    local CHANGED_FILES=$(git diff --cached --name-status 2>/dev/null)
    if [ -z "$CHANGED_FILES" ]; then
        CHANGED_FILES=$(git diff --name-status 2>/dev/null)
    fi

    # 如果还是没有变更，使用 status
    if [ -z "$CHANGED_FILES" ]; then
        CHANGED_FILES=$(git status --short 2>/dev/null)
    fi

    local DIFF_STAT=$(git diff --cached --stat 2>/dev/null)
    if [ -z "$DIFF_STAT" ]; then
        DIFF_STAT=$(git diff --stat 2>/dev/null)
    fi

    # 调试信息（输出到 stderr，不影响返回值）
    echo "🔍 检测到变更文件:" >&2
    echo "$CHANGED_FILES" | head -10 >&2
    echo "" >&2

    # 构建 prompt
    local PROMPT="你是一个专业的Git提交摘要生成专家。请根据以下变更信息，生成一个详细的Conventional Commits格式提交摘要。

变更文件状态（A=新增, M=修改, D=删除）:
${CHANGED_FILES}

变更统计:
${DIFF_STAT}

生成要求:
1. 第一行: type: 简洁但准确的主标题
   - type从feat/fix/refactor/docs/style/chore中选择
   - 主标题概括核心内容

2. 第二行开始: 用'-'列出重要变更
   - 按功能模块分类
   - 包含具体文件名
   - 尽可能详细但简洁

3. 中文输出，总长度控制在800字符内"

    local SYSTEM_PROMPT="你是一个专业的Git提交摘要生成专家。"

    echo "🤖 正在调用 DeepSeek API..." >&2
    local RESULT=$(call_ai_api "$PROMPT" "$SYSTEM_PROMPT" 1200)
    local API_STATUS=$?
    
    if [ $API_STATUS -eq 0 ] && [ -n "$RESULT" ] && [[ "$RESULT" != 错误* ]]; then
        echo "✅ AI 生成成功" >&2
        echo "$RESULT"
    else
        echo "⚠️  AI 生成失败，使用默认摘要" >&2
        echo "chore: 自动部署 $(date '+%Y-%m-%d %H:%M')"
    fi
}

# 如果直接执行
if [ "$_GO_AI_SOURCED" = false ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    [ -f "$SCRIPT_DIR/go.lib.sh" ] && source "$SCRIPT_DIR/go.lib.sh"

    if [ -n "$1" ]; then
        PROMPT="$*"
    elif [ ! -t 0 ]; then
        PROMPT=$(cat)
    else
        echo "用法: ./go.ai.sh \"你的问题\""
        echo "环境变量: DEEPSEEK_API_KEY 或 APIKEY_MacOS_Code_DeepSeek"
        exit 0
    fi

    call_ai_api "$PROMPT"
fi
