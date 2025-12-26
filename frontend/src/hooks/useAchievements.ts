'use client';

import { useState, useEffect } from 'react';
import { ALL_ACHIEVEMENTS, Achievement } from '@/data/achievements';
import { useStorage } from './useStorage';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export function useAchievements() {
  const { history, bookmarks } = useStorage();
  const { isAuthenticated, getAuthHeaders } = useAuth();
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [newUnlock, setNewUnlock] = useState<Achievement | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      // Use backend API for achievements
      checkAchievementsFromAPI();
    } else {
      // Fallback to local storage for guests
      checkAchievementsLocally();
    }
  }, [history.length, bookmarks.length, isAuthenticated]);

  const checkAchievementsFromAPI = async () => {
    try {
      // Get unlocked achievements
      const myRes = await fetch(`${API_URL}/achievements/my/`, {
        headers: { ...getAuthHeaders() },
      });
      if (myRes.ok) {
        const data = await myRes.json();
        const ids = (Array.isArray(data) ? data : data.results || []).map((ua: any) => ua.achievement?.slug || '');
        setUnlockedIds(ids.filter(Boolean));
      }

      // Check for new unlocks
      const checkRes = await fetch(`${API_URL}/achievements/check/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (data.newly_unlocked && data.newly_unlocked.length > 0) {
          const newAch = data.newly_unlocked[0];
          // Find matching achievement from local data for icon
          const localAch = ALL_ACHIEVEMENTS.find(a => a.id === newAch.id || a.title === newAch.name_ar);
          if (localAch) {
            setNewUnlock(localAch);
            setUnlockedIds(prev => [...prev, localAch.id]);
            setTimeout(() => setNewUnlock(null), 5000);
          }
        }
      }
    } catch (e) {
      console.error("Error checking achievements from API", e);
      checkAchievementsLocally();
    }
  };

  const checkAchievementsLocally = () => {
    // 1. تحميل الإنجازات المحفوظة مسبقاً
    const saved = localStorage.getItem('unlocked_achievements');
    const currentUnlocked = saved ? JSON.parse(saved) : [];
    setUnlockedIds(currentUnlocked);

    // 2. تجميع الإحصائيات الحالية للمستخدم
    const stats = {
      readingCount: history.length,
      favCount: bookmarks.length,
      readingTime: parseInt(localStorage.getItem('total_reading_seconds') || '0'),
      commentCount: 0
    };

    // حساب عدد التعليقات
    let totalComments = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('comments_')) {
        const comments = JSON.parse(localStorage.getItem(key) || '[]');
        totalComments += comments.filter((c: any) => c.user === 'أنت').length;
      }
    }
    stats.commentCount = totalComments;

    // 3. فحص الإنجازات الجديدة
    const newUnlockedIds = [...currentUnlocked];
    let newlyUnlockedItem: Achievement | null = null;

    ALL_ACHIEVEMENTS.forEach(ach => {
      if (newUnlockedIds.includes(ach.id)) return;

      let unlocked = false;

      if (ach.category === 'reading' && stats.readingCount >= ach.threshold) unlocked = true;
      if (ach.category === 'time' && stats.readingTime >= ach.threshold) unlocked = true;
      if (ach.category === 'collection' && stats.favCount >= ach.threshold) unlocked = true;
      if (ach.category === 'social' && stats.commentCount >= ach.threshold) unlocked = true;

      if (ach.id === 'secret_night') {
        const hour = new Date().getHours();
        if (hour >= 3 && hour < 5 && history.length > 0) unlocked = true;
      }

      if (unlocked) {
        newUnlockedIds.push(ach.id);
        newlyUnlockedItem = ach;
      }
    });

    // 4. حفظ التحديثات إذا وجد جديد
    if (newUnlockedIds.length > currentUnlocked.length) {
      setUnlockedIds(newUnlockedIds);
      localStorage.setItem('unlocked_achievements', JSON.stringify(newUnlockedIds));
      if (newlyUnlockedItem) {
        setNewUnlock(newlyUnlockedItem);
        setTimeout(() => setNewUnlock(null), 5000);
      }
    }
  };

  return { unlockedIds, newUnlock, closeNotification: () => setNewUnlock(null) };
}
