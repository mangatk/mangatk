// // src/context/AuthContext.tsx
// 'use client';

// import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { useAuth0 } from '@auth0/auth0-react';

// // تعريف شكل بيانات المستخدم
// interface User {
//   id?: string;
//   name: string;
//   email: string;
//   is_staff?: boolean;
//   is_superuser?: boolean;
//   points?: number;
//   equipped_title?: string; // اللقب المجهز من الإنجازات
//   equipped_achievement_icon?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   token: string | null;
//   login: (email?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
//   register: (username?: string, email?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
//   logout: () => void;
//   isLoading: boolean;
//   isAuthenticated: boolean;
//   getAuthHeaders: () => { Authorization: string } | {};
// }

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const {
//     isAuthenticated: auth0IsAuthenticated,
//     isLoading: auth0IsLoading,
//     user: auth0User,
//     getAccessTokenSilently,
//     loginWithRedirect,
//     logout: auth0Logout,
//   } = useAuth0();

//   const [user, setUser] = useState<User | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [isSyncing, setIsSyncing] = useState(true);

//   useEffect(() => {
//     let isMounted = true;

//     const syncUser = async () => {
//       if (auth0IsLoading) {
//         setIsSyncing(true);
//         return;
//       }

//       if (!auth0IsAuthenticated) {
//         if (isMounted) {
//           setUser(null);
//           setToken(null);
//           localStorage.removeItem('manga_token');
//           setIsSyncing(false);
//         }
//         return;
//       }

//       // try {
//       //   const accessToken = await getAccessTokenSilently();

//       //   if (isMounted) setToken(accessToken);
//       //   localStorage.setItem('manga_token', accessToken);

//       //   // Determine correct display name from Auth0
//       //   const activeName = auth0User?.nickname || auth0User?.name || auth0User?.email?.split('@')[0];

//       //   // Fetch our custom user profile from Django backend while syncing the name
//       //   const res = await fetch(`${API_URL}/auth/profile/`, {
//       //     method: 'PATCH',
//       //     headers: {
//       //       'Authorization': `Bearer ${accessToken}`,
//       //       'Content-Type': 'application/json'
//       //     },
//       //     body: JSON.stringify({ name: activeName || '' })
//       //   });

//       //   if (res.ok) {
//       //     const data = await res.json();
//       //     if (isMounted) {
//       //       setUser({
//       //         id: data.id,
//       //         name: data.first_name || activeName || data.username,
//       //         email: auth0User?.email || data.email,
//       //         is_staff: data.is_staff,
//       //         is_superuser: data.is_superuser,
//       //         points: data.points,
//       //         equipped_title: data.equipped_title,
//       //         equipped_achievement_icon: data.equipped_achievement_icon,
//       //       });
//       //     }
//       //   } else {
//       //     console.error('Failed to sync user profile from backend');
//       //   }
//       // } catch (error: any) {
//       //   console.error('Error fetching Auth0 token or syncing profile:', error);
//       //   // If Auth0 requires explicit consent for the API audience, silent token fetch fails.
//       //   // We must trigger an interactive login so the user can click "Accept".
//       //   if (error?.error === 'consent_required' || error?.message === 'Consent required') {
//       //       console.warn('Auth0 API Consent Required. Redirecting to consent screen...');
//       //       if (isMounted) {
//       //           loginWithRedirect();
//       //       }
//       //   }
//       // } finally {
//       //   if (isMounted) setIsSyncing(false);
//       // }
//       try {
//   const accessToken = await getAccessTokenSilently();

//   if (isMounted) setToken(accessToken);
//   localStorage.setItem('manga_token', accessToken);

//   // Only fetch profile, do NOT overwrite display name from Auth0
//   const res = await fetch(`${API_URL}/auth/profile/`, {
//     method: 'GET',
//     headers: {
//       'Authorization': `Bearer ${accessToken}`,
//       'Content-Type': 'application/json'
//     }
//   });

//   if (res.ok) {
//     const data = await res.json();

//     const fallbackName =
//       data.public_display_name ||
//       data.display_name ||
//       auth0User?.nickname ||
//       auth0User?.name ||
//       data.username ||
//       auth0User?.email?.split('@')[0] ||
//       'User';

//     if (isMounted) {
//       setUser({
//         id: data.id,
//         name: fallbackName,
//         email: auth0User?.email || data.email,
//         is_staff: data.is_staff,
//         is_superuser: data.is_superuser,
//         points: data.points,
//         equipped_title: data.equipped_title,
//         equipped_achievement_icon: data.equipped_achievement_icon,
//       });
//     }
//   } else {
//     console.error('Failed to fetch backend profile');
//   }
// } catch (error: any) {
//   console.error('Error fetching Auth0 token or backend profile:', error);
//   if (error?.error === 'consent_required' || error?.message === 'Consent required') {
//     if (isMounted) {
//       loginWithRedirect();
//     }
//   }
// } finally {
//   if (isMounted) setIsSyncing(false);
// }
//     };

//     syncUser();

//     return () => {
//       isMounted = false;
//     };
//   }, [auth0IsAuthenticated, auth0IsLoading, getAccessTokenSilently, auth0User]);

//   const getAuthHeaders = () => {
//     if (token) {
//       return { Authorization: `Bearer ${token}` };
//     }
//     return {};
//   };

//   const login = async (): Promise<{ success: boolean; error?: string }> => {
//     await loginWithRedirect();
//     return { success: true };
//   };

//   const register = async (): Promise<{ success: boolean; error?: string }> => {
//     await loginWithRedirect({
//       authorizationParams: {
//         screen_hint: 'signup',
//       }
//     });
//     return { success: true };
//   };

//   const logout = () => {
//     // Clear custom local storage items
//     localStorage.removeItem('manga_bookmarks');
//     localStorage.removeItem('manga_history');
//     localStorage.removeItem('unlocked_achievements');
//     localStorage.removeItem('total_reading_seconds');
//     localStorage.removeItem('equipped_title');
//     localStorage.removeItem('equipped_title_name');
//     localStorage.removeItem('equipped_title_rarity');
//     Object.keys(localStorage).forEach(key => {
//       if (key.startsWith('rating_') || key.startsWith('comments_')) {
//         localStorage.removeItem(key);
//       }
//     });

//     auth0Logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : '' } });
//   };

//   return (
//     <AuthContext.Provider value={{
//       user,
//       token,
//       login,
//       register,
//       logout,
//       isLoading: auth0IsLoading || isSyncing,
//       isAuthenticated: !!user && !!token,
//       getAuthHeaders
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

interface User {
  id?: string;
  name: string;
  email: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  points?: number;
  equipped_title?: string;
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
  refreshUserProfile: () => Promise<void>;
  updateLocalUserName: (newName: string) => void;
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

  const applyBackendProfileToUser = (data: any) => {
    const fallbackName =
      data.public_display_name ||
      data.display_name ||
      data.first_name ||
      data.username ||
      auth0User?.nickname ||
      auth0User?.name ||
      auth0User?.email?.split('@')[0] ||
      'User';

    setUser({
      id: data.id,
      name: fallbackName,
      email: auth0User?.email || data.email || '',
      is_staff: data.is_staff,
      is_superuser: data.is_superuser,
      points: data.points,
      equipped_title: data.equipped_title,
      equipped_achievement_icon: data.equipped_achievement_icon,
    });
  };

  const refreshUserProfile = async () => {
    try {
      let accessToken = token;

      if (!accessToken) {
        accessToken = await getAccessTokenSilently();
        setToken(accessToken);
        localStorage.setItem('manga_token', accessToken);
      }

      const res = await fetch(`${API_URL}/auth/profile/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await res.json();
      applyBackendProfileToUser(data);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const updateLocalUserName = (newName: string) => {
    setUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        name: newName,
      };
    });
  };

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

        // IMPORTANT:
        // Do NOT PATCH the Auth0 / Google name into backend profile.
        // Only fetch backend profile and use display_name/public_display_name.
        const res = await fetch(`${API_URL}/auth/profile/`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const fallbackName =
              data.public_display_name ||
              data.display_name ||
              data.first_name ||
              data.username ||
              auth0User?.nickname ||
              auth0User?.name ||
              auth0User?.email?.split('@')[0] ||
              'User';

            setUser({
              id: data.id,
              name: fallbackName,
              email: auth0User?.email || data.email || '',
              is_staff: data.is_staff,
              is_superuser: data.is_superuser,
              points: data.points,
              equipped_title: data.equipped_title,
              equipped_achievement_icon: data.equipped_achievement_icon,
            });
          }
        } else {
          console.error('Failed to fetch backend profile');
        }
      } catch (error: any) {
        console.error('Error fetching Auth0 token or backend profile:', error);

        if (error?.error === 'consent_required' || error?.message === 'Consent required') {
          if (isMounted) {
            loginWithRedirect();
          }
        }
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    syncUser();

    return () => {
      isMounted = false;
    };
  }, [auth0IsAuthenticated, auth0IsLoading, getAccessTokenSilently, auth0User, loginWithRedirect]);

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
    await loginWithRedirect();
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('manga_token');

    auth0Logout({
      logoutParams: {
        returnTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isLoading: auth0IsLoading || isSyncing,
        isAuthenticated: !!user && auth0IsAuthenticated,
        getAuthHeaders,
        refreshUserProfile,
        updateLocalUserName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
