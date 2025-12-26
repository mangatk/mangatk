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
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-white mb-8">لوحة التحكم</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">{stat.label}</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                                </div>
                                <div className={`${stat.color} p-4 rounded-lg`}>
                                    <stat.icon className="text-2xl text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">إجراءات سريعة</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <a
                            href="/dashboard/manga"
                            className="flex flex-col items-center p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <FaBook className="text-2xl text-blue-500 mb-2" />
                            <span className="text-gray-300">إدارة المانجا</span>
                        </a>
                        <a
                            href="/dashboard/genres"
                            className="flex flex-col items-center p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <FaTags className="text-2xl text-purple-500 mb-2" />
                            <span className="text-gray-300">التصنيفات</span>
                        </a>
                        <a
                            href="/dashboard/comments"
                            className="flex flex-col items-center p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <FaUsers className="text-2xl text-green-500 mb-2" />
                            <span className="text-gray-300">التعليقات</span>
                        </a>
                        <a
                            href="/dashboard/translate"
                            className="flex flex-col items-center p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <FaStar className="text-2xl text-yellow-500 mb-2" />
                            <span className="text-gray-300">الترجمة</span>
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
