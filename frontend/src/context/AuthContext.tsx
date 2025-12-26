// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// تعريف شكل بيانات المستخدم
interface User {
  id?: string;
  name: string;
  email: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  points?: number;
  equipped_title?: string; // اللقب المجهز من الإنجازات
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  getAuthHeaders: () => { Authorization: string } | {};
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // عند تحميل الموقع، نتأكد هل هناك مستخدم محفوظ في المتصفح؟
  useEffect(() => {
    const savedUser = localStorage.getItem('manga_user');
    const savedToken = localStorage.getItem('manga_token');
    const savedRefresh = localStorage.getItem('manga_refresh');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
      setRefreshToken(savedRefresh);
    }
    setIsLoading(false);
  }, []);

  // دالة للحصول على headers المصادقة
  const getAuthHeaders = () => {
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  // تحديث التوكن تلقائياً قبل انتهاء صلاحيته
  const refreshAccessToken = async () => {
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.access);
        setRefreshToken(data.refresh);
        localStorage.setItem('manga_token', data.access);
        localStorage.setItem('manga_refresh', data.refresh);
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }
    return false;
  };

  // دالة تسجيل الدخول - تتصل بالـ Backend
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const userData: User = {
          id: data.user?.id,
          name: data.user?.username || email.split('@')[0],
          email: data.user?.email || email,
          is_staff: data.user?.is_staff || false,
          is_superuser: data.user?.is_superuser || false,
          points: data.user?.points || 100,
          equipped_title: data.user?.equipped_title,
        };

        // تصفية بيانات المستخدم القديم إذا كان مختلف
        const oldUser = localStorage.getItem('manga_user');
        if (oldUser) {
          const oldUserData = JSON.parse(oldUser);
          if (oldUserData.id !== userData.id) {
            // حذف بيانات المستخدم القديم
            localStorage.removeItem('manga_bookmarks');
            localStorage.removeItem('manga_history');
            localStorage.removeItem('unlocked_achievements');
            localStorage.removeItem('total_reading_seconds');
            localStorage.removeItem('equipped_title');
            localStorage.removeItem('equipped_title_name');
            localStorage.removeItem('equipped_title_rarity');
            // Clear rating and comment localStorage
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('rating_') || key.startsWith('comments_')) {
                localStorage.removeItem(key);
              }
            });
          }
        }

        // حفظ بيانات المستخدم والـ tokens
        setUser(userData);
        setToken(data.tokens?.access);
        setRefreshToken(data.tokens?.refresh);

        localStorage.setItem('manga_user', JSON.stringify(userData));
        localStorage.setItem('manga_token', data.tokens?.access || '');
        localStorage.setItem('manga_refresh', data.tokens?.refresh || '');

        return { success: true };
      }

      return { success: false, error: data.error || 'بيانات الدخول غير صحيحة' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'خطأ في الاتصال بالخادم' };
    }
  };

  // دالة إنشاء حساب جديد
  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const userData: User = {
          id: data.user?.id,
          name: data.user?.username || username,
          email: data.user?.email || email,
          is_staff: data.user?.is_staff || false,
          is_superuser: data.user?.is_superuser || false,
          points: data.user?.points || 100, // New users get 100 points
          equipped_title: data.user?.equipped_title,
        };

        // Clear any previous user data for fresh start
        localStorage.removeItem('manga_bookmarks');
        localStorage.removeItem('manga_history');
        localStorage.removeItem('unlocked_achievements');
        localStorage.removeItem('total_reading_seconds');
        localStorage.removeItem('equipped_title');
        localStorage.removeItem('equipped_title_name');
        localStorage.removeItem('equipped_title_rarity');
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('rating_') || key.startsWith('comments_')) {
            localStorage.removeItem(key);
          }
        });

        // حفظ بيانات المستخدم والـ tokens
        setUser(userData);
        setToken(data.tokens?.access);
        setRefreshToken(data.tokens?.refresh);

        localStorage.setItem('manga_user', JSON.stringify(userData));
        localStorage.setItem('manga_token', data.tokens?.access || '');
        localStorage.setItem('manga_refresh', data.tokens?.refresh || '');

        return { success: true };
      }

      return { success: false, error: data.error || 'فشل إنشاء الحساب' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'خطأ في الاتصال بالخادم' };
    }
  };

  // دالة تسجيل الخروج - تحذف كل بيانات المستخدم
  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);

    // حذف بيانات المصادقة
    localStorage.removeItem('manga_user');
    localStorage.removeItem('manga_token');
    localStorage.removeItem('manga_refresh');

    // حذف بيانات المستخدم الخاصة
    localStorage.removeItem('manga_bookmarks');
    localStorage.removeItem('manga_history');
    localStorage.removeItem('unlocked_achievements');
    localStorage.removeItem('total_reading_seconds');
    localStorage.removeItem('equipped_title');
    localStorage.removeItem('equipped_title_name');
    localStorage.removeItem('equipped_title_rarity');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      isLoading,
      isAuthenticated: !!user && !!token,
      getAuthHeaders
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// دالة خطافية (Hook) لاستخدام السياق بسهولة
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
