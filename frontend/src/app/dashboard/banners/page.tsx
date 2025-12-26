'use client';

import { useState, useEffect } from 'react';
import { FaStar, FaCheck, FaImage, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { ProxyImage } from '@/components/ProxyImage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const MAX_FEATURED = 5;

interface Manga {
    id: string;
    title: string;
    cover_image_url: string;
    banner_image_url: string;
    has_banner: boolean;
    is_featured: boolean;
    chapter_count: number;
    avg_rating: number;
}

export default function BannersPage() {
    const [mangaList, setMangaList] = useState<Manga[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchManga();
    }, []);

    async function fetchManga() {
        try {
            const res = await fetch(`${API_URL}/manga/`);
            if (res.ok) {
                const data = await res.json();
                const mangaArray = Array.isArray(data) ? data : data.results || [];
                // Filter only manga with banners
                const withBanners = mangaArray.filter((m: Manga) => m.has_banner || m.banner_image_url);
                setMangaList(withBanners);
            }
        } catch (error) {
            console.error('Error fetching manga:', error);
        } finally {
            setLoading(false);
        }
    }

    const featuredCount = mangaList.filter(m => m.is_featured).length;

    async function toggleFeatured(manga: Manga) {
        if (!manga.is_featured && featuredCount >= MAX_FEATURED) {
            setMessage({ type: 'error', text: `لا يمكن اختيار أكثر من ${MAX_FEATURED} مانجا للعرض في الصفحة الرئيسية` });
            setTimeout(() => setMessage(null), 3000);
            return;
        }

        setSaving(manga.id);
        try {
            const res = await fetch(`${API_URL}/manga/${manga.id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_featured: !manga.is_featured }),
            });

            if (res.ok) {
                setMangaList(prev => prev.map(m =>
                    m.id === manga.id ? { ...m, is_featured: !m.is_featured } : m
                ));
                setMessage({
                    type: 'success',
                    text: manga.is_featured ? 'تم إزالة المانجا من البنرات' : 'تم إضافة المانجا للبنرات'
                });
                setTimeout(() => setMessage(null), 2000);
            }
        } catch (error) {
            console.error('Error updating manga:', error);
            setMessage({ type: 'error', text: 'حدث خطأ أثناء التحديث' });
            setTimeout(() => setMessage(null), 3000);
        } finally {
            setSaving(null);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">إدارة البنرات</h1>
                    <p className="text-gray-400 mt-1">اختر المانجا التي ستظهر في البنر الرئيسي للموقع</p>
                </div>
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                    <span className="text-white font-bold">{featuredCount}</span>
                    <span className="text-gray-400"> / {MAX_FEATURED} مختارة</span>
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`mb-6 px-4 py-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                    }`}>
                    {message.type === 'error' ? <FaExclamationTriangle /> : <FaCheck />}
                    {message.text}
                </div>
            )}

            {mangaList.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <FaImage className="text-6xl mx-auto mb-4 opacity-30" />
                    <p className="text-xl">لا توجد مانجا تحتوي على صور بنر</p>
                    <p className="text-sm mt-2">قم بإضافة صور بنر للمانجا من صفحة تعديل المانجا</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mangaList.map(manga => (
                        <div
                            key={manga.id}
                            className={`relative rounded-xl overflow-hidden group cursor-pointer transition-all ${manga.is_featured ? 'ring-4 ring-yellow-500' : 'ring-2 ring-gray-700'
                                }`}
                            onClick={() => toggleFeatured(manga)}
                        >
                            {/* Banner Image */}
                            <div className="aspect-[16/9] relative">
                                <ProxyImage
                                    src={manga.banner_image_url || manga.cover_image_url}
                                    alt={manga.title}
                                    className="w-full h-full object-cover"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                                {/* Featured Badge */}
                                {manga.is_featured && (
                                    <div className="absolute top-3 right-3 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                        <FaStar />
                                        مميزة
                                    </div>
                                )}

                                {/* Saving Indicator */}
                                {saving === manga.id && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <FaSpinner className="text-white text-3xl animate-spin" />
                                    </div>
                                )}

                                {/* Info */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-white font-bold text-lg line-clamp-1">{manga.title}</h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-300 mt-1">
                                        <span className="flex items-center gap-1">
                                            <FaStar className="text-yellow-400" />
                                            {manga.avg_rating}
                                        </span>
                                        <span>{manga.chapter_count} فصل</span>
                                    </div>
                                </div>

                                {/* Selection Checkbox */}
                                <div className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${manga.is_featured ? 'bg-yellow-500' : 'bg-gray-800/80 group-hover:bg-blue-600'
                                    }`}>
                                    <FaCheck className={manga.is_featured ? 'text-black' : 'text-white'} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info Section */}
            <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-400 font-bold mb-2">معلومات</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                    <li>• يمكنك اختيار حتى {MAX_FEATURED} مانجا لعرضها في البنر الرئيسي</li>
                    <li>• يجب أن تحتوي المانجا على صورة بنر لتظهر هنا</li>
                    <li>• لإضافة صورة بنر، اذهب لصفحة تعديل المانجا وارفع صورة البنر</li>
                </ul>
            </div>
        </div>
    );
}
