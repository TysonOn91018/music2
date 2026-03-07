@echo off
REM Mood Player Backend 启动脚本 (Windows)

echo 启动 Mood Player Backend API...

REM 检查是否安装了依赖
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
call venv\Scripts\activate.bat

REM 安装依赖
echo 安装依赖...
pip install -r requirements.txt

REM 检查 .env 文件
if not exist ".env" (
    echo 警告: 未找到 .env 文件，请复制 env.example 并配置
    echo 运行: copy env.example .env
)

REM 启动服务器
echo 启动服务器...
python main.py

pause
