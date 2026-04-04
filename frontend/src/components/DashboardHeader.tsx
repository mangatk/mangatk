'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FaBars, FaSignOutAlt, FaRocket, FaBell } from 'react-icons/fa';
import { ImgBBQuotaBadge } from './ImgBBQuotaBadge';
import { useNotifications } from '@/context/NotificationContext';
import { useState } from 'react';

interface DashboardHeaderProps {
    toggleSidebar: () => void;
}

export function DashboardHeader({ toggleSidebar }: DashboardHeaderProps) {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAllAsRead } = useNotifications();
    const [notifMenuOpen, setNotifMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-30 w-full bg-slate-900/60 backdrop-blur-xl border-b border-white/5 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4">
                {/* Right Side: Toggle & Logo */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors focus:outline-none"
                    >
                        <FaBars className="text-xl" />
                    </button>
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-l from-blue-400 to-purple-500 drop-shadow-sm group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all">
                            مانجا تيك - الإدارة
                        </span>
                    </Link>
                </div>

                {/* Left Side: User profile & Actions */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all hover:-translate-y-0.5"
                    >
                        <FaRocket /> الاستديو / الموقع الرئيسي
                    </Link>

                    <ImgBBQuotaBadge />

                    <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

                    <div className="relative">
                        <button 
                            onClick={() => {
                                setNotifMenuOpen(!notifMenuOpen);
                                if (!notifMenuOpen && unreadCount > 0) markAllAsRead();
                            }} 
                            className="p-2 rounded-full relative hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-transparent"
                        >
                            <FaBell className="text-xl" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/4 bg-red-500 rounded-full border border-slate-900 shadow-sm">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {notifMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setNotifMenuOpen(false)} />
                                <div className="absolute top-full -left-20 mt-3 w-72 sm:w-80 bg-slate-800 rounded-xl shadow-2xl border border-white/10 overflow-hidden py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-2 border-b border-white/10 font-bold text-white flex justify-between items-center bg-slate-800/80">
                                        <span>إشعارات الإدارة</span>
                                    </div>
                                    <div className="max-h-[60vh] overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            notifications.slice(0, 15).map((n) => (
                                                <Link 
                                                    key={n.id} 
                                                    href={n.link || '#'} 
                                                    onClick={() => setNotifMenuOpen(false)}
                                                    className="block px-4 py-3 hover:bg-slate-700/50 border-b border-white/5 last:border-0 transition-colors"
                                                >
                                                    <div className="font-semibold text-sm text-blue-300 mb-1">{n.title}</div>
                                                    <div className="text-xs text-slate-300 leading-relaxed">{n.message}</div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="px-6 py-8 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                                                <FaBell className="text-slate-600 text-4xl mb-2" />
                                                لا توجد إشعارات حالياً
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative">
                        <button 
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-3 p-1 rounded-full hover:bg-white/5 transition-colors"
                        >
                            <div className="text-left hidden md:block">
                                <p className="text-sm font-bold text-white">{user?.name || 'مدير'}</p>
                                <p className="text-xs text-slate-400">الإدارة العليا</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg">
                                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center border border-white/10">
                                    <span className="text-white font-bold">{user?.name?.charAt(0) || 'M'}</span>
                                </div>
                            </div>
                        </button>

                        {userMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setUserMenuOpen(false)} />
                                <div className="absolute top-full left-0 mt-3 w-48 bg-slate-800 rounded-xl shadow-2xl border border-white/10 overflow-hidden py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <a 
                                        href="/profile" 
                                        className="block px-4 py-3 hover:bg-slate-700/50 text-white font-semibold transition-colors border-b border-white/5"
                                    >
                                        الملف الشخصي
                                    </a>
                                    <a 
                                        href="/" 
                                        className="block px-4 py-3 hover:bg-slate-700/50 text-white font-semibold transition-colors border-b border-white/5"
                                    >
                                        الصفحة الرئيسية
                                    </a>
                                    <button 
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            logout();
                                        }}
                                        className="w-full text-right px-4 py-3 hover:bg-red-500/10 text-red-400 font-semibold transition-colors"
                                    >
                                        تسجيل الخروج
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
