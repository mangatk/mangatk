'use client';

import { useState, useEffect } from 'react';
import { FaStar, FaSearch, FaBook } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Rating {
    id: string;
    user: { id: string; username: string; };
    chapter: { id: string; number: number; manga_title?: string; };
    rating: number;
    created_at: string;
}

interface MangaRating {
    mangaTitle: string;
    avgRating: number;
    count: number;
}

export default function RatingsPage() {
    const { getAuthHeaders } = useAuth();
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRatings();
    }, []);

    async function fetchRatings() {
        try {
            const res = await fetch(`${API_URL}/ratings/`, {
                headers: { ...getAuthHeaders() }
            });
            if (res.ok) {
                const data = await res.json();
                setRatings(Array.isArray(data) ? data : data.results || []);
            }
        } catch (error) {
            console.error('Error fetching ratings:', error);
        } finally {
            setLoading(false);
        }
    }

    // Calculate average ratings per manga
    const mangaRatings: MangaRating[] = ratings.reduce((acc, rating) => {
        const mangaTitle = rating.chapter?.manga_title || 'غير معروف';
        const existing = acc.find(r => r.mangaTitle === mangaTitle);
        if (existing) {
            existing.avgRating = (existing.avgRating * existing.count + Number(rating.rating)) / (existing.count + 1);
            existing.count++;
        } else {
            acc.push({ mangaTitle, avgRating: Number(rating.rating), count: 1 });
        }
        return acc;
    }, [] as MangaRating[]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">التقييمات</h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm">إجمالي التقييمات</p>
                    <p className="text-3xl font-bold text-white">{ratings.length}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm">متوسط التقييم</p>
                    <p className="text-3xl font-bold text-yellow-400">
                        {ratings.length > 0
                            ? (ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length).toFixed(1)
                            : '0'
                        }
                        <FaStar className="inline text-xl mr-1" />
                    </p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm">المانجا المقيّمة</p>
                    <p className="text-3xl font-bold text-white">{mangaRatings.length}</p>
                </div>
            </div>

            {/* Manga Ratings */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">تقييمات المانجا</h2>
                </div>

                {mangaRatings.length > 0 ? (
                    <div className="divide-y divide-gray-700">
                        {mangaRatings.sort((a, b) => b.avgRating - a.avgRating).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                                        <FaBook className="text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">{item.mangaTitle}</h3>
                                        <p className="text-gray-400 text-sm">{item.count} تقييم</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-yellow-400 font-bold">
                                    <FaStar />
                                    <span>{item.avgRating.toFixed(1)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <FaStar className="text-4xl mx-auto mb-4 opacity-50" />
                        <p>لا توجد تقييمات</p>
                        <p className="text-sm mt-2">ملاحظة: قد تحتاج لإنشاء API endpoint للتقييمات</p>
                    </div>
                )}
            </div>
        </div>
    );
}
