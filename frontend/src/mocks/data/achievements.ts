// src/mocks/data/achievements.ts
export const mockAchievements = [
    {
        id: 1,
        title: 'قارئ مبتدئ',
        description: 'اقرأ أول فصل لك',
        icon: 'FaBook',
        rarity: 'common',
        is_secret: false,
        threshold: 1,
        category: 'reading',
        unlocked: true,
        progress: 1,
        points: 50
    },
    {
        id: 2,
        title: 'قارئ نشيط',
        description: 'اقرأ 10 فصول',
        icon: 'FaBookReader',
        rarity: 'common',
        is_secret: false,
        threshold: 10,
        category: 'reading',
        unlocked: true,
        progress: 10,
        points: 100
    },
    {
        id: 3,
        title: 'مدمن قراءة',
        description: 'اقرأ 50 فصلاً',
        icon: 'FaFire',
        rarity: 'rare',
        is_secret: false,
        threshold: 50,
        category: 'reading',
        unlocked: false,
        progress: 25,
        points: 250
    },
    {
        id: 4,
        title: 'ساهر الليل',
        description: 'اقرأ بعد 3 فجراً',
        icon: 'FaGhost',
        rarity: 'epic',
        is_secret: true,
        threshold: 1,
        category: 'secret',
        unlocked: false,
        progress: 0,
        points: 500
    },
    {
        id: 5,
        title: 'معلق نشط',
        description: 'اكتب 25 تعليقاً',
        icon: 'FaComment',
        rarity: 'rare',
        is_secret: false,
        threshold: 25,
        category: 'social',
        unlocked: false,
        progress: 8,
        points: 200
    },
    {
        id: 6,
        title: 'جامع المانجا',
        description: 'أضف 20 مانجا للمفضلة',
        icon: 'FaStar',
        rarity: 'epic',
        is_secret: false,
        threshold: 20,
        category: 'collection',
        unlocked: false,
        progress: 5,
        points: 300
    },
    {
        id: 7,
        title: 'قارئ أسطوري',
        description: 'اقرأ 500 فصل',
        icon: 'FaTrophy',
        rarity: 'legendary',
        is_secret: false,
        threshold: 500,
        category: 'reading',
        unlocked: false,
        progress: 25,
        points: 1000
    },
    {
        id: 8,
        title: 'ماراثون القراءة',
        description: 'اقرأ لمدة ساعة متواصلة',
        icon: 'FaClock',
        rarity: 'rare',
        is_secret: false,
        threshold: 3600,
        category: 'time',
        unlocked: true,
        progress: 3600,
        points: 150
    }
];

export function getMyAchievements() {
    return {
        results: mockAchievements
    };
}

export function checkAchievements() {
    // Simulate achievement check
    return {
        newlyUnlocked: [],
        updated: mockAchievements.map(a => ({
            id: a.id,
            progress: a.progress
        }))
    };
}
