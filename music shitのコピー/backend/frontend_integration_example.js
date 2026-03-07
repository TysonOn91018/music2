/**
 * 前端集成示例
 * 展示如何在前端 JavaScript 中调用 Python Backend API
 */

const API_BASE_URL = 'http://localhost:8000';

// ==================== 工具函数 ====================

/**
 * 获取存储的 token
 */
function getToken() {
    return localStorage.getItem('access_token');
}

/**
 * 设置 token
 */
function setToken(token) {
    localStorage.setItem('access_token', token);
}

/**
 * 清除 token
 */
function clearToken() {
    localStorage.removeItem('access_token');
}

/**
 * 通用 API 请求函数
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // 如果有 token，添加到请求头
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
    }
}

// ==================== 认证 API ====================

/**
 * 用户注册
 */
async function register(email, password, name) {
    return await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name })
    });
}

/**
 * 用户登录
 */
async function login(email, password) {
    const result = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    if (result.success && result.access_token) {
        setToken(result.access_token);
    }
    
    return result;
}

/**
 * 用户登出
 */
async function logout() {
    try {
        await apiRequest('/api/auth/logout', {
            method: 'POST'
        });
    } finally {
        clearToken();
    }
}

/**
 * 获取当前用户信息
 */
async function getCurrentUser() {
    return await apiRequest('/api/auth/me');
}

// ==================== 用户搜索 API ====================

/**
 * 搜索用户
 */
async function searchUsers(query) {
    return await apiRequest(`/api/users/search?query=${encodeURIComponent(query)}`);
}

// ==================== 好友系统 API ====================

/**
 * 发送好友请求
 */
async function sendFriendRequest(toUserId) {
    return await apiRequest('/api/friends/request', {
        method: 'POST',
        body: JSON.stringify({ to_user_id: toUserId })
    });
}

/**
 * 获取好友请求列表
 */
async function getFriendRequests() {
    return await apiRequest('/api/friends/requests');
}

/**
 * 接受好友请求
 */
async function acceptFriendRequest(requestId) {
    return await apiRequest(`/api/friends/accept/${requestId}`, {
        method: 'POST'
    });
}

/**
 * 拒绝好友请求
 */
async function rejectFriendRequest(requestId) {
    return await apiRequest(`/api/friends/reject/${requestId}`, {
        method: 'POST'
    });
}

/**
 * 获取好友列表
 */
async function getFriends() {
    return await apiRequest('/api/friends');
}

/**
 * 删除好友
 */
async function deleteFriend(friendId) {
    return await apiRequest(`/api/friends/${friendId}`, {
        method: 'DELETE'
    });
}

// ==================== 使用示例 ====================

// 示例1: 注册和登录
async function example1_registerAndLogin() {
    try {
        // 注册
        const registerResult = await register('user@example.com', 'password123', 'Test User');
        console.log('注册结果:', registerResult);
        
        // 登录
        const loginResult = await login('user@example.com', 'password123');
        console.log('登录结果:', loginResult);
        console.log('Token已保存:', getToken());
        
        // 获取当前用户信息
        const userInfo = await getCurrentUser();
        console.log('当前用户:', userInfo);
    } catch (error) {
        console.error('错误:', error);
    }
}

// 示例2: 搜索用户并发送好友请求
async function example2_searchAndAddFriend() {
    try {
        // 搜索用户
        const users = await searchUsers('test');
        console.log('搜索结果:', users);
        
        if (users.length > 0) {
            const targetUser = users[0];
            
            // 发送好友请求
            const result = await sendFriendRequest(targetUser.id);
            console.log('好友请求已发送:', result);
        }
    } catch (error) {
        console.error('错误:', error);
    }
}

// 示例3: 处理好友请求
async function example3_handleFriendRequests() {
    try {
        // 获取好友请求列表
        const requests = await getFriendRequests();
        console.log('好友请求列表:', requests);
        
        // 处理每个请求
        for (const request of requests) {
            if (request.status === 'pending') {
                // 假设我们接受所有请求（实际应用中应该让用户选择）
                const result = await acceptFriendRequest(request.id);
                console.log('已接受请求:', result);
            }
        }
        
        // 获取更新后的好友列表
        const friends = await getFriends();
        console.log('好友列表:', friends);
    } catch (error) {
        console.error('错误:', error);
    }
}

// ==================== 在现有代码中集成 ====================

/**
 * 替换现有的 Supabase 登录函数
 * 在你的 script.js 中，可以这样替换：
 */
async function signInWithBackend(email, password) {
    try {
        const result = await login(email, password);
        if (result.success) {
            // 更新 UI
            state.user = result.user;
            updateUserUI(true);
            toast("登录成功");
            return true;
        }
    } catch (error) {
        console.error('登录失败:', error);
        toast("登录失败: " + error.message);
        return false;
    }
}

/**
 * 替换现有的搜索用户函数
 */
async function searchUsersWithBackend(query) {
    try {
        const users = await searchUsers(query);
        // 渲染搜索结果
        return users;
    } catch (error) {
        console.error('搜索失败:', error);
        return [];
    }
}

// ==================== 导出（如果使用模块系统） ====================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        register,
        login,
        logout,
        getCurrentUser,
        searchUsers,
        sendFriendRequest,
        getFriendRequests,
        acceptFriendRequest,
        rejectFriendRequest,
        getFriends,
        deleteFriend
    };
}
