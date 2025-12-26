'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export function useReadingTime(isReading: boolean, chapterId?: string) {
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const { user, getAuthHeaders } = useAuth();

  useEffect(() => {
    if (!isReading) return;

    const interval = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);

      // Send to backend if >= 30 seconds
      if (sessionSeconds >= 30 && user && chapterId) {
        fetch(`${API_URL}/reading-history/`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chapter_id: chapterId,
            reading_seconds: sessionSeconds
          })
        })
          .then(res => res.json())
          .then(data => {
            if (data.points_awarded) {
              console.log('Points awarded!', data.total_points);
            }
          })
          .catch(err => console.error('Failed to update reading time:', err));
      }
    };
  }, [isReading, sessionSeconds, user, chapterId]);

  return { sessionSeconds };
}

// دالة مساعدة لتحويل الثواني إلى (يوم، ساعة، دقيقة)
export function formatReadingTime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return { days, hours, minutes };
}