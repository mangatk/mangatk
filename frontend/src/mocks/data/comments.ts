// src/mocks/data/comments.ts
import { mockUsers } from './users';

export const mockComments = [
    {
        id: 1,
        chapter: 1,
        user: mockUsers[1],
        content: 'فصل رائع! البداية كانت قوية جداً',
        created_at: '2024-12-20T14:30:00Z',
        likes_count: 25,
        replies_count: 3,
        parent: null,
        replies: [
            {
                id: 2,
                chapter: 1,
                user: mockUsers[2],
                content: 'أتفق معك تماماً! الرسم أيضاً مذهل',
                created_at: '2024-12-20T15:00:00Z',
                likes_count: 8,
                replies_count: 0,
                parent: 1,
                replies: []
            },
            {
                id: 3,
                chapter: 1,
                user: mockUsers[0],
                content: 'شكراً لكم! سعيد بإعجابكم',
                created_at: '2024-12-20T16:00:00Z',
                likes_count: 12,
                replies_count: 0,
                parent: 1,
                replies: []
            }
        ]
    },
    {
        id: 4,
        chapter: 1,
        user: mockUsers[0],
        content: 'متحمس للفصل القادم!',
        created_at: '2024-12-21T10:00:00Z',
        likes_count: 45,
        replies_count: 0,
        parent: null,
        replies: []
    },
    {
        id: 5,
        chapter: 4,
        user: mockUsers[1],
        content: 'لوفي هو الأفضل! 🔥',
        created_at: '2024-12-22T11:30:00Z',
        likes_count: 67,
        replies_count: 1,
        parent: null,
        replies: [
            {
                id: 6,
                chapter: 4,
                user: mockUsers[2],
                content: 'صحيح! أفضل كابتن قراصنة',
                created_at: '2024-12-22T12:00:00Z',
                likes_count: 23,
                replies_count: 0,
                parent: 5,
                replies: []
            }
        ]
    }
];

// Helper functions
export function getCommentsByChapter(chapterId: number) {
    return {
        results: mockComments.filter(c => c.chapter === chapterId && !c.parent)
    };
}

export function getCommentById(id: number) {
    return mockComments.find(c => c.id === id);
}

let nextCommentId = 100;
export function createComment(data: any) {
    const newComment = {
        id: nextCommentId++,
        chapter: data.chapter,
        user: mockUsers[0], // Assuming logged in user
        content: data.content,
        created_at: new Date().toISOString(),
        likes_count: 0,
        replies_count: 0,
        parent: data.parent || null,
        replies: []
    };

    if (data.parent) {
        const parentComment = mockComments.find(c => c.id === data.parent);
        if (parentComment) {
            parentComment.replies.push(newComment);
            parentComment.replies_count++;
        }
    } else {
        mockComments.push(newComment);
    }

    return newComment;
}
