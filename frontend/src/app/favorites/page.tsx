'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ComicGrid } from '@/components/ComicGrid';
import { useStorage } from '@/hooks/useStorage';
import { useAuth } from '@/context/AuthContext';
import { Manga } from '@/types/manga';
import { FaHeart, FaHeartBroken } from 'react-icons/fa';
import { MangaCardSkeleton } from '@/components/Skeleton';

export default function FavoritesPage() {
    const { user } = useAuth();
    const { favorites, removeFavorite } = useStorage();
    const [favoriteManga, setFavoriteManga] = useState<Manga[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Pagination - load 20 at a time
    const [displayCount, setDisplayCount] = useState(20);
    const PAGE_SIZE = 20;

    useEffect(() => {
        const loadFavorites = async () => {
            try {
                setLoading(true);
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

                if (favorites.length === 0) {
                    setFavoriteManga([]);
                    setLoading(false);
                    return;
                }

                // Load only displayed batch (pagination)
                const batchIds = favorites.slice(0, displayCount);
                const promises = batchIds.map(id =>
                    fetch(`${API_URL}/manga/${id}/`)
                        .then(res => res.ok ? res.json() : null)
                        .catch(() => null)
                );

                const results = await Promise.all(promises);
                const validManga = results.filter(m => m !== null).map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    description: item.description || '',
                    imageUrl: item.cover_image_url || '/images/placeholder.jpg',
                    chapterCount: item.chapter_count || 0,
                    avgRating: parseFloat(item.avg_rating || '0'),
                    genres: item.genres ? (Array.isArray(item.genres) ? item.genres.map((g: any) => g.name || g) : []) : [],
                    status: item.status,
                    lastUpdated: item.last_updated,
                    author: item.author || 'Unknown',
                    views: item.views || 0,
                    category: typeof item.category === 'object' && item.category !== null ? item.category.slug : item.category,
                }));

                setFavoriteManga(validManga);
            } catch (error) {
                console.error('Error loading favorites:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();
    }, [favorites, displayCount]);

    const loadMore = async () => {
        if (displayCount >= favorites.length) return;

        setLoadingMore(true);
        setDisplayCount(prev => Math.min(prev + PAGE_SIZE, favorites.length));
        setLoadingMore(false);
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gray-900 py-8">
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl font-bold text-white mb-8">مفضلاتي</h1>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            <MangaCardSkeleton count={8} />
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-900 py-8">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <FaHeart className="text-purple-500" />
                            مفضلاتي
                        </h1>
                        <p className="text-gray-400">
                            {favorites.length} مانجا في مكتبتك
                        </p>
                    </div>

                    {favoriteManga.length > 0 ? (
                        <>
                            <ComicGrid
                                mangaList={favoriteManga}
                                onLoadMore={() => { }}
                                hasMore={false}
                                showHeader={false}
                            />

                            {/* Load More Button */}
                            {displayCount < favorites.length && (
                                <div className="flex justify-center mt-12">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50"
                                    >
                                        {loadingMore ? 'جاري التحميل...' : `عرض المزيد (${favorites.length - displayCount} متبقية)`}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20">
                            <FaHeartBroken className="text-6xl text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">
                                لا توجد مفضلات بعد
                            </h3>
                            <p className="text-gray-400">
                                ابدأ بإضافة مانجا لمفضلاتك لتظهر هنا
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}
