// src/mocks/data/notifications.ts
export const mockNotifications = [
    {
        id: 1,
        user: 1,
        type: 'new_chapter',
        title: 'فصل جديد',
        message: 'تم إضافة فصل جديد من سولو ليفلينغ',
        read: false,
        created_at: '2024-12-26T09:00:00Z',
        link: '/manga/5'
    },
    {
        id: 2,
        user: 1,
        type: 'achievement',
        title: 'إنجاز جديد',
        message: 'لقد حصلت على إنجاز "قارئ نشيط"!',
        read: false,
        created_at: '2024-12-25T18:30:00Z',
        link: '/profile'
    },
    {
        id: 3,
        user: 1,
        type: 'comment_reply',
        title: 'رد على تعليقك',
        message: 'أحدهم رد على تعليقك في "هجوم العمالقة"',
        read: true,
        created_at: '2024-12-24T14:00:00Z',
        link: '/read/1'
    }
];

export function getMyNotifications(userId = 1) {
    return {
        results: mockNotifications.filter(n => n.user === userId),
        unread_count: mockNotifications.filter(n => n.user === userId && !n.read).length
    };
}

export function markAsRead(id: number) {
    const notification = mockNotifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
    }
    return { success: true };
}

export function markAllAsRead(userId = 1) {
    mockNotifications
        .filter(n => n.user === userId)
        .forEach(n => n.read = true);
    return { success: true, marked: mockNotifications.filter(n => n.user === userId).length };
}
