# Mood Player Backend API

使用 FastAPI 构建的登录和好友系统后端。

## 功能特性

- ✅ 用户注册和登录
- ✅ JWT 认证
- ✅ 用户搜索
- ✅ 好友请求（发送、接受、拒绝）
- ✅ 好友列表管理
- ✅ 删除好友

## 安装和运行

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的 Supabase 配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key  # 可选，用于管理员操作
```

### 3. 初始化数据库

在 Supabase Dashboard 的 SQL Editor 中执行 `../friends-setup.sql` 文件中的 SQL 语句。

或者使用管理脚本检查数据库：

```bash
python db_manager.py check
```

### 4. 启动服务器

```bash
python main.py
```

或者使用 uvicorn：

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

服务器将在 `http://localhost:8000` 启动。

## API 文档

启动服务器后，访问以下地址查看自动生成的 API 文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 端点

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 用户相关

- `GET /api/users/search?query=xxx` - 搜索用户

### 好友相关

- `POST /api/friends/request` - 发送好友请求
- `GET /api/friends/requests` - 获取好友请求列表
- `POST /api/friends/accept/{request_id}` - 接受好友请求
- `POST /api/friends/reject/{request_id}` - 拒绝好友请求
- `GET /api/friends` - 获取好友列表
- `DELETE /api/friends/{friend_id}` - 删除好友

## 使用示例

### 注册用户

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 登录

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

响应会包含 `access_token`，用于后续 API 调用。

### 搜索用户（需要认证）

```bash
curl -X GET "http://localhost:8000/api/users/search?query=test" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 发送好友请求

```bash
curl -X POST "http://localhost:8000/api/friends/request" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_user_id": "user-uuid-here"
  }'
```

## 数据库管理脚本

使用 `db_manager.py` 脚本管理数据库：

```bash
# 显示初始化SQL
python db_manager.py init

# 检查数据库表
python db_manager.py check

# 列出所有用户
python db_manager.py users

# 列出所有好友关系
python db_manager.py friends

# 列出所有好友请求
python db_manager.py requests
```

## 前端集成

在前端 JavaScript 中，你可以这样调用 API：

```javascript
// 登录
const response = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
const token = data.access_token;

// 使用token调用其他API
const friendsResponse = await fetch('http://localhost:8000/api/friends', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 注意事项

1. **CORS 配置**: 当前允许所有来源，生产环境应该限制为特定域名
2. **服务端密钥**: `SUPABASE_SERVICE_KEY` 应该保密，不要提交到代码仓库
3. **JWT Token**: Token 由 Supabase 管理，有效期通常为 1 小时
4. **数据库权限**: 确保 Supabase RLS 策略已正确配置

## 开发

### 代码结构

```
backend/
├── main.py              # FastAPI 主应用
├── db_manager.py         # 数据库管理脚本
├── requirements.txt      # Python 依赖
├── .env.example         # 环境变量示例
└── README.md           # 本文档
```

### 测试

可以使用 Postman、curl 或访问 Swagger UI 来测试 API。

## 许可证

MIT
