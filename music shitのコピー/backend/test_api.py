"""
API 测试脚本
用于测试 Mood Player Backend API 的各项功能
"""

import requests
import json
from typing import Optional

BASE_URL = "http://localhost:8000"

class APITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.access_token: Optional[str] = None
        self.user_id: Optional[str] = None
    
    def print_response(self, response, title="响应"):
        """打印响应结果"""
        print(f"\n{'='*60}")
        print(f"{title}")
        print(f"{'='*60}")
        print(f"状态码: {response.status_code}")
        try:
            data = response.json()
            print(f"响应数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
            return data
        except:
            print(f"响应文本: {response.text}")
            return None
    
    def test_health_check(self):
        """测试健康检查"""
        print("\n🔍 测试健康检查...")
        response = requests.get(f"{self.base_url}/health")
        self.print_response(response, "健康检查")
        return response.status_code == 200
    
    def test_register(self, email: str, password: str, name: str):
        """测试用户注册"""
        print("\n📝 测试用户注册...")
        data = {
            "email": email,
            "password": password,
            "name": name
        }
        response = requests.post(
            f"{self.base_url}/api/auth/register",
            json=data
        )
        result = self.print_response(response, "用户注册")
        return result
    
    def test_login(self, email: str, password: str):
        """测试用户登录"""
        print("\n🔐 测试用户登录...")
        data = {
            "email": email,
            "password": password
        }
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json=data
        )
        result = self.print_response(response, "用户登录")
        
        if result and result.get("success"):
            self.access_token = result.get("access_token")
            self.user_id = result.get("user", {}).get("id")
            print(f"\n✅ 登录成功！Token: {self.access_token[:50]}...")
            print(f"✅ 用户ID: {self.user_id}")
        
        return result
    
    def test_get_current_user(self):
        """测试获取当前用户信息"""
        if not self.access_token:
            print("\n❌ 未登录，跳过测试")
            return None
        
        print("\n👤 测试获取当前用户信息...")
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(
            f"{self.base_url}/api/auth/me",
            headers=headers
        )
        result = self.print_response(response, "当前用户信息")
        return result
    
    def test_search_users(self, query: str):
        """测试搜索用户"""
        if not self.access_token:
            print("\n❌ 未登录，跳过测试")
            return None
        
        print(f"\n🔍 测试搜索用户 (查询: {query})...")
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(
            f"{self.base_url}/api/users/search",
            params={"query": query},
            headers=headers
        )
        result = self.print_response(response, "搜索结果")
        return result
    
    def test_send_friend_request(self, to_user_id: str):
        """测试发送好友请求"""
        if not self.access_token:
            print("\n❌ 未登录，跳过测试")
            return None
        
        print(f"\n📤 测试发送好友请求 (目标用户ID: {to_user_id})...")
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        data = {"to_user_id": to_user_id}
        response = requests.post(
            f"{self.base_url}/api/friends/request",
            json=data,
            headers=headers
        )
        result = self.print_response(response, "发送好友请求")
        return result
    
    def test_get_friend_requests(self):
        """测试获取好友请求列表"""
        if not self.access_token:
            print("\n❌ 未登录，跳过测试")
            return None
        
        print("\n📬 测试获取好友请求列表...")
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(
            f"{self.base_url}/api/friends/requests",
            headers=headers
        )
        result = self.print_response(response, "好友请求列表")
        return result
    
    def test_accept_friend_request(self, request_id: str):
        """测试接受好友请求"""
        if not self.access_token:
            print("\n❌ 未登录，跳过测试")
            return None
        
        print(f"\n✅ 测试接受好友请求 (请求ID: {request_id})...")
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.post(
            f"{self.base_url}/api/friends/accept/{request_id}",
            headers=headers
        )
        result = self.print_response(response, "接受好友请求")
        return result
    
    def test_get_friends(self):
        """测试获取好友列表"""
        if not self.access_token:
            print("\n❌ 未登录，跳过测试")
            return None
        
        print("\n👥 测试获取好友列表...")
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(
            f"{self.base_url}/api/friends",
            headers=headers
        )
        result = self.print_response(response, "好友列表")
        return result
    
    def test_delete_friend(self, friend_id: str):
        """测试删除好友"""
        if not self.access_token:
            print("\n❌ 未登录，跳过测试")
            return None
        
        print(f"\n🗑️ 测试删除好友 (好友ID: {friend_id})...")
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.delete(
            f"{self.base_url}/api/friends/{friend_id}",
            headers=headers
        )
        result = self.print_response(response, "删除好友")
        return result

def main():
    """主测试流程"""
    print("="*60)
    print("Mood Player API 测试脚本")
    print("="*60)
    
    tester = APITester()
    
    # 1. 健康检查
    if not tester.test_health_check():
        print("\n❌ 服务器未运行，请先启动服务器：python main.py")
        return
    
    # 2. 测试用户注册（如果需要）
    print("\n" + "="*60)
    print("提示: 如果用户已存在，注册会失败，这是正常的")
    print("="*60)
    
    test_email = "test@example.com"
    test_password = "testpassword123"
    test_name = "Test User"
    
    # 尝试注册（可能会失败，如果用户已存在）
    tester.test_register(test_email, test_password, test_name)
    
    # 3. 测试登录
    login_result = tester.test_login(test_email, test_password)
    if not login_result or not login_result.get("success"):
        print("\n❌ 登录失败，无法继续测试")
        return
    
    # 4. 获取当前用户信息
    tester.test_get_current_user()
    
    # 5. 搜索用户
    tester.test_search_users("test")
    
    # 6. 获取好友请求列表
    requests_list = tester.test_get_friend_requests()
    
    # 7. 如果有待处理的请求，可以接受
    if requests_list and len(requests_list) > 0:
        print("\n发现待处理的好友请求，可以手动测试接受功能")
        print("使用: tester.test_accept_friend_request('request_id')")
    
    # 8. 获取好友列表
    tester.test_get_friends()
    
    print("\n" + "="*60)
    print("✅ 基本测试完成！")
    print("="*60)
    print("\n提示:")
    print("- 要测试发送好友请求，需要另一个用户的ID")
    print("- 要测试接受请求，需要请求ID")
    print("- 可以在 Swagger UI (http://localhost:8000/docs) 中查看更多API")

if __name__ == "__main__":
    main()
