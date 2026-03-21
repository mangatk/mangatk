'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import toast from 'react-hot-toast';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  link?: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenIdsRef = useRef<Set<number>>(new Set());

  // Restore seen IDs from localStorage to prevent duplicate toasts across page reloads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIds = localStorage.getItem('seenNotificationIds');
      if (savedIds) {
        try {
          const parsed = JSON.parse(savedIds);
          seenIdsRef.current = new Set(parsed);
        } catch (e) {}
      }
    }
  }, []);

  const saveSeenIds = (ids: Set<number>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('seenNotificationIds', JSON.stringify(Array.from(ids)));
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${API_BASE_URL}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      
      const items = Array.isArray(data) ? data : (data.results || []);
      setNotifications(items);
      setUnreadCount(items.filter((n: AppNotification) => !n.is_read).length);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  }, [getAccessTokenSilently, isAuthenticated]);

  const markAllAsRead = async () => {
    if (!isAuthenticated) return;
    try {
      const token = await getAccessTokenSilently();
      await fetch(`${API_BASE_URL}/notifications/mark_all_read/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  // Poll database for alerts every 15 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Display new toasts only for unread notifications we haven't seen before
  useEffect(() => {
    if (notifications.length === 0) return;

    const newNotifications = notifications.filter(
      (n) => !seenIdsRef.current.has(n.id) && !n.is_read
    );

    newNotifications.forEach((n) => {
      // Pop up toast for 12 hours as requested (43200000 ms), but dimiss on click
      toast.custom((t) => (
        <div 
          onClick={() => { 
            if (n.link) window.location.href = n.link; 
            toast.dismiss(t.id);
          }} 
          className="bg-slate-800 text-white rounded-xl shadow-2xl overflow-hidden flex flex-col gap-1 p-4 mb-2 min-w-[300px] border border-white/10"
          style={{ 
            cursor: n.link ? 'pointer' : 'default',
            animation: t.visible ? 'custom-enter 0.3s ease' : 'custom-leave 0.4s ease forwards'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔔</span>
            <span className="font-bold text-blue-300">{n.title}</span>
          </div>
          <div className="text-sm text-slate-300 pr-7">{n.message}</div>
        </div>
      ), {
        duration: 2000, // 2 seconds
        position: 'top-right',
      });
      seenIdsRef.current.add(n.id);
    });

    // Update seen cache and persist to local storage
    notifications.forEach(n => seenIdsRef.current.add(n.id));
    saveSeenIds(seenIdsRef.current);

  }, [notifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
