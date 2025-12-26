'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStorage } from '@/hooks/useStorage';
import { Header } from '@/components/Header';
import { ProxyImage } from '@/components/ProxyImage';
import Link from 'next/link';
import { FaHeart, FaSearch, FaFilter, FaStar, FaBook } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Manga {
    id: string;
    title: string;
    imageUrl: string;
    author: string;
    avgRating: number;
    chapterCount: number;
    status: string;
    genres: string[];
}

export default function FavoritesPage() {
    const { user, getAuthHeaders } = useAuth();
    const { bookmarks } = useStorage();

    const [mangaList, setMangaList] = useState<Manga[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        async function fetchFavorites() {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Fetch favorites from API - endpoint is '/bookmarks/' in backend
                const res = await fetch(`${API_URL}/bookmarks/`, {
                    headers: { ...getAuthHeaders() }
                });

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const data = await res.json();

                // Map to Manga format
                const favorites = data.map((fav: any) => ({
                    id: fav.manga.id,
                    title: fav.manga.title,
                    imageUrl: fav.manga.cover_image_url,
                    author: fav.manga.author || 'غير معروف',
                    avgRating: fav.manga.avg_rating || 0,
                    chapterCount: fav.manga.chapter_count || 0,
                    status: fav.manga.status,
                    genres: fav.manga.genres || []
                }));

                setMangaList(favorites);
            } catch (err) {
                console.warn('⚠️ Favorites API unavailable, using local data:', err);
                // Fallback to localStorage bookmarks
                setMangaList(bookmarks);
            } finally {
                setLoading(false);
            }
        }

        fetchFavorites();
    }, [user, getAuthHeaders, bookmarks]);

    const filteredManga = mangaList.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !filterStatus || m.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
                <div className="container mx-auto px-4">

                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <FaHeart className="text-purple-600" />
                            مكتبتي المفضلة
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {mangaList.length} مانجا في مكتبتك الخاصة
                        </p>
                    </div>

                    {/* Search & Filters */}
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1">
                            <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ابحث في مفضلاتك..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pr-12 pl-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                            />
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-colors ${showFilters
                                ? 'bg-purple-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-500'
                                }`}
                        >
                            <FaFilter />
                            فلتر
                        </button>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">الحالة</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-2 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                                >
                                    <option value="">الكل</option>
                                    <option value="ongoing">مستمرة</option>
                                    <option value="completed">مكتملة</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Manga Grid */}
                    {filteredManga.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filteredManga.map(manga => (
                                <Link
                                    key={manga.id}
                                    href={`/manga/${manga.id}`}
                                    className="group"
                                >
                                    <div className="aspect-[2/3] relative overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-700 shadow-md group-hover:shadow-xl transition-all transform group-hover:-translate-y-1">
                                        <ProxyImage
                                            src={manga.imageUrl}
                                            alt={manga.title}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Overlay on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                                <p className="text-xs font-bold mb-1 line-clamp-2">{manga.title}</p>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <FaStar className="text-yellow-400" />
                                                        {manga.avgRating}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FaBook />
                                                        {manga.chapterCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status badge */}
                                        <div className="absolute top-2 left-2">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${manga.status === 'ongoing'
                                                ? 'bg-green-500'
                                                : 'bg-blue-500'
                                                } text-white shadow-lg`}>
                                                {manga.status === 'ongoing' ? 'مستمرة' : 'مكتملة'}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-white line-clamp-1 px-1">
                                        {manga.title}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <FaHeart className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {searchQuery ? 'لا توجد نتائج' : 'لا توجد مفضلات بعد'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {searchQuery
                                    ? 'جرب كلمات بحث أخرى'
                                    : 'ابدأ بإضافة مانجا لمفضلاتك لتظهر هنا'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
