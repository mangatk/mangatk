'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTags } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Genre {
    id: string;
    name: string;
    slug: string;
}

export default function GenresPage() {
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGenre, setEditingGenre] = useState<Genre | null>(null);

    useEffect(() => {
        fetchGenres();
    }, []);

    async function fetchGenres() {
        try {
            const res = await fetch(`${API_URL}/genres/`);
            const data = await res.json();
            setGenres(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error('Error fetching genres:', error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteGenre(slug: string) {
        if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;

        try {
            const res = await fetch(`${API_URL}/genres/${slug}/`, { method: 'DELETE' });
            if (res.ok) {
                setGenres(genres.filter(g => g.slug !== slug));
            } else {
                alert('فشل الحذف');
            }
        } catch (error) {
            console.error('Error deleting genre:', error);
            alert('حدث خطأ أثناء الحذف');
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
                <h1 className="text-3xl font-bold text-white">التصنيفات (Genres)</h1>
                <button
                    onClick={() => { setEditingGenre(null); setShowModal(true); }}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <FaPlus /> إضافة تصنيف
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {genres.map((genre) => (
                    <div
                        key={genre.id}
                        className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                                <FaTags className="text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-medium">{genre.name}</h3>
                                <p className="text-gray-400 text-sm">{genre.slug}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setEditingGenre(genre); setShowModal(true); }}
                                className="p-2 text-blue-400 hover:bg-blue-600/20 rounded transition-colors"
                            >
                                <FaEdit />
                            </button>
                            <button
                                onClick={() => deleteGenre(genre.slug)}
                                className="p-2 text-red-400 hover:bg-red-600/20 rounded transition-colors"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {genres.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    لا توجد تصنيفات
                </div>
            )}

            {showModal && (
                <GenreModal
                    genre={editingGenre}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); fetchGenres(); }}
                />
            )}
        </div>
    );
}

function GenreModal({ genre, onClose, onSuccess }: { genre: Genre | null; onClose: () => void; onSuccess: () => void }) {
    const [name, setName] = useState(genre?.name || '');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const url = genre
                ? `${API_URL}/genres/${genre.slug}/`
                : `${API_URL}/genres/`;

            await fetch(url, {
                method: genre ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            onSuccess();
        } catch (error) {
            console.error('Error saving genre:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                    {genre ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="اسم التصنيف"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white mb-4 focus:outline-none focus:border-blue-500"
                    />

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
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
