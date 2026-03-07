"""
数据库管理脚本
用于初始化和管理Supabase数据库
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://nlavqjsztdfxksjusyky.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_SERVICE_KEY:
    print("警告: 未设置 SUPABASE_SERVICE_KEY，某些操作可能需要管理员权限")

def init_database():
    """初始化数据库表结构"""
    print("正在初始化数据库...")
    
    # 注意：这个脚本需要你在Supabase Dashboard的SQL Editor中手动执行SQL
    # 因为Supabase Python客户端不直接支持执行DDL语句
    
    sql_file = "../friends-setup.sql"
    if os.path.exists(sql_file):
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        print("\n请在Supabase Dashboard的SQL Editor中执行以下SQL:\n")
        print("=" * 60)
        print(sql_content)
        print("=" * 60)
    else:
        print("未找到 friends-setup.sql 文件")

def check_tables():
    """检查数据库表是否存在"""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY or os.getenv("SUPABASE_KEY"))
        
        tables = ["users", "friend_requests", "friends"]
        print("\n检查数据库表...")
        
        for table in tables:
            try:
                result = supabase.table(table).select("count", count="exact").limit(1).execute()
                print(f"✓ {table} 表存在")
            except Exception as e:
                print(f"✗ {table} 表不存在或无法访问: {str(e)}")
    except Exception as e:
        print(f"检查失败: {str(e)}")

def list_users():
    """列出所有用户"""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY or os.getenv("SUPABASE_KEY"))
        result = supabase.table("users").select("*").execute()
        
        print(f"\n用户列表 (共 {len(result.data)} 个用户):")
        print("-" * 60)
        for user in result.data:
            print(f"ID: {user['id']}")
            print(f"  邮箱: {user['email']}")
            print(f"  姓名: {user.get('name', 'N/A')}")
            print(f"  创建时间: {user.get('created_at', 'N/A')}")
            print()
    except Exception as e:
        print(f"获取用户列表失败: {str(e)}")

def list_friends():
    """列出所有好友关系"""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY or os.getenv("SUPABASE_KEY"))
        result = supabase.table("friends").select("*, user:users!friends_user_id_fkey(*), friend:users!friends_friend_id_fkey(*)").execute()
        
        print(f"\n好友关系列表 (共 {len(result.data)} 条):")
        print("-" * 60)
        for friendship in result.data:
            user = friendship.get("user", {})
            friend = friendship.get("friend", {})
            print(f"用户: {user.get('email', 'N/A')} <-> 好友: {friend.get('email', 'N/A')}")
            print(f"  创建时间: {friendship.get('created_at', 'N/A')}")
            print()
    except Exception as e:
        print(f"获取好友列表失败: {str(e)}")

def list_friend_requests():
    """列出所有好友请求"""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY or os.getenv("SUPABASE_KEY"))
        result = supabase.table("friend_requests").select(
            "*, from_user:users!friend_requests_from_user_id_fkey(*), to_user:users!friend_requests_to_user_id_fkey(*)"
        ).execute()
        
        print(f"\n好友请求列表 (共 {len(result.data)} 条):")
        print("-" * 60)
        for req in result.data:
            from_user = req.get("from_user", {})
            to_user = req.get("to_user", {})
            print(f"从: {from_user.get('email', 'N/A')} -> 到: {to_user.get('email', 'N/A')}")
            print(f"  状态: {req.get('status', 'N/A')}")
            print(f"  创建时间: {req.get('created_at', 'N/A')}")
            print()
    except Exception as e:
        print(f"获取好友请求列表失败: {str(e)}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("用法:")
        print("  python db_manager.py init      - 显示数据库初始化SQL")
        print("  python db_manager.py check     - 检查数据库表")
        print("  python db_manager.py users     - 列出所有用户")
        print("  python db_manager.py friends   - 列出所有好友关系")
        print("  python db_manager.py requests  - 列出所有好友请求")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "init":
        init_database()
    elif command == "check":
        check_tables()
    elif command == "users":
        list_users()
    elif command == "friends":
        list_friends()
    elif command == "requests":
        list_friend_requests()
    else:
        print(f"未知命令: {command}")
