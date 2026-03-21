'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export function useReadingTime(isReading: boolean, chapterId?: string) {
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const { user, getAuthHeaders } = useAuth();
  
  // Guard ref to prevent duplicate fetches in React Strict Mode or fast navigations
  const requestSentRef = useRef(false);
  const sessionSecondsRef = useRef(0);

  // Sync state to ref for unmount access
  useEffect(() => {
    sessionSecondsRef.current = sessionSeconds;
  }, [sessionSeconds]);

  // Handle the actual API submission
  const submitReadingTime = () => {
    const currentSeconds = sessionSecondsRef.current;
    
    // Send to backend if >= 30 seconds and we haven't already sent it
    if (currentSeconds >= 30 && user && chapterId && !requestSentRef.current) {
      requestSentRef.current = true;
      fetch(`${API_URL}/reading-history/`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chapter_id: chapterId,
          reading_seconds: currentSeconds
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.points_awarded) {
            console.log('Points awarded!', data.total_points);
            try {
                toast.success('تمت إضافة نقطة 🪙 كمكافأة على القراءة!', {
                    duration: 4000,
                    position: 'bottom-center'
                });
            } catch (e) {
                // Next.js may destroy the toast provider during fast navigations.
                console.log("Toast provider missing during navigation, falling back to silent or native alert if needed.");
            }
          }
        })
        .catch(err => console.error('Failed to update reading time:', err));
    }
  };

  useEffect(() => {
    if (!isReading) return;
    
    // Reset guard and timer when starting a new reading session
    requestSentRef.current = false;
    setSessionSeconds(0);

    const interval = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);

    // Capture tab close/refresh events
    const handleBeforeUnload = () => submitReadingTime();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Also flush when the component unmounts (e.g. Next.js soft navigation)
      submitReadingTime();
    };
  }, [isReading, user, chapterId]);

  return { sessionSeconds };
}

// دالة مساعدة لتحويل الثواني إلى (يوم، ساعة، دقيقة)
export function formatReadingTime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return { days, hours, minutes };
}