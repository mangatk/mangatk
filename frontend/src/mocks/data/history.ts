// src/mocks/data/history.ts
import { mockChapters } from './chapters';

export const mockReadingHistory = [
    {
        id: 1,
        user: 1,
        chapter: mockChapters[0],
        manga: 1,
        last_read_at: '2024-12-25T14:30:00Z',
        progress: 100
    },
    {
        id: 2,
        user: 1,
        chapter: mockChapters[1],
        manga: 1,
        last_read_at: '2024-12-25T15:00:00Z',
        progress: 50
    },
    {
        id: 3,
        user: 1,
        chapter: mockChapters[3],
        manga: 2,
        last_read_at: '2024-12-24T10:00:00Z',
        progress: 100
    }
];

let nextHistoryId = 10;

export function getMyHistory(userId = 1) {
    return {
        results: mockReadingHistory.filter(h => h.user === userId)
    };
}

export function addToHistory(data: { chapter: number; manga: number; progress: number }, userId = 1) {
    const existing = mockReadingHistory.find(
        h => h.chapter.id === data.chapter && h.user === userId
    );

    if (existing) {
        existing.progress = data.progress;
        existing.last_read_at = new Date().toISOString();
        return existing;
    }

    const chapter = mockChapters.find(c => c.id === data.chapter);
    if (!chapter) return null;

    const newHistory = {
        id: nextHistoryId++,
        user: userId,
        chapter,
        manga: data.manga,
        last_read_at: new Date().toISOString(),
        progress: data.progress
    };

    mockReadingHistory.push(newHistory);
    return newHistory;
}
