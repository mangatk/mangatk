'use client';

import { useState, useEffect } from 'react';
import { FaTrash, FaComments, FaSearch, FaUser } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Comment {
    id: string;
    user: { id: string; username: string; };
    content: string;
    comment_type: string;
    manga?: { id: string; title: string; };
    chapter?: { id: string; number: number; };
    created_at: string;
    is_deleted: boolean;
}

export default function CommentsPage() {
    const { getAuthHeaders } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchComments();
    }, []);

    async function fetchComments() {
        try {
            const res = await fetch(`${API_URL}/comments/all/`, {
                headers: { ...getAuthHeaders() }
            });
            if (res.ok) {
                const data = await res.json();
                setComments(Array.isArray(data) ? data : data.results || []);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteComment(id: string) {
        if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;

        try {
            await fetch(`${API_URL}/comments/${id}/`, { method: 'DELETE' });
            setComments(comments.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    }

    const filteredComments = comments.filter(c =>
        c.content?.toLowerCase().includes(search.toLowerCase()) ||
        c.user?.username?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">التعليقات</h1>

            {/* Search */}
            <div className="relative mb-6">
                <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="البحث في التعليقات..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
            </div>

            {/* Comments List */}
            <div className="space-y-4">
                {filteredComments.map((comment) => (
                    <div
                        key={comment.id}
                        className={`bg-gray-800 rounded-xl p-4 border ${comment.is_deleted ? 'border-red-900 opacity-60' : 'border-gray-700'}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                    <FaUser className="text-gray-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-medium">{comment.user?.username || 'مجهول'}</span>
                                        <span className="text-gray-500 text-sm">
                                            {new Date(comment.created_at).toLocaleDateString('ar')}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 mt-1">{comment.content}</p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                        {comment.manga && <span>المانجا: {comment.manga.title}</span>}
                                        {comment.chapter && <span>الفصل: {comment.chapter.number}</span>}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => deleteComment(comment.id)}
                                className="p-2 text-red-400 hover:bg-red-600/20 rounded transition-colors"
                                title="حذف"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredComments.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <FaComments className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>لا توجد تعليقات</p>
                    <p className="text-sm mt-2">ملاحظة: قد تحتاج لإنشاء API endpoint للتعليقات</p>
                </div>
            )}
        </div>
    );
}
