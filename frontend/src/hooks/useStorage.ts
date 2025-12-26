'use client';

import { useState, useEffect, useCallback } from 'react';
import { Manga } from '@/types/manga';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface HistoryItem {
  mangaId: string;
  mangaTitle: string;
  chapterId: string;
  chapterNumber?: number;
  imageUrl: string;
  timestamp: number;
}

export function useStorage() {
  const { isAuthenticated, getAuthHeaders } = useAuth();
  const [bookmarks, setBookmarks] = useState<Manga[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load data on startup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load history from localStorage
      const savedHistory = localStorage.getItem('manga_history');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          const validHistory = parsed.filter((h: any) =>
            h.mangaId &&
            h.mangaId.toString().length > 10 &&
            h.mangaTitle !== 'Manga'
          );
          if (validHistory.length !== parsed.length) {
            localStorage.setItem('manga_history', JSON.stringify(validHistory));
          }
          setHistory(validHistory);
        } catch (e) {
          console.error("Error parsing history", e);
        }
      }

      // Load bookmarks - from API if authenticated, localStorage otherwise
      if (isAuthenticated) {
        loadBookmarksFromAPI();
      } else {
        loadBookmarksFromLocal();
      }
    }
  }, [isAuthenticated]);

  const loadBookmarksFromAPI = async () => {
    try {
      const res = await fetch(`${API_URL}/bookmarks/`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        const bookmarkList = (Array.isArray(data) ? data : data.results || []).map((b: any) => ({
          id: b.manga,
          title: b.manga_title,
          imageUrl: b.manga_cover || '',
          author: b.manga_author || '',
          chapterCount: b.manga_chapter_count || b.chapter_count || 0,
        }));
        setBookmarks(bookmarkList);
      } else {
        // Fallback to local if API fails
        loadBookmarksFromLocal();
      }
    } catch (e) {
      console.error("Error loading bookmarks from API", e);
      loadBookmarksFromLocal();
    }
  };

  const loadBookmarksFromLocal = () => {
    const savedBookmarks = localStorage.getItem('manga_bookmarks');
    if (savedBookmarks) {
      try {
        const parsed = JSON.parse(savedBookmarks);
        const validBookmarks = parsed.filter((b: any) => b.id && b.id.toString().length > 10);
        if (validBookmarks.length !== parsed.length) {
          localStorage.setItem('manga_bookmarks', JSON.stringify(validBookmarks));
        }
        setBookmarks(validBookmarks);
      } catch (e) {
        console.error("Error parsing bookmarks", e);
      }
    }
  };

  // Bookmark function - syncs with API if authenticated
  const toggleBookmark = useCallback(async (manga: Manga) => {
    if (isAuthenticated) {
      // Use API
      try {
        const res = await fetch(`${API_URL}/bookmarks/toggle/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ manga_id: manga.id }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.bookmarked) {
            setBookmarks(prev => [...prev, manga]);
          } else {
            setBookmarks(prev => prev.filter(b => b.id !== manga.id));
          }
        }
      } catch (e) {
        console.error("Error toggling bookmark via API", e);
        // Fallback to localStorage
        toggleBookmarkLocal(manga);
      }
    } else {
      toggleBookmarkLocal(manga);
    }
  }, [isAuthenticated, getAuthHeaders]);

  const toggleBookmarkLocal = (manga: Manga) => {
    setBookmarks(prev => {
      const exists = prev.find((b) => b.id === manga.id);
      let newBookmarks;
      if (exists) {
        newBookmarks = prev.filter((b) => b.id !== manga.id);
      } else {
        newBookmarks = [...prev, manga];
      }
      localStorage.setItem('manga_bookmarks', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  };

  // Check bookmark status
  const isBookmarked = useCallback((mangaId: string) => {
    return bookmarks.some((b) => b.id === mangaId);
  }, [bookmarks]);

  // History function - syncs with API if authenticated
  const addToHistory = useCallback(async (manga: Manga, chapterId: string, chapterNumber?: number) => {
    // Save to localStorage first
    setHistory(prev => {
      if (prev.length > 0 && prev[0].mangaId === manga.id && prev[0].chapterId === chapterId) {
        return prev;
      }

      const newItem: HistoryItem = {
        mangaId: manga.id,
        mangaTitle: manga.title,
        imageUrl: manga.imageUrl,
        chapterId: chapterId,
        chapterNumber: chapterNumber,
        timestamp: Date.now(),
      };

      const newHistory = [
        newItem,
        ...prev.filter((h) => h.mangaId !== manga.id)
      ].slice(0, 20);

      localStorage.setItem('manga_history', JSON.stringify(newHistory));
      return newHistory;
    });

    // Send to backend API if authenticated
    if (isAuthenticated) {
      try {
        await fetch(`${API_URL}/reading-history/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            chapter_id: chapterId,
            manga_id: manga.id,
          }),
        });
      } catch (e) {
        console.error("Error saving reading history to API", e);
      }
    }
  }, [isAuthenticated, getAuthHeaders]);

  return {
    bookmarks,
    history,
    toggleBookmark,
    isBookmarked,
    addToHistory
  };
}
