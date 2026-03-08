'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/DashboardHeader';
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
    const { user, isAuthenticated, isLoading, login, logout } = useAuth();
    const router = useRouter();

    // Auth Guard - Admin only
    useEffect(() => {
        // انتظر حتى انتهاء تحميل حالة المصادقة
        if (isLoading) return;

        if (!isAuthenticated) {
            login();
            return;
        }

        // Check if user is admin
        if (user && !user.is_staff && !user.is_superuser && user.email !== 'admin@manga.com') {
            router.push('/');
        }
    }, [isAuthenticated, isLoading, user, router]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Show loading while checking auth
    if (isLoading || !isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white flex flex-col md:flex-row" dir="rtl">
            {/* Sidebar - Fixed height with glassmorphism + Collapsible state */}
            <aside
                className={`${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 translate-x-full md:w-0'} 
                bg-slate-900/40 backdrop-blur-2xl border-l border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col fixed md:sticky top-0 h-screen z-40 transition-all duration-500 overflow-hidden shrink-0`}
            >
                {/* Logo Area */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden min-w-[16rem]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <Link href="/dashboard" className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-l from-blue-400 via-indigo-400 to-purple-500 drop-shadow-sm relative z-10 flex items-center gap-2">
                        <span className="text-2xl">⚡</span> الإدارة
                    </Link>
                    <p className="text-sm text-slate-400 mt-2 font-medium relative z-10">مرحباً، <span className="text-blue-400">{user.name || 'مدير'}</span></p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent min-w-[16rem]">
                    {sidebarLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300 relative overflow-hidden"
                            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <link.icon className="text-lg group-hover:scale-110 transition-transform duration-300 group-hover:text-blue-400 z-10" />
                            <span className="font-semibold z-10">{link.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20 min-w-[16rem]">
                    <button
                        onClick={logout}
                        className="group flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <FaSignOutAlt className="group-hover:-translate-x-1 transition-transform z-10" />
                        <span className="font-semibold z-10">تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden relative">
                <DashboardHeader toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

                <main className="flex-1 overflow-x-hidden overflow-y-auto relative">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
                    <div className="p-4 sm:p-8 relative z-10 min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
