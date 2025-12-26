'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaLayerGroup } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Category {
    id: string;
    name: string;
    slug: string;
    title_ar: string;
    description_ar: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        try {
            const res = await fetch(`${API_URL}/categories/`);
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteCategory(slug: string) {
        if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) return;

        try {
            await fetch(`${API_URL}/categories/${slug}/`, { method: 'DELETE' });
            setCategories(categories.filter(c => c.slug !== slug));
        } catch (error) {
            console.error('Error deleting category:', error);
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
                <h1 className="text-3xl font-bold text-white">الفئات (Categories)</h1>
                <button
                    onClick={() => { setEditingCategory(null); setShowModal(true); }}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <FaPlus /> إضافة فئة
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                                    <FaLayerGroup className="text-orange-400 text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">{cat.title_ar || cat.name}</h3>
                                    <p className="text-gray-400 text-sm">{cat.slug}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setEditingCategory(cat); setShowModal(true); }}
                                    className="p-2 text-blue-400 hover:bg-blue-600/20 rounded transition-colors"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => deleteCategory(cat.slug)}
                                    className="p-2 text-red-400 hover:bg-red-600/20 rounded transition-colors"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                        {cat.description_ar && (
                            <p className="text-gray-400 text-sm mt-3">{cat.description_ar}</p>
                        )}
                    </div>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    لا توجد فئات
                </div>
            )}

            {showModal && (
                <CategoryModal
                    category={editingCategory}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); fetchCategories(); }}
                />
            )}
        </div>
    );
}

function CategoryModal({ category, onClose, onSuccess }: { category: Category | null; onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: category?.name || '',
        title_ar: category?.title_ar || '',
        description_ar: category?.description_ar || '',
    });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const url = category
                ? `${API_URL}/categories/${category.slug}/`
                : `${API_URL}/categories/`;

            await fetch(url, {
                method: category ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            onSuccess();
        } catch (error) {
            console.error('Error saving category:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                    {category ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="اسم الفئة (إنجليزي)"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                    />
                    <input
                        type="text"
                        value={formData.title_ar}
                        onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                        placeholder="العنوان (عربي)"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                    />
                    <textarea
                        value={formData.description_ar}
                        onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                        placeholder="الوصف (عربي)"
                        rows={2}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                    />

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
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
