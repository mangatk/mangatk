'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTrophy } from 'react-icons/fa';
import { DashboardListSkeleton } from '@/components/DashboardSkeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Achievement {
    id: string;
    slug: string;
    name: string;
    name_ar: string;
    description: string;
    icon_url: string;
    category: string;
    rarity: string;
    requirement_type: string;
    requirement_value: number;
    reward_points: number;
    is_secret: boolean;
    is_active: boolean;
    target_manga: string | null;
    target_manga_title: string | null;
}

const CATEGORY_CHOICES = [
    { value: 'reading', label: 'القراءة' },
    { value: 'uploading', label: 'الرفع' },
    { value: 'social', label: 'التفاعل' },
];

export default function AchievementsPage() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Achievement | null>(null);

    useEffect(() => {
        fetchAchievements();
    }, []);

    async function fetchAchievements() {
        try {
            const res = await fetch(`${API_URL}/achievements/`);
            if (res.ok) {
                const data = await res.json();
                setAchievements(Array.isArray(data) ? data : data.results || []);
            }
        } catch (error) {
            console.error('Error fetching achievements:', error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteAchievement(id: string) {
        if (!confirm('هل أنت متأكد من حذف هذا الإنجاز؟')) return;

        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/achievements/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error('فشل الحذف');
            }

            setAchievements(achievements.filter(a => a.id !== id));
        } catch (error: any) {
            console.error('Error deleting achievement:', error);
            alert(error.message || 'حدث خطأ أثناء الحذف');
        }
    }

    if (loading) {
        return (
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">الإنجازات</h1>
                    <button className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg">
                        <FaPlus /> إضافة إنجاز
                    </button>
                </div>
                <div className="space-y-4">
                    <DashboardListSkeleton count={9} />
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">الإنجازات</h1>
                <button
                    onClick={() => { setEditingItem(null); setShowModal(true); }}
                    className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <FaPlus /> إضافة إنجاز
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((item) => (
                    <div
                        key={item.id}
                        className={`bg-gray-800 rounded-xl p-4 border ${item.is_active ? 'border-gray-700' : 'border-red-900 opacity-60'}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                                    <FaTrophy className="text-yellow-400 text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">{item.name}</h3>
                                    <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-400">
                                        {CATEGORY_CHOICES.find(c => c.value === item.category)?.label || item.category}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => { setEditingItem(item); setShowModal(true); }}
                                    className="p-2 text-blue-400 hover:bg-blue-600/20 rounded transition-colors"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => deleteAchievement(item.id)}
                                    className="p-2 text-red-400 hover:bg-red-600/20 rounded transition-colors"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">المطلوب: {item.requirement_value}</span>
                            <span className="text-yellow-400 font-medium">+{item.reward_points} نقطة</span>
                        </div>
                    </div>
                ))}
            </div>

            {achievements.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <FaTrophy className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>لا توجد إنجازات</p>
                    <p className="text-sm mt-2">ملاحظة: قد تحتاج لإنشاء API endpoint للإنجازات</p>
                </div>
            )}

            {showModal && (
                <AchievementModal
                    item={editingItem}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); fetchAchievements(); }}
                />
            )}
        </div>
    );
}

function AchievementModal({ item, onClose, onSuccess }: { item: Achievement | null; onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        slug: item?.slug || '',
        name: item?.name || '',
        name_ar: item?.name_ar || '',
        description: item?.description || '',
        icon_url: item?.icon_url || '',
        category: item?.category || 'reading',
        rarity: item?.rarity || 'common',
        requirement_type: item?.requirement_type || 'chapters_read',
        requirement_value: item?.requirement_value || 1,
        reward_points: item?.reward_points || 10,
        is_secret: item?.is_secret ?? false,
        is_active: item?.is_active ?? true,
        target_manga: item?.target_manga || '',
    });
    const [loading, setLoading] = useState(false);
    const [mangaList, setMangaList] = useState<{ id: string; title: string }[]>([]);

    useEffect(() => {
        // Load manga list for target_manga selection
        fetch(`${API_URL}/manga/`)
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : data.results || [];
                setMangaList(list.map((m: any) => ({ id: m.id, title: m.title })));
            })
            .catch(console.error);
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('manga_token');
            const url = item ? `${API_URL}/achievements/${item.id}/` : `${API_URL}/achievements/`;
            const payload = {
                ...formData,
                target_manga: formData.target_manga || null,
            };

            const res = await fetch(url, {
                method: item ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || errorData.error || 'فشل الحفظ');
            }

            onSuccess();
        } catch (error: any) {
            console.error('Error saving achievement:', error);
            alert(error.message || 'حدث خطأ أثناء الحفظ');
        } finally {
            setLoading(false);
        }
    }

    const RARITY_CHOICES = [
        { value: 'common', label: 'عادي' },
        { value: 'rare', label: 'نادر' },
        { value: 'epic', label: 'ملحمي' },
        { value: 'legendary', label: 'أسطوري' },
    ];

    const REQUIREMENT_TYPES = [
        { value: 'chapters_read', label: 'عدد الفصول المقروءة' },
        { value: 'manga_completed', label: 'مانجا مكتملة' },
        { value: 'time_spent', label: 'وقت القراءة (دقائق)' },
        { value: 'comments', label: 'عدد التعليقات' },
        { value: 'ratings', label: 'عدد التقييمات' },
        { value: 'bookmarks', label: 'عدد المفضلة' },
    ];

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-gray-800 rounded-xl w-full max-w-lg p-6 my-8">
                <h2 className="text-xl font-bold text-white mb-4">
                    {item ? 'تعديل الإنجاز' : 'إضافة إنجاز جديد'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-sm">المعرف (slug) *</label>
                            <input
                                type="text"
                                required
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="read_10"
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm">الاسم (English)</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="First 10 Chapters"
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-gray-400 text-sm">الاسم بالعربي *</label>
                        <input
                            type="text"
                            required
                            value={formData.name_ar}
                            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                            placeholder="أول 10 فصول"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-gray-400 text-sm">الوصف</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="وصف الإنجاز"
                            rows={2}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-gray-400 text-sm">رابط الأيقونة</label>
                        <input
                            type="url"
                            value={formData.icon_url}
                            onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                            placeholder="https://..."
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-sm">الفئة</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            >
                                {CATEGORY_CHOICES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm">الندرة</label>
                            <select
                                value={formData.rarity}
                                onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            >
                                {RARITY_CHOICES.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-gray-400 text-sm">نوع المتطلب</label>
                        <select
                            value={formData.requirement_type}
                            onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                        >
                            {REQUIREMENT_TYPES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-sm">قيمة المطلوب</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.requirement_value}
                                onChange={(e) => setFormData({ ...formData, requirement_value: parseInt(e.target.value) })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm">نقاط المكافأة</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.reward_points}
                                onChange={(e) => setFormData({ ...formData, reward_points: parseInt(e.target.value) })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <label className="text-gray-300 text-sm font-medium block mb-2">🎯 مانجا محددة (اختياري)</label>
                        <select
                            value={formData.target_manga}
                            onChange={(e) => setFormData({ ...formData, target_manga: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">-- لا يوجد (إنجاز عام) --</option>
                            {mangaList.map(m => (
                                <option key={m.id} value={m.id}>{m.title}</option>
                            ))}
                        </select>
                        <p className="text-gray-500 text-xs mt-1">حدد مانجا معينة إذا كان الإنجاز مرتبط بقراءة/إكمال مانجا محددة</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_secret}
                                onChange={(e) => setFormData({ ...formData, is_secret: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            إنجاز سري
                        </label>
                        <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            مفعّل
                        </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                        >
                            {loading ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

