// src/mocks/data/ratings.ts
export const mockRatings = [
    { id: 1, chapter: 1, user: 1, rating: 5 },
    { id: 2, chapter: 1, user: 2, rating: 4 },
    { id: 3, chapter: 4, user: 1, rating: 5 },
    { id: 4, chapter: 6, user: 2, rating: 5 }
];

let nextRatingId = 100;

export function getMyRating(chapterId: number, userId = 1) {
    const rating = mockRatings.find(r => r.chapter === chapterId && r.user === userId);
    return rating ? { rating: rating.rating } : { rating: null };
}

export function createOrUpdateRating(data: { chapter: number; rating: number }, userId = 1) {
    const existing = mockRatings.find(r => r.chapter === data.chapter && r.user === userId);

    if (existing) {
        existing.rating = data.rating;
        return existing;
    }

    const newRating = {
        id: nextRatingId++,
        chapter: data.chapter,
        user: userId,
        rating: data.rating
    };

    mockRatings.push(newRating);
    return newRating;
}

export function getAllRatings() {
    return {
        results: mockRatings
    };
}
