'use client';

import { useState, useEffect } from 'react';
import { FaBook, FaLayerGroup, FaTags, FaUsers, FaEye, FaStar } from 'react-icons/fa';
import { Header } from '@/components/Header';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Stats {
    mangaCount: number;
    chapterCount: number;
    genreCount: number;
    categoryCount: number;
}

export default function DashboardHome() {
    const [stats, setStats] = useState<Stats>({
        mangaCount: 0,
        chapterCount: 0,
        genreCount: 0,
        categoryCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [mangaRes, chaptersRes, genresRes, categoriesRes] = await Promise.all([
                    fetch(`${API_URL}/manga/`),
                    fetch(`${API_URL}/chapters/`),
                    fetch(`${API_URL}/genres/`),
                    fetch(`${API_URL}/categories/`),
                ]);

                const extractCount = (data: any) => {
                    if (Array.isArray(data)) return data.length;
                    if (data.count !== undefined) return data.count;
                    if (data.results) return data.results.length;
                    return 0;
                };

                const [manga, chapters, genres, categories] = await Promise.all([
                    mangaRes.json(),
                    chaptersRes.json(),
                    genresRes.json(),
                    categoriesRes.json(),
                ]);

                setStats({
                    mangaCount: extractCount(manga),
                    chapterCount: extractCount(chapters),
                    genreCount: extractCount(genres),
                    categoryCount: extractCount(categories),
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const statCards = [
        { label: 'المانجا', value: stats.mangaCount, icon: FaBook, color: 'bg-blue-600' },
        { label: 'الفصول', value: stats.chapterCount, icon: FaLayerGroup, color: 'bg-green-600' },
        { label: 'التصنيفات', value: stats.genreCount, icon: FaTags, color: 'bg-purple-600' },
        { label: 'الفئات', value: stats.categoryCount, icon: FaLayerGroup, color: 'bg-orange-600' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-7xl animate-fade-in relative z-10 pb-10">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">الاحصائيات العامة</h1>
                    <p className="text-slate-400 mt-2 font-medium">نظرة عامة على أداء الموقع والمحتوى</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {statCards.map((stat, index) => {
                    // Extract a color name for the hover effect (e.g., bg-blue-600 -> from-blue-500/20)
                    const colorParts = stat.color.split('-');
                    const colorName = colorParts[1] || 'blue';

                    return (
                        <div
                            key={stat.label}
                            className="group relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-white/5 hover:border-white/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
                            style={{ boxShadow: `0 10px 40px -10px rgba(0,0,0,0.5)` }}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br from-${colorName}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm font-semibold mb-2">{stat.label}</p>
                                    <p className="text-4xl font-black text-white tracking-tight drop-shadow-lg">{stat.value.toLocaleString()}</p>
                                </div>
                                <div className={`p-4 rounded-2xl shadow-lg ${stat.color} bg-opacity-90 ring-1 ring-white/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                    <stat.icon className="text-2xl text-white drop-shadow-md" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="text-2xl font-bold text-white mb-8 relative z-10 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-blue-400 shadow-inner">⚡</span>
                    إجراءات سريعة
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                    <a
                        href="/dashboard/manga"
                        className="group flex flex-col items-center p-6 bg-white/5 rounded-3xl hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all duration-300 shadow-xl hover:shadow-blue-500/20 hover:-translate-y-2"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                            <FaBook className="text-3xl text-blue-400 drop-shadow-lg group-hover:text-blue-300 transition-colors" />
                        </div>
                        <span className="text-slate-200 font-bold group-hover:text-white transition-colors">إدارة المانجا</span>
                    </a>

                    <a
                        href="/dashboard/genres"
                        className="group flex flex-col items-center p-6 bg-white/5 rounded-3xl hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all duration-300 shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                            <FaTags className="text-3xl text-purple-400 drop-shadow-lg group-hover:text-purple-300 transition-colors" />
                        </div>
                        <span className="text-slate-200 font-bold group-hover:text-white transition-colors">التصنيفات</span>
                    </a>

                    <a
                        href="/dashboard/comments"
                        className="group flex flex-col items-center p-6 bg-white/5 rounded-3xl hover:bg-white/10 border border-white/5 hover:border-green-500/30 transition-all duration-300 shadow-xl hover:shadow-green-500/20 hover:-translate-y-2"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                            <FaUsers className="text-3xl text-green-400 drop-shadow-lg group-hover:text-green-300 transition-colors" />
                        </div>
                        <span className="text-slate-200 font-bold group-hover:text-white transition-colors">التعليقات</span>
                    </a>

                    <a
                        href="/dashboard/translate"
                        className="group flex flex-col items-center p-6 bg-white/5 rounded-3xl hover:bg-white/10 border border-white/5 hover:border-yellow-500/30 transition-all duration-300 shadow-xl hover:shadow-yellow-500/20 hover:-translate-y-2"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                            <FaStar className="text-3xl text-yellow-400 drop-shadow-lg group-hover:text-yellow-300 transition-colors" />
                        </div>
                        <span className="text-slate-200 font-bold group-hover:text-white transition-colors">الترجمة الآلية</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
