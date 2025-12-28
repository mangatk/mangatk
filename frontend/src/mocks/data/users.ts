// src/mocks/data/users.ts
export const mockUsers = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@mangatk.com',
        is_staff: true,
        is_superuser: true,
        points: 5000,
        equipped_title: 'مترجم محترف'
    },
    {
        id: 2,
        username: 'user1',
        email: 'user1@example.com',
        is_staff: false,
        is_superuser: false,
        points: 1250,
        equipped_title: 'قارئ نشيط'
    },
    {
        id: 3,
        username: 'user2',
        email: 'user2@example.com',
        is_staff: false,
        is_superuser: false,
        points: 800,
        equipped_title: null
    },
];

// Mock tokens
export const mockTokens = {
    access: 'mock-access-token-' + Date.now(),
    refresh: 'mock-refresh-token-' + Date.now()
};

// Helper to create auth response
export function createAuthResponse(user: typeof mockUsers[0]) {
    return {
        success: true,
        user,
        tokens: mockTokens
    };
}
