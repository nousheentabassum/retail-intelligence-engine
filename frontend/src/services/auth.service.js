import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
    
    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      this.user = JSON.parse(localStorage.getItem('auth_user') || 'null');
    }
  }

  async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      const { token, user } = response.data;
      
      this.setAuth(token, user);
      return { token, user };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  async register(userData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }

  async getProfile() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      
      this.user = response.data.user;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(this.user));
      }
      
      return this.user;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get profile');
    }
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  isAuthenticated() {
    return !!this.token;
  }

  getAuthHeader() {
    return this.token ? `Bearer ${this.token}` : null;
  }

  getUser() {
    return this.user;
  }

  hasRole(role) {
    return this.user?.role === role;
  }
}

export const authService = new AuthService();
