// src/mocks/data/bookmarks.ts
import { mockMangaList } from './manga';

export const mockBookmarks = [
    { id: 1, user: 1, manga: mockMangaList[0] },
    { id: 2, user: 1, manga: mockMangaList[1] },
    { id: 3, user: 1, manga: mockMangaList[4] },
];

let nextBookmarkId = 10;

export function getMyBookmarks(userId = 1) {
    return {
        results: mockBookmarks.filter(b => b.user === userId)
    };
}

export function toggleBookmark(mangaId: number, userId = 1) {
    const existingIndex = mockBookmarks.findIndex(
        b => b.manga.id === mangaId && b.user === userId
    );

    if (existingIndex !== -1) {
        mockBookmarks.splice(existingIndex, 1);
        return { action: 'removed' };
    }

    const manga = mockMangaList.find(m => m.id === mangaId);
    if (manga) {
        mockBookmarks.push({
            id: nextBookmarkId++,
            user: userId,
            manga
        });
    }

    return { action: 'added' };
}
