'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowRight, FaPlus, FaEdit, FaTrash, FaUpload, FaImages } from 'react-icons/fa';
import { ProxyImage } from '@/components/ProxyImage';
import { EnhancedUploadProgress } from '@/components/EnhancedUploadProgress';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface MangaDetail {
    id: string;
    title: string;
    sub_titles?: string;
    author: string;
    description: string;
    status: string;
    cover_image_url: string;
    views: number;
    chapters: Chapter[];
}

interface Chapter {
    id: string;
    number: number;
    title: string;
    release_date: string;
    image_count: number;
}

export default function MangaDetailPage() {
    const params = useParams();
    const router = useRouter();
    const mangaId = params.id as string;

    const [manga, setManga] = useState<MangaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddChapter, setShowAddChapter] = useState(false);

    useEffect(() => {
        fetchManga();
    }, [mangaId]);

    async function fetchManga() {
        try {
            const res = await fetch(`${API_URL}/manga/${mangaId}/`);
            if (!res.ok) throw new Error('Manga not found');
            const data = await res.json();
            setManga(data);
        } catch (error) {
            console.error('Error fetching manga:', error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteChapter(chapterId: string) {
        if (!confirm('هل أنت متأكد من حذف هذا الفصل؟')) return;

        try {
            await fetch(`${API_URL}/chapters/${chapterId}/`, { method: 'DELETE' });
            fetchManga(); // Refresh
        } catch (error) {
            console.error('Error deleting chapter:', error);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!manga) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400 mb-4">المانجا غير موجودة</p>
                <Link href="/dashboard/manga" className="text-blue-400 hover:underline">
                    العودة لقائمة المانجا
                </Link>
            </div>
        );
    }

    return (
        <div>
            {/* Back Button */}
            <Link
                href="/dashboard/manga"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <FaArrowRight /> العودة لقائمة المانجا
            </Link>

            {/* Manga Info */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
                <div className="flex gap-6">
                    <ProxyImage
                        src={manga.cover_image_url || '/placeholder.png'}
                        alt={manga.title}
                        className="w-40 h-56 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                            <h1 className="text-3xl font-bold text-white">{manga.title}</h1>
                            <div className="flex gap-2">
                                <Link
                                    href={`/dashboard/manga/${mangaId}/edit`}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    <FaEdit /> تعديل
                                </Link>
                                <button
                                    onClick={async () => {
                                        if (!confirm('هل أنت متأكد من حذف هذه المانجا؟')) return;
                                        try {
                                            await fetch(`${API_URL}/manga/${mangaId}/`, { method: 'DELETE' });
                                            router.push('/dashboard/manga');
                                        } catch (error) {
                                            console.error('Error deleting manga:', error);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                >
                                    <FaTrash /> حذف
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-400 mb-2">بواسطة: {manga.author || 'غير معروف'}</p>
                        {manga.sub_titles && (
                            <p className="text-gray-500 text-sm mb-4 italic">
                                الأسماء الأخرى: {manga.sub_titles}
                            </p>
                        )}
                        <p className="text-gray-300 mb-4 line-clamp-3">{manga.description || 'لا يوجد وصف'}</p>

                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-sm ${manga.status === 'ongoing' ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'
                                }`}>
                                {manga.status === 'ongoing' ? 'مستمر' : 'مكتمل'}
                            </span>
                            <span className="text-gray-400">
                                {manga.views?.toLocaleString() || 0} مشاهدة
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chapters Section */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">
                        الفصول ({manga.chapters?.length || 0})
                    </h2>
                    <button
                        onClick={() => setShowAddChapter(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <FaPlus /> إضافة فصل
                    </button>
                </div>

                {/* Chapters List */}
                {manga.chapters && manga.chapters.length > 0 ? (
                    <div className="divide-y divide-gray-700">
                        {manga.chapters.map((chapter) => (
                            <div
                                key={chapter.id}
                                className="flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-blue-400">
                                        <FaImages />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">
                                            الفصل {chapter.number}: {chapter.title || 'بدون عنوان'}
                                        </h3>
                                        <p className="text-gray-400 text-sm">
                                            {chapter.image_count || 0} صفحة • {chapter.release_date}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/read/${chapter.id}?mangaId=${mangaId}`}
                                        className="p-2 text-blue-400 hover:bg-blue-600/20 rounded transition-colors"
                                        title="عرض"
                                    >
                                        <FaImages />
                                    </Link>
                                    <Link
                                        href={`/dashboard/manga/${mangaId}/chapter/${chapter.id}/edit`}
                                        className="p-2 text-yellow-400 hover:bg-yellow-600/20 rounded transition-colors"
                                        title="تعديل"
                                    >
                                        <FaEdit />
                                    </Link>
                                    <button
                                        onClick={() => deleteChapter(chapter.id)}
                                        className="p-2 text-red-400 hover:bg-red-600/20 rounded transition-colors"
                                        title="حذف"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <FaImages className="text-4xl mx-auto mb-4 opacity-50" />
                        <p>لا توجد فصول بعد</p>
                        <button
                            onClick={() => setShowAddChapter(true)}
                            className="mt-4 text-blue-400 hover:underline"
                        >
                            أضف أول فصل
                        </button>
                    </div>
                )}
            </div>

            {/* Add Chapter Modal */}
            {showAddChapter && (
                <AddChapterModal
                    mangaId={mangaId}
                    mangaTitle={manga.title}
                    onClose={() => setShowAddChapter(false)}
                    onSuccess={() => {
                        setShowAddChapter(false);
                        fetchManga();
                    }}
                />
            )}
        </div>
    );
}

// Add Chapter Modal with Async Upload and Progress Tracking
function AddChapterModal({
    mangaId,
    mangaTitle,
    onClose,
    onSuccess,
}: {
    mangaId: string;
    mangaTitle: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [chapterNumber, setChapterNumber] = useState('');
    const [chapterTitle, setChapterTitle] = useState('');
    const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [jobId, setJobId] = useState<string | null>(null);

    // Enhanced progress state for EnhancedUploadProgress
    const [uploadState, setUploadState] = useState({
        stages: [
            { name: 'رفع الملف إلى الخادم', weight: 20 },
            { name: 'رفع الصور إلى ImgBB', weight: 80 }
        ],
        currentStage: 0,
        currentStageProgress: 0,
        status: 'idle' as 'idle' | 'uploading' | 'success' | 'error',
        message: '',
        error: ''
    });

    const { getAuthHeaders } = useAuth();

    // Cleanup polling interval on unmount
    useEffect(() => {
        return () => {
            if (jobId) {
                // Clear any pending intervals
                const highestId = window.setTimeout(() => { }, 0);
                for (let i = 0; i < highestId; i++) {
                    window.clearTimeout(i);
                }
            }
        };
    }, [jobId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) {
            setError('الرجاء اختيار ملف ZIP أو CBZ');
            return;
        }

        setLoading(true);
        setError('');
        setUploadState(prev => ({
            ...prev,
            status: 'uploading',
            currentStage: 0,
            currentStageProgress: 0,
            message: 'جاري رفع الملف...'
        }));

        try {
            const formData = new FormData();
            formData.append('manga', mangaId);
            formData.append('number', chapterNumber);
            formData.append('title', chapterTitle || `${mangaTitle} - الفصل ${chapterNumber}`);
            formData.append('release_date', releaseDate);
            formData.append('file', file);

            const token = localStorage.getItem('manga_token');

            // Use XMLHttpRequest for upload progress tracking
            const data = await new Promise<any>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // Track file upload progress (first stage)
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100);
                        setUploadState(prev => ({
                            ...prev,
                            currentStage: 0, // File upload stage
                            currentStageProgress: percentComplete,
                            status: 'uploading',
                            message: `جاري رفع الملف... ${percentComplete}%`
                        }));
                    }
                });

                // Handle completion
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);

                            // File uploaded successfully, move to ImgBB upload stage
                            setUploadState(prev => ({
                                ...prev,
                                currentStage: 1, // ImgBB upload stage
                                currentStageProgress: 0,
                                message: 'تم رفع الملف، جاري معالجة الصور...'
                            }));

                            resolve(response);
                        } catch (e) {
                            reject(new Error('فشل في قراءة الاستجابة'));
                        }
                    } else {
                        let errorMessage = `فشل الرفع: ${xhr.status}`;
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            errorMessage = errorResponse.error || errorMessage;
                        } catch (e) {
                            // Ignore if response is not JSON
                        }
                        reject(new Error(errorMessage));
                    }
                });

                // Handle errors
                xhr.addEventListener('error', () => {
                    reject(new Error('حدث خطأ أثناء الرفع'));
                });

                // Open and send request
                xhr.open('POST', `${API_URL}/chapters/upload-async/`);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.send(formData);
            });

            const uploadJobId = data.job_id;
            setJobId(uploadJobId);

            // Poll for ImgBB upload progress
            const pollInterval = setInterval(async () => {
                try {
                    const progressRes = await fetch(
                        `${API_URL}/chapters/upload-progress/${uploadJobId}/`,
                        {
                            headers: getAuthHeaders()
                        }
                    );

                    if (!progressRes.ok) {
                        throw new Error('فشل الحصول على حالة الرفع');
                    }

                    const progressData = await progressRes.json();

                    // Update ImgBB upload progress
                    setUploadState(prev => ({
                        ...prev,
                        currentStage: 1, // ImgBB upload stage
                        currentStageProgress: progressData.percentage || 0,
                        status: progressData.status === 'completed' ? 'success' :
                            progressData.status === 'failed' ? 'error' : 'uploading',
                        message: progressData.status === 'completed'
                            ? `تم رفع ${progressData.completed} صورة بنجاح!`
                            : `جاري رفع الصور إلى ImgBB... (${progressData.completed}/${progressData.total})`,
                        error: progressData.error || ''
                    }));

                    // Check if completed or failed
                    if (progressData.status === 'completed') {
                        clearInterval(pollInterval);
                        setLoading(false);
                        setTimeout(() => {
                            onSuccess();
                        }, 1500);
                    } else if (progressData.status === 'failed') {
                        clearInterval(pollInterval);
                        setLoading(false);
                        throw new Error(progressData.error || 'فشلت عملية الرفع');
                    }

                } catch (pollError: any) {
                    clearInterval(pollInterval);
                    setLoading(false);
                    setUploadState(prev => ({
                        ...prev,
                        status: 'error',
                        error: pollError.message
                    }));
                    setError(pollError.message);
                }
            }, 500); // Poll every 500ms

        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء الرفع');
            setUploadState(prev => ({
                ...prev,
                status: 'error',
                error: err.message
            }));
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl w-full max-w-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">إضافة فصل جديد</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-300 mb-2">رقم الفصل *</label>
                        <input
                            type="number"
                            step="0.5"
                            required
                            value={chapterNumber}
                            onChange={(e) => setChapterNumber(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            placeholder="مثال: 1، 2، 2.5"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2">عنوان الفصل (اختياري)</label>
                        <input
                            type="text"
                            value={chapterTitle}
                            onChange={(e) => setChapterTitle(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            placeholder="سيتم إنشاء عنوان تلقائي إذا تركته فارغاً"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2">تاريخ النشر</label>
                        <input
                            type="date"
                            value={releaseDate}
                            onChange={(e) => setReleaseDate(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2">ملف الفصل (ZIP أو CBZ) *</label>
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                            <input
                                type="file"
                                accept=".zip,.cbz"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="chapter-file"
                                disabled={loading}
                            />
                            <label htmlFor="chapter-file" className={loading ? 'cursor-not-allowed' : 'cursor-pointer'}>
                                {file ? (
                                    <div>
                                        <FaUpload className="text-3xl text-green-400 mx-auto mb-2" />
                                        <p className="text-white font-medium">{file.name}</p>
                                        <p className="text-gray-400 text-sm">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <FaUpload className="text-3xl text-gray-500 mx-auto mb-2" />
                                        <p className="text-gray-400">اضغط لاختيار ملف</p>
                                        <p className="text-gray-500 text-sm">ZIP أو CBZ يحتوي على صور الفصل</p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Enhanced Upload Progress */}
                    <EnhancedUploadProgress
                        stages={uploadState.stages}
                        currentStage={uploadState.currentStage}
                        currentStageProgress={uploadState.currentStageProgress}
                        status={uploadState.status}
                        message={uploadState.message}
                        error={uploadState.error}
                    />

                    {error && uploadState.status === 'idle' && (
                        <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    جاري الرفع...
                                </>
                            ) : (
                                <>
                                    <FaUpload /> رفع الفصل
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
