@echo off
chcp 65001 >nul 2>&1
title Lance WebUI - AI Creative Studio
color 0B

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         Lance WebUI  v0.1.0              ║
echo  ║     Multi-modal AI Creative Studio       ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ---- 切换到脚本所在目录 ----
cd /d "%~dp0"

:: ---- 检测 Python ----
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 未找到 Python，请先安装 Python 3.10+
    echo         https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 获取 Python 版本
for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do set PY_VER=%%v
echo [INFO] 检测到 Python %PY_VER%

:: ---- 虚拟环境 ----
if not exist "venv\Scripts\activate.bat" (
    echo [INFO] 首次运行，正在创建虚拟环境...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] 创建虚拟环境失败
        pause
        exit /b 1
    )
    echo [INFO] 虚拟环境创建完成
)

:: 激活虚拟环境
call venv\Scripts\activate.bat

:: ---- 安装依赖 ----
if not exist "venv\.deps_installed" (
    echo [INFO] 正在安装依赖（首次运行需要几分钟）...
    pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
    if %errorlevel% neq 0 (
        echo [WARN] 清华源安装失败，尝试默认源...
        pip install -r requirements.txt
    )
    if %errorlevel% equ 0 (
        echo done > venv\.deps_installed
        echo [INFO] 依赖安装完成
    ) else (
        echo [ERROR] 依赖安装失败，请检查网络
        pause
        exit /b 1
    )
) else (
    echo [INFO] 依赖已就绪
)

:: ---- 输出目录 ----
if not exist "outputs" mkdir outputs

:: ---- 环境变量 ----
if not defined LANCE_HOST set LANCE_HOST=0.0.0.0
if not defined LANCE_PORT set LANCE_PORT=8000

:: ---- 启动服务 ----
echo.
echo  ┌──────────────────────────────────────────┐
echo  │  服务启动中...                            │
echo  │  地址: http://localhost:%LANCE_PORT%            │
echo  │  按 Ctrl+C 停止服务                       │
echo  └──────────────────────────────────────────┘
echo.

:: 延迟 2 秒后自动打开浏览器
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:%LANCE_PORT%"

:: 启动 uvicorn
python -m uvicorn backend.main:app --host %LANCE_HOST% --port %LANCE_PORT% --reload

echo.
echo [INFO] 服务已停止
pause
