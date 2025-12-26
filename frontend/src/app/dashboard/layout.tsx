'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    FaHome, FaBook, FaTags, FaLayerGroup, FaTrophy,
    FaCreditCard, FaComments, FaStar, FaLanguage, FaSignOutAlt, FaImage
} from 'react-icons/fa';

const sidebarLinks = [
    { href: '/dashboard', label: 'الرئيسية', icon: FaHome },
    { href: '/dashboard/manga', label: 'المانجا', icon: FaBook },
    { href: '/dashboard/banners', label: 'البنرات', icon: FaImage },
    { href: '/dashboard/genres', label: 'التصنيفات', icon: FaTags },
    { href: '/dashboard/categories', label: 'الفئات', icon: FaLayerGroup },
    { href: '/dashboard/achievements', label: 'الإنجازات', icon: FaTrophy },
    { href: '/dashboard/subscriptions', label: 'الاشتراكات', icon: FaCreditCard },
    { href: '/dashboard/comments', label: 'التعليقات', icon: FaComments },
    { href: '/dashboard/ratings', label: 'التقييمات', icon: FaStar },
    { href: '/dashboard/translate', label: 'الترجمة', icon: FaLanguage },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();

    // Auth Guard - Admin only
    useEffect(() => {
        // انتظر حتى انتهاء تحميل حالة المصادقة
        if (isLoading) return;

        if (!isAuthenticated) {
            router.push('/login?redirect=/dashboard');
            return;
        }

        // Check if user is admin
        if (user && !user.is_staff && !user.is_superuser && user.email !== 'admin@manga.com') {
            router.push('/');
        }
    }, [isAuthenticated, isLoading, user, router]);

    // Show loading while checking auth
    if (isLoading || !isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex" dir="rtl">
            {/* Sidebar - Fixed height */}
            <aside className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col sticky top-0 h-screen">
                {/* Logo */}
                <div className="p-6 border-b border-gray-700">
                    <h1 className="text-xl font-bold text-white">
                        🎮 لوحة التحكم
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">مرحباً، {user.name || 'مدير'}</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {sidebarLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                            <link.icon className="text-lg" />
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors"
                    >
                        <FaSignOutAlt />
                        <span>تسجيل الخروج</span>
                    </button>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 mt-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        ← العودة للموقع
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
