#!/usr/bin/env bash
# Lance WebUI - 一键启动脚本 (Git Bash / WSL / Linux)
set -e
cd "$(dirname "$0")"

echo ""
echo "  =================================================="
echo "    Lance WebUI  v0.1.0"
echo "    Multi-modal AI Creative Studio"
echo "  =================================================="
echo ""

# -- 检测 Python --
PY=""
for cmd in python3 python; do
  if command -v "$cmd" &>/dev/null; then
    ver=$("$cmd" --version 2>&1 | grep -oP '3\.\d+')
    minor=$(echo "$ver" | cut -d. -f2)
    if [[ "$minor" -ge 10 ]]; then PY="$cmd"; break; fi
  fi
done

if [[ -z "$PY" ]]; then
  echo "[ERROR] 未找到 Python 3.10+，请先安装"
  exit 1
fi
echo "[INFO] 检测到 $($PY --version)"

# -- 虚拟环境 --
if [[ ! -f "venv/bin/activate" ]]; then
  echo "[INFO] 首次运行，正在创建虚拟环境..."
  $PY -m venv venv
  echo "[INFO] 虚拟环境创建完成"
fi
source venv/bin/activate

# -- 安装依赖 --
if [[ ! -f "venv/.deps_installed" ]]; then
  echo "[INFO] 正在安装依赖（首次运行需要几分钟）..."
  pip install --upgrade pip -q 2>/dev/null || true
  pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/ --trusted-host pypi.tuna.tsinghua.edu.cn \
    || pip install -r requirements.txt
  date > venv/.deps_installed
  echo "[INFO] 依赖安装完成"
else
  echo "[INFO] 依赖已就绪"
fi

# -- 输出目录 --
mkdir -p outputs

# -- 配置 --
HOST="${LANCE_HOST:-0.0.0.0}"
PORT="${LANCE_PORT:-8000}"

# -- 启动 --
echo ""
echo "  =================================================="
echo "    服务启动中..."
echo "    地址: http://localhost:${PORT}"
echo "    按 Ctrl+C 停止服务"
echo "  =================================================="
echo ""

# 延迟打开浏览器
(sleep 3 && (xdg-open "http://localhost:${PORT}" 2>/dev/null || open "http://localhost:${PORT}" 2>/dev/null || true)) &

PYTHONPATH="$(pwd)" python -m uvicorn backend.main:app --host "$HOST" --port "$PORT" --reload
