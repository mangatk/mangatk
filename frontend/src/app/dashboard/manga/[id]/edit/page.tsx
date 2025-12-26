'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowRight, FaSave, FaTimes, FaPlus } from 'react-icons/fa';
import { uploadToImgbbWithProgress } from '@/services/imgbb';
import { UploadProgress } from '@/components/UploadProgress';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Genre { id: string; name: string; slug: string; }
interface Category { id: string; name: string; slug: string; }

export default function EditMangaPage() {
    const params = useParams();
    const router = useRouter();
    const mangaId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        sub_titles: '',
        author: '',
        description: '',
        status: 'ongoing',
        publish_date: ''
    });
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState('');
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState('');

    const [allGenres, setAllGenres] = useState<Genre[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadLabel, setUploadLabel] = useState('');

    useEffect(() => {
        async function loadData() {
            try {
                const [mangaRes, genresRes, categoriesRes] = await Promise.all([
                    fetch(`${API_URL}/manga/${mangaId}/`),
                    fetch(`${API_URL}/genres/`),
                    fetch(`${API_URL}/categories/`),
                ]);
                const manga = await mangaRes.json();
                const genres = await genresRes.json();
                const categories = await categoriesRes.json();

                setFormData({
                    title: manga.title || '',
                    sub_titles: manga.sub_titles || '',
                    author: manga.author || '',
                    description: manga.description || '',
                    status: manga.status || 'ongoing',
                    publish_date: manga.publish_date || ''
                });
                setCoverPreview(manga.cover_image_url || '');
                setBannerPreview(manga.banner_image_url || '');
                // Extract genre slugs from objects if needed
                const genreSlugs = manga.genres?.map((g: any) => typeof g === 'string' ? g : g.slug) || [];
                setSelectedGenres(genreSlugs);
                // Extract category slug from object if needed
                const catSlug = typeof manga.category === 'string' ? manga.category : (manga.category?.slug || '');
                setSelectedCategory(catSlug);
                setAllGenres(Array.isArray(genres) ? genres : genres.results || []);
                setAllCategories(Array.isArray(categories) ? categories : categories.results || []);
            } catch (err) {
                setError('فشل تحميل البيانات');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [mangaId]);

    function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); }
    }

    function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) { setBannerFile(file); setBannerPreview(URL.createObjectURL(file)); }
    }

    function toggleGenre(genreSlug: string) {
        setSelectedGenres(prev => prev.includes(genreSlug) ? prev.filter(id => id !== genreSlug) : [...prev, genreSlug]);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            let coverUrl = coverPreview;
            let bannerUrl = bannerPreview;
            if (coverFile) {
                setIsUploading(true);
                setUploadLabel('جاري رفع صورة الغلاف...');
                coverUrl = await uploadToImgbbWithProgress(coverFile, (p) => setUploadProgress(bannerFile ? p / 2 : p));
            }
            if (bannerFile) {
                setUploadLabel('جاري رفع صورة البنر...');
                bannerUrl = await uploadToImgbbWithProgress(bannerFile, (p) => setUploadProgress(coverFile ? 50 + p / 2 : p));
            }
            setIsUploading(false);
            setUploadProgress(100);

            const res = await fetch(`${API_URL}/manga/${mangaId}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, cover_image_url: coverUrl, banner_image_url: bannerUrl, genres: selectedGenres, category: selectedCategory || null }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const errorMsg = errorData.detail || errorData.error || JSON.stringify(errorData);
                throw new Error(`فشل تحديث المانجا: ${errorMsg}`);
            }
            router.push(`/dashboard/manga/${mangaId}`);
        } catch (err: any) {
            console.error('Update error:', err);
            setError(err.message || 'حدث خطأ');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/manga/${mangaId}`} className="p-2 text-gray-400 hover:text-white transition-colors"><FaArrowRight /></Link>
                    <h1 className="text-3xl font-bold text-white">تعديل المانجا</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                            <label className="block text-gray-300 mb-3 font-medium">صورة الغلاف</label>
                            <div className="aspect-[3/4] bg-gray-700 rounded-lg overflow-hidden mb-4">
                                {coverPreview ? <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><FaPlus className="text-4xl" /></div>}
                            </div>
                            <input type="file" accept="image/*" onChange={handleCoverChange} className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer" />
                            <p className="text-gray-500 text-xs mt-2">اتركها فارغة للإبقاء على الغلاف الحالي</p>
                        </div>

                        {/* صورة البنر */}
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mt-4">
                            <label className="block text-gray-300 mb-3 font-medium">صورة البنر (اختياري)</label>
                            <div className="aspect-[16/9] bg-gray-700 rounded-lg overflow-hidden mb-4">
                                {bannerPreview ? <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><FaPlus className="text-4xl" /></div>}
                            </div>
                            <input type="file" accept="image/*" onChange={handleBannerChange} className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-yellow-600 file:text-white file:cursor-pointer" />
                            <p className="text-gray-500 text-xs mt-2">للعرض في البنر الرئيسي</p>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <h2 className="text-xl font-bold text-white mb-4">المعلومات الأساسية</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 mb-2">العنوان *</label>
                                    <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2">الأسماء الأخرى (مفصولة بـ ;)</label>
                                    <input type="text" value={formData.sub_titles} onChange={(e) => setFormData({ ...formData, sub_titles: e.target.value })} placeholder="الاسم الإنجليزي ; الاسم الياباني ; ..." className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-gray-300 mb-2">المؤلف</label>
                                        <input type="text" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 mb-2">تاريخ النشر</label>
                                        <input type="date" value={formData.publish_date} onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 mb-2">الحالة</label>
                                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500">
                                            <option value="ongoing">مستمر</option>
                                            <option value="completed">مكتمل</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2">الوصف</label>
                                    <textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <h2 className="text-xl font-bold text-white mb-4">الفئة</h2>
                            <div className="flex flex-wrap gap-2">
                                {allCategories.map((cat) => (
                                    <button key={cat.id} type="button" onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)} className={`px-4 py-2 rounded-lg transition-colors ${selectedCategory === cat.slug ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{cat.name}</button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <h2 className="text-xl font-bold text-white mb-4">التصنيفات</h2>
                            <div className="flex flex-wrap gap-2">
                                {allGenres.map((genre) => (
                                    <button key={genre.id} type="button" onClick={() => toggleGenre(genre.slug)} className={`px-4 py-2 rounded-lg transition-colors ${selectedGenres.includes(genre.slug) ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{genre.name}</button>
                                ))}
                            </div>
                            {selectedGenres.length > 0 && <p className="text-gray-400 text-sm mt-3">تم اختيار: {selectedGenres.length} تصنيف</p>}
                        </div>
                    </div>
                </div>

                {/* Upload Progress Bar */}
                {(isUploading || uploadProgress > 0) && (
                    <div className="bg-gray-800 rounded-lg p-4">
                        <UploadProgress
                            progress={uploadProgress}
                            isComplete={uploadProgress === 100 && !isUploading}
                            label={uploadLabel}
                        />
                    </div>
                )}

                {error && <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-400">{error}</div>}

                <div className="flex items-center gap-4">
                    <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors">
                        <FaSave /> {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                    </button>
                    <Link href={`/dashboard/manga/${mangaId}`} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors">
                        <FaTimes /> إلغاء
                    </Link>
                </div>
            </form>
        </div>
    );
}
