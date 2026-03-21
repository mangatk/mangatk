// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

// تعريف شكل بيانات المستخدم
interface User {
  id?: string;
  name: string;
  email: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  points?: number;
  equipped_title?: string; // اللقب المجهز من الإنجازات
  equipped_achievement_icon?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (username?: string, email?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  getAuthHeaders: () => { Authorization: string } | {};
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0IsLoading,
    user: auth0User,
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncUser = async () => {
      if (auth0IsLoading) {
        setIsSyncing(true);
        return;
      }

      if (!auth0IsAuthenticated) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('manga_token');
          setIsSyncing(false);
        }
        return;
      }

      try {
        const accessToken = await getAccessTokenSilently();

        if (isMounted) setToken(accessToken);
        localStorage.setItem('manga_token', accessToken);

        // Fetch our custom user profile from Django backend
        const res = await fetch(`${API_URL}/auth/profile/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUser({
              id: data.id,
              name: auth0User?.nickname || auth0User?.name || auth0User?.email?.split('@')[0] || data.username,
              email: auth0User?.email || data.email,
              is_staff: data.is_staff,
              is_superuser: data.is_superuser,
              points: data.points,
              equipped_title: data.equipped_title,
              equipped_achievement_icon: data.equipped_achievement_icon,
            });
          }
        } else {
          console.error('Failed to sync user profile from backend');
        }
      } catch (error) {
        console.error('Error fetching Auth0 token or syncing profile:', error);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    syncUser();

    return () => {
      isMounted = false;
    };
  }, [auth0IsAuthenticated, auth0IsLoading, getAccessTokenSilently, auth0User]);

  const getAuthHeaders = () => {
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  const login = async (): Promise<{ success: boolean; error?: string }> => {
    await loginWithRedirect();
    return { success: true };
  };

  const register = async (): Promise<{ success: boolean; error?: string }> => {
    await loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup',
      }
    });
    return { success: true };
  };

  const logout = () => {
    // Clear custom local storage items
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

    auth0Logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : '' } });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      isLoading: auth0IsLoading || isSyncing,
      isAuthenticated: !!user && !!token,
      getAuthHeaders
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
