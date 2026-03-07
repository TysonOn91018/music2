#!/bin/bash

# Mood Player Backend 启动脚本

echo "启动 Mood Player Backend API..."

# 检查是否安装了依赖
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "安装依赖..."
pip install -r requirements.txt

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "警告: 未找到 .env 文件，请复制 env.example 并配置"
    echo "运行: cp env.example .env"
fi

# 启动服务器
echo "启动服务器..."
python main.py
