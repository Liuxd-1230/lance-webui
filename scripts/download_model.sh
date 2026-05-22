#!/bin/bash
# 从 hf-mirror.com 下载 Lance 模型
# 用法: bash scripts/download_model.sh [模型名称]

MODEL_NAME="${1:-NousResearch/Lance-1.0}"
MIRROR_URL="https://hf-mirror.com"
TARGET_DIR="./models"

echo "=========================================="
echo "  Lance 模型下载脚本"
echo "=========================================="
echo "模型: ${MODEL_NAME}"
echo "镜像: ${MIRROR_URL}"
echo "目标: ${TARGET_DIR}"
echo "=========================================="

# 检查 huggingface-cli
if ! command -v huggingface-cli &> /dev/null; then
    echo "[!] 未找到 huggingface-cli，正在安装..."
    pip install huggingface_hub
fi

mkdir -p "${TARGET_DIR}"

export HF_ENDPOINT="${MIRROR_URL}"

echo "[*] 开始下载..."
huggingface-cli download \
    --resume-download \
    "${MODEL_NAME}" \
    --local-dir "${TARGET_DIR}/$(basename ${MODEL_NAME})" \
    --local-dir-use-symlinks False

if [ $? -eq 0 ]; then
    echo "[✓] 下载完成！模型保存在: ${TARGET_DIR}/$(basename ${MODEL_NAME})"
else
    echo "[✗] 下载失败，请检查网络连接"
    exit 1
fi
