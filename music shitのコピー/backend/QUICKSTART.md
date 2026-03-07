# 快速开始指南

## 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

或者使用虚拟环境：

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. 配置环境变量

创建 `.env` 文件（复制 `env.example`）：

```bash
cp env.example .env
```

编辑 `.env` 文件，填入你的 Supabase 配置：

```env
SUPABASE_URL=https://nlavqjsztdfxksjusyky.supabase.co
SUPABASE_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here  # 可选
```

## 3. 初始化数据库

在 Supabase Dashboard 的 SQL Editor 中执行 `../friends-setup.sql` 文件中的 SQL 语句。

或者使用管理脚本检查：

```bash
python db_manager.py check
```

## 4. 启动服务器

```bash
python main.py
```

服务器将在 `http://localhost:8000` 启动。

## 5. 测试 API

### 方法1: 使用测试脚本

```bash
python test_api.py
```

### 方法2: 使用 Swagger UI

打开浏览器访问：`http://localhost:8000/docs`

### 方法3: 使用 curl

```bash
# 健康检查
curl http://localhost:8000/health

# 注册用户
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# 登录
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## 常见问题

### 问题1: 端口被占用

如果 8000 端口被占用，可以修改 `main.py` 最后一行：

```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # 改为其他端口
```

### 问题2: Supabase 连接失败

检查：
1. `.env` 文件中的 URL 和 KEY 是否正确
2. Supabase 项目是否正常运行
3. 网络连接是否正常

### 问题3: 数据库表不存在

确保已在 Supabase SQL Editor 中执行了 `friends-setup.sql` 中的 SQL 语句。

### 问题4: 认证失败

检查：
1. Token 是否有效（通常1小时过期）
2. 请求头中是否包含 `Authorization: Bearer <token>`
3. Supabase RLS 策略是否正确配置

## API 端点列表

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户信息

### 用户
- `GET /api/users/search?query=xxx` - 搜索用户

### 好友
- `POST /api/friends/request` - 发送好友请求
- `GET /api/friends/requests` - 获取好友请求列表
- `POST /api/friends/accept/{request_id}` - 接受请求
- `POST /api/friends/reject/{request_id}` - 拒绝请求
- `GET /api/friends` - 获取好友列表
- `DELETE /api/friends/{friend_id}` - 删除好友

## 下一步

1. 查看完整文档：`README.md`
2. 测试 API：`python test_api.py`
3. 查看 API 文档：`http://localhost:8000/docs`
4. 集成到前端：修改前端代码调用这些 API
