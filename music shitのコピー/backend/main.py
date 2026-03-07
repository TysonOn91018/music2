"""
Mood Player Backend API
使用 FastAPI 构建的登录和好友系统后端
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 初始化 FastAPI
app = FastAPI(
    title="Mood Player API",
    description="登录和好友系统API",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase 配置
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://nlavqjsztdfxksjusyky.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sYXZxanN6dGRmeGtzanVzeWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzU1MDcsImV4cCI6MjA4NTc1MTUwN30.moPoq8daEdww89UYhYX0JJA8XpwT1CqKPXxJq8k7b54")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")  # 服务端密钥，用于管理员操作

# 初始化 Supabase 客户端
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_admin: Optional[Client] = None
if SUPABASE_SERVICE_KEY:
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# 安全认证
security = HTTPBearer()

# ==================== Pydantic Models ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    created_at: Optional[datetime] = None

class FriendRequestCreate(BaseModel):
    to_user_id: str

class FriendRequestResponse(BaseModel):
    id: str
    from_user_id: str
    to_user_id: str
    status: str
    created_at: datetime
    from_user: Optional[UserResponse] = None
    to_user: Optional[UserResponse] = None

class FriendResponse(BaseModel):
    id: str
    user_id: str
    friend_id: str
    created_at: datetime
    friend: Optional[UserResponse] = None

class SearchUserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None

# ==================== 依赖函数 ====================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """验证JWT token并返回当前用户"""
    try:
        token = credentials.credentials
        # 使用Supabase验证token
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证token"
            )
        return response.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"认证失败: {str(e)}"
        )

# ==================== 用户认证 API ====================

@app.post("/api/auth/register", response_model=dict)
async def register(user_data: UserRegister):
    """用户注册"""
    try:
        # 创建Supabase用户
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "name": user_data.name or user_data.email.split("@")[0]
                }
            }
        })
        
        if response.user:
            # 创建用户记录
            user_name = user_data.name or user_data.email.split("@")[0]
            supabase.table("users").upsert({
                "id": response.user.id,
                "email": user_data.email,
                "name": user_name
            }).execute()
            
            return {
                "success": True,
                "message": "注册成功！请检查邮箱验证链接",
                "user": {
                    "id": response.user.id,
                    "email": response.user.email
                }
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="注册失败"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"注册失败: {str(e)}"
        )

@app.post("/api/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    """用户登录"""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if response.user and response.session:
            # 确保用户记录存在
            user_name = credentials.email.split("@")[0]
            supabase.table("users").upsert({
                "id": response.user.id,
                "email": response.user.email,
                "name": user_name
            }).execute()
            
            return {
                "success": True,
                "message": "登录成功",
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "name": response.user.user_metadata.get("name", user_name)
                },
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="邮箱或密码错误"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"登录失败: {str(e)}"
        )

@app.post("/api/auth/logout")
async def logout(current_user = Depends(get_current_user)):
    """用户登出"""
    try:
        supabase.auth.sign_out()
        return {"success": True, "message": "登出成功"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"登出失败: {str(e)}"
        )

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """获取当前用户信息"""
    try:
        # 从users表获取完整信息
        result = supabase.table("users").select("*").eq("id", current_user.id).execute()
        if result.data:
            user_data = result.data[0]
            return UserResponse(
                id=user_data["id"],
                email=user_data["email"],
                name=user_data.get("name"),
                created_at=user_data.get("created_at")
            )
        else:
            # 如果users表中没有，返回auth用户信息
            return UserResponse(
                id=current_user.id,
                email=current_user.email,
                name=current_user.user_metadata.get("name")
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"获取用户信息失败: {str(e)}"
        )

# ==================== 好友系统 API ====================

@app.get("/api/users/search", response_model=List[SearchUserResponse])
async def search_users(query: str, current_user = Depends(get_current_user)):
    """搜索用户（通过邮箱或用户名）"""
    try:
        # 搜索用户 - 使用 ilike 进行模糊搜索
        result_email = supabase.table("users").select("id, email, name").ilike("email", f"%{query}%").limit(20).execute()
        result_name = supabase.table("users").select("id, email, name").ilike("name", f"%{query}%").limit(20).execute()
        
        # 合并结果并去重
        users_dict = {}
        for user in result_email.data:
            if user["id"] != current_user.id:
                users_dict[user["id"]] = user
        for user in result_name.data:
            if user["id"] != current_user.id:
                users_dict[user["id"]] = user
        
        users = []
        for user in users_dict.values():
            users.append(SearchUserResponse(
                id=user["id"],
                email=user["email"],
                name=user.get("name")
            ))
        
        return users[:20]  # 限制返回20个结果
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"搜索失败: {str(e)}"
        )

@app.post("/api/friends/request", response_model=dict)
async def send_friend_request(request: FriendRequestCreate, current_user = Depends(get_current_user)):
    """发送好友请求"""
    try:
        # 检查是否已经是好友
        friend_check = supabase.table("friends").select("*").eq("user_id", current_user.id).eq("friend_id", request.to_user_id).execute()
        
        if friend_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="你们已经是好友了"
            )
        
        # 检查是否已有待处理的请求
        existing_request = supabase.table("friend_requests").select("*").eq("from_user_id", current_user.id).eq("to_user_id", request.to_user_id).eq("status", "pending").execute()
        
        if existing_request.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="已存在待处理的好友请求"
            )
        
        # 创建好友请求
        result = supabase.table("friend_requests").insert({
            "from_user_id": current_user.id,
            "to_user_id": request.to_user_id,
            "status": "pending"
        }).execute()
        
        return {
            "success": True,
            "message": "好友请求已发送",
            "request_id": result.data[0]["id"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"发送好友请求失败: {str(e)}"
        )

@app.get("/api/friends/requests", response_model=List[FriendRequestResponse])
async def get_friend_requests(current_user = Depends(get_current_user)):
    """获取好友请求列表"""
    try:
        # 获取发送的请求
        sent = supabase.table("friend_requests").select("*").eq("from_user_id", current_user.id).eq("status", "pending").execute()
        # 获取收到的请求
        received = supabase.table("friend_requests").select("*").eq("to_user_id", current_user.id).eq("status", "pending").execute()
        
        # 合并并获取用户信息
        all_requests = []
        for req in sent.data + received.data:
            # 获取发送者信息
            from_user_result = supabase.table("users").select("*").eq("id", req["from_user_id"]).execute()
            to_user_result = supabase.table("users").select("*").eq("id", req["to_user_id"]).execute()
            
            from_user_data = from_user_result.data[0] if from_user_result.data else None
            to_user_data = to_user_result.data[0] if to_user_result.data else None
            
            all_requests.append({
                **req,
                "from_user": from_user_data,
                "to_user": to_user_data
            })
        
        result = {"data": all_requests}
        
        requests = []
        for req in result.data:
            requests.append(FriendRequestResponse(
                id=req["id"],
                from_user_id=req["from_user_id"],
                to_user_id=req["to_user_id"],
                status=req["status"],
                created_at=req["created_at"],
                from_user=UserResponse(**req["from_user"]) if req.get("from_user") else None,
                to_user=UserResponse(**req["to_user"]) if req.get("to_user") else None
            ))
        
        return requests
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"获取好友请求失败: {str(e)}"
        )

@app.post("/api/friends/accept/{request_id}", response_model=dict)
async def accept_friend_request(request_id: str, current_user = Depends(get_current_user)):
    """接受好友请求"""
    try:
        # 获取请求信息
        request_result = supabase.table("friend_requests").select("*").eq("id", request_id).execute()
        if not request_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="好友请求不存在"
            )
        
        friend_request = request_result.data[0]
        if friend_request["to_user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权接受此请求"
            )
        
        from_user_id = friend_request["from_user_id"]
        
        # 更新请求状态
        supabase.table("friend_requests").update({"status": "accepted"}).eq("id", request_id).execute()
        
        # 创建双向好友关系
        supabase.table("friends").insert([
            {"user_id": current_user.id, "friend_id": from_user_id},
            {"user_id": from_user_id, "friend_id": current_user.id}
        ]).execute()
        
        return {
            "success": True,
            "message": "已接受好友请求"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"接受好友请求失败: {str(e)}"
        )

@app.post("/api/friends/reject/{request_id}", response_model=dict)
async def reject_friend_request(request_id: str, current_user = Depends(get_current_user)):
    """拒绝好友请求"""
    try:
        # 更新请求状态
        result = supabase.table("friend_requests").update({"status": "rejected"}).eq("id", request_id).eq("to_user_id", current_user.id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="好友请求不存在或无权操作"
            )
        
        return {
            "success": True,
            "message": "已拒绝好友请求"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"拒绝好友请求失败: {str(e)}"
        )

@app.get("/api/friends", response_model=List[FriendResponse])
async def get_friends(current_user = Depends(get_current_user)):
    """获取好友列表"""
    try:
        result = supabase.table("friends").select("*").eq("user_id", current_user.id).execute()
        
        friends = []
        for friendship in result.data:
            # 获取好友信息
            friend_result = supabase.table("users").select("*").eq("id", friendship["friend_id"]).execute()
            friend_data = friend_result.data[0] if friend_result.data else None
            
            friends.append(FriendResponse(
                id=friendship["id"],
                user_id=friendship["user_id"],
                friend_id=friendship["friend_id"],
                created_at=friendship["created_at"],
                friend=UserResponse(**friend_data) if friend_data else None
            ))
        
        return friends
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"获取好友列表失败: {str(e)}"
        )

@app.delete("/api/friends/{friend_id}", response_model=dict)
async def remove_friend(friend_id: str, current_user = Depends(get_current_user)):
    """删除好友"""
    try:
        # 删除双向好友关系
        # 删除 user_id -> friend_id
        supabase.table("friends").delete().eq("user_id", current_user.id).eq("friend_id", friend_id).execute()
        # 删除 friend_id -> user_id
        supabase.table("friends").delete().eq("user_id", friend_id).eq("friend_id", current_user.id).execute()
        
        return {
            "success": True,
            "message": "已删除好友"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"删除好友失败: {str(e)}"
        )

# ==================== 健康检查 ====================

@app.get("/")
async def root():
    return {"message": "Mood Player API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
