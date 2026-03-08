'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FaBars, FaSignOutAlt, FaRocket } from 'react-icons/fa';

interface DashboardHeaderProps {
    toggleSidebar: () => void;
}

export function DashboardHeader({ toggleSidebar }: DashboardHeaderProps) {
    const { user, logout } = useAuth();

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

                    <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

                    <div className="flex items-center gap-3">
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-bold text-white">{user?.name || 'مدير'}</p>
                            <p className="text-xs text-slate-400">الإدارة العليا</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg">
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center border border-white/10">
                                <span className="text-white font-bold">{user?.name?.charAt(0) || 'M'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
