/**
 * Python Backend API 客户端
 * 用于替代直接的 Supabase 调用
 */

const API_BASE_URL = window.MOOD_PLAYER_API_URL || 'http://localhost:8000';

// ==================== Token 管理 ====================

function getToken() {
  return localStorage.getItem('access_token');
}

function setToken(token) {
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
}

function clearToken() {
  localStorage.removeItem('access_token');
}

// ==================== 通用 API 请求 ====================

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // 如果有 token，添加到请求头
  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // 如果不是 JSON，尝试读取文本
      const text = await response.text();
      console.error('非JSON响应:', text);
      throw new Error(`服务器返回了非JSON响应: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      const errorMsg = data.detail || data.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (error) {
    console.error('API请求失败:', {
      url,
      endpoint,
      error: error.message,
      stack: error.stack
    });
    
    // 如果是网络错误，提供更友好的错误信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('无法连接到服务器，请确保后端服务正在运行 (http://localhost:8000)');
    }
    
    throw error;
  }
}

// ==================== 认证 API ====================

async function apiRegister(email, password, name) {
  return await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
    skipAuth: true
  });
}

async function apiLogin(email, password) {
  try {
    const result = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true
    });
    
    console.log('登录API响应:', result);
    
    if (result.success && result.access_token) {
      setToken(result.access_token);
      console.log('Token已保存');
    }
    
    return result;
  } catch (error) {
    console.error('登录API调用失败:', error);
    // 如果是网络错误，提供更友好的错误信息
    if (error.message && error.message.includes('fetch')) {
      throw new Error('无法连接到后端服务器，请确保后端服务正在运行 (http://localhost:8000)');
    }
    throw error;
  }
}

async function apiLogout() {
  try {
    await apiRequest('/api/auth/logout', {
      method: 'POST'
    });
  } finally {
    clearToken();
  }
}

async function apiGetCurrentUser() {
  return await apiRequest('/api/auth/me');
}

// ==================== 用户搜索 API ====================

async function apiSearchUsers(query) {
  return await apiRequest(`/api/users/search?query=${encodeURIComponent(query)}`);
}

// ==================== 好友系统 API ====================

async function apiSendFriendRequest(toUserId) {
  return await apiRequest('/api/friends/request', {
    method: 'POST',
    body: JSON.stringify({ to_user_id: toUserId })
  });
}

async function apiGetFriendRequests() {
  return await apiRequest('/api/friends/requests');
}

async function apiAcceptFriendRequest(requestId) {
  return await apiRequest(`/api/friends/accept/${requestId}`, {
    method: 'POST'
  });
}

async function apiRejectFriendRequest(requestId) {
  return await apiRequest(`/api/friends/reject/${requestId}`, {
    method: 'POST'
  });
}

async function apiGetFriends() {
  return await apiRequest('/api/friends');
}

async function apiDeleteFriend(friendId) {
  return await apiRequest(`/api/friends/${friendId}`, {
    method: 'DELETE'
  });
}
