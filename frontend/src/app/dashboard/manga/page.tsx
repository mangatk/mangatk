'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaStar, FaLayerGroup, FaFilter } from 'react-icons/fa';
import { ProxyImage } from '@/components/ProxyImage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Manga {
    id: string;
    title: string;
    author: string;
    description: string;
    status: string;
    cover_image_url: string;
    chapter_count: number;
    views: number;
    avg_rating: number;
    category?: string;
    genres?: string[];
}

interface Genre {
    id: string;
    name: string;
    slug: string;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function MangaListPage() {
    const [manga, setManga] = useState<Manga[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingManga, setEditingManga] = useState<Manga | null>(null);

    // Filters
    const [allGenres, setAllGenres] = useState<Genre[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterGenre, setFilterGenre] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchManga();
        fetchFilters();
    }, []);

    async function fetchManga() {
        try {
            const res = await fetch(`${API_URL}/manga/`);
            const data = await res.json();
            setManga(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error('Error fetching manga:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchFilters() {
        try {
            const [genresRes, categoriesRes] = await Promise.all([
                fetch(`${API_URL}/genres/`),
                fetch(`${API_URL}/categories/`),
            ]);
            const genres = await genresRes.json();
            const categories = await categoriesRes.json();
            setAllGenres(Array.isArray(genres) ? genres : genres.results || []);
            setAllCategories(Array.isArray(categories) ? categories : categories.results || []);
        } catch (err) {
            console.error('Error loading filters:', err);
        }
    }

    async function deleteManga(id: string) {
        if (!confirm('هل أنت متأكد من حذف هذه المانجا؟')) return;

        try {
            await fetch(`${API_URL}/manga/${id}/`, { method: 'DELETE' });
            setManga(manga.filter(m => m.id !== id));
        } catch (error) {
            console.error('Error deleting manga:', error);
        }
    }

    // Apply filters
    const filteredManga = manga.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
            m.author?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !filterStatus || m.status === filterStatus;
        const matchesCategory = !filterCategory || m.category === filterCategory;
        const matchesGenre = !filterGenre || m.genres?.includes(filterGenre);

        return matchesSearch && matchesStatus && matchesCategory && matchesGenre;
    });

    const activeFiltersCount = [filterStatus, filterCategory, filterGenre].filter(Boolean).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">إدارة المانجا</h1>
                <Link
                    href="/dashboard/manga/add"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <FaPlus /> إضافة مانجا
                </Link>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="البحث عن مانجا..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                >
                    <FaFilter />
                    الفلاتر
                    {activeFiltersCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">الحالة</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">الكل</option>
                                <option value="ongoing">مستمر</option>
                                <option value="completed">مكتمل</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">الفئة</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">الكل</option>
                                {allCategories.map(cat => (
                                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">التصنيف</label>
                            <select
                                value={filterGenre}
                                onChange={(e) => setFilterGenre(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">الكل</option>
                                {allGenres.map(genre => (
                                    <option key={genre.id} value={genre.slug}>{genre.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={() => { setFilterStatus(''); setFilterCategory(''); setFilterGenre(''); }}
                            className="mt-4 text-sm text-red-400 hover:text-red-300"
                        >
                            إزالة جميع الفلاتر
                        </button>
                    )}
                </div>
            )}

            {/* Results count */}
            <p className="text-gray-400 mb-4">
                عرض {filteredManga.length} من {manga.length} مانجا
            </p>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredManga.map((m) => (
                    <div
                        key={m.id}
                        className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors group"
                    >
                        {/* Cover Image */}
                        <div className="relative aspect-[3/4] overflow-hidden">
                            <ProxyImage
                                src={m.cover_image_url || '/placeholder.png'}
                                alt={m.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                            {/* Status Badge */}
                            <div className="absolute top-2 right-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${m.status === 'ongoing' ? 'bg-green-600' : 'bg-blue-600'
                                    }`}>
                                    {m.status === 'ongoing' ? 'مستمر' : 'مكتمل'}
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="absolute bottom-2 right-2 left-2 flex items-center justify-between text-white text-sm">
                                <span className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded">
                                    <FaLayerGroup className="text-blue-400" /> {m.chapter_count || 0}
                                </span>
                                <span className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded">
                                    <FaStar className="text-yellow-400" /> {m.avg_rating || 0}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <h3 className="text-white font-bold text-lg mb-1 truncate">{m.title}</h3>
                            <p className="text-gray-400 text-sm mb-3">{m.author || 'غير معروف'}</p>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/dashboard/manga/${m.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white py-2 rounded-lg transition-colors"
                                >
                                    <FaEye /> عرض
                                </Link>
                                <Link
                                    href={`/dashboard/manga/${m.id}/edit`}
                                    className="flex-1 flex items-center justify-center gap-2 bg-yellow-600/20 hover:bg-yellow-600 text-yellow-400 hover:text-white py-2 rounded-lg transition-colors"
                                >
                                    <FaEdit /> تعديل
                                </Link>
                                <button
                                    onClick={() => deleteManga(m.id)}
                                    className="p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors"
                                    title="حذف"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredManga.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    لا توجد مانجا للعرض
                </div>
            )}
        </div>
    );
}
