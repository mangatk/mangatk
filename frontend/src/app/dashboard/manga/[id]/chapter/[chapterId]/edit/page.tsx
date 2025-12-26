'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowRight, FaSave, FaTimes, FaUpload } from 'react-icons/fa';
import { EnhancedUploadProgress } from '@/components/EnhancedUploadProgress';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function EditChapterPage() {
    const params = useParams();
    const router = useRouter();
    const mangaId = params.id as string;
    const chapterId = params.chapterId as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState('');
    const [jobId, setJobId] = useState<string | null>(null);
    const { getAuthHeaders } = useAuth();

    // Enhanced upload progress tracking
    const [uploadState, setUploadState] = useState({
        stages: [
            { name: 'استخراج الصور من ZIP', weight: 20 },
            { name: 'رفع الصور إلى ImgBB', weight: 80 }
        ],
        currentStage: 0,
        currentStageProgress: 0,
        status: 'idle' as 'idle' | 'uploading' | 'success' | 'error',
        message: '',
        error: ''
    });

    // Poll progress for async upload
    useEffect(() => {
        if (!jobId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/chapters/upload-progress/${jobId}/`, {
                    headers: { ...getAuthHeaders() }
                });
                if (!res.ok) return;

                const data = await res.json();

                if (data.status === 'completed') {
                    setUploadState(prev => ({
                        ...prev,
                        currentStage: 1,
                        currentStageProgress: 100,
                        status: 'success',
                        message: `تم رفع ${data.total} صورة بنجاح!`
                    }));
                    clearInterval(interval);
                    setProgress('تم حفظ الفصل بنجاح!');
                    setTimeout(() => {
                        router.push(`/dashboard/manga/${mangaId}`);
                    }, 1500);
                } else if (data.status === 'failed') {
                    setUploadState(prev => ({
                        ...prev,
                        status: 'error',
                        error: data.error || 'فشل الرفع'
                    }));
                    setError(data.error || 'فشل الرفع');
                    setSaving(false);
                    clearInterval(interval);
                } else if (data.status === 'uploading') {
                    setUploadState(prev => ({
                        ...prev,
                        currentStage: 1,
                        currentStageProgress: data.percentage,
                        message: `جاري رفع الصور... ${data.completed}/${data.total}`
                    }));
                } else if (data.status === 'started') {
                    setUploadState(prev => ({
                        ...prev,
                        currentStage: 0,
                        currentStageProgress: 50,
                        message: 'جاري استخراج الصور...'
                    }));
                }
            } catch (err) {
                console.error('Poll error:', err);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [jobId, mangaId, router]);

    const [formData, setFormData] = useState({
        title: '',
        number: '',
        release_date: ''
    });
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        async function loadChapter() {
            try {
                const res = await fetch(`${API_URL}/chapters/${chapterId}/`);
                if (res.ok) {
                    const chapter = await res.json();
                    setFormData({
                        title: chapter.title || '',
                        number: chapter.number?.toString() || '',
                        release_date: chapter.release_date || ''
                    });
                } else {
                    setError('فشل تحميل بيانات الفصل');
                }
            } catch (err) {
                setError('حدث خطأ في الاتصال');
            } finally {
                setLoading(false);
            }
        }
        loadChapter();
    }, [chapterId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');
        setProgress('');

        try {
            // If file is provided, use the async upload endpoint
            if (file) {
                setProgress('جاري رفع الملف...');
                setUploadState(prev => ({
                    ...prev,
                    status: 'uploading',
                    currentStage: 0,
                    currentStageProgress: 0,
                    message: 'جاري رفع الملف...'
                }));

                const uploadFormData = new FormData();
                uploadFormData.append('manga', mangaId);
                uploadFormData.append('number', formData.number);
                uploadFormData.append('title', formData.title);
                uploadFormData.append('release_date', formData.release_date || '');
                uploadFormData.append('file', file);

                const res = await fetch(`${API_URL}/chapters/upload-async/`, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeaders()
                    },
                    body: uploadFormData,
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setUploadState(prev => ({
                        ...prev,
                        status: 'error',
                        error: data.error || 'فشل رفع الفصل'
                    }));
                    throw new Error(data.error || 'فشل رفع الفصل');
                }

                const data = await res.json();
                setJobId(data.job_id);
                // Polling will handle the rest
                return;
            } else {
                // Just update metadata
                const res = await fetch(`${API_URL}/chapters/${chapterId}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: formData.title,
                        number: parseFloat(formData.number),
                        release_date: formData.release_date || null
                    }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.detail || data.error || 'فشل تحديث الفصل');
                }
                setProgress('تم حفظ التعديلات بنجاح!');
            }

            if (!file) {
                setTimeout(() => router.push(`/dashboard/manga/${mangaId}`), 500);
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ');
        } finally {
            setSaving(false);
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
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/dashboard/manga/${mangaId}`} className="p-2 text-gray-400 hover:text-white transition-colors">
                    <FaArrowRight />
                </Link>
                <h1 className="text-3xl font-bold text-white">تعديل الفصل</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
                <div>
                    <label className="block text-gray-300 mb-2">رقم الفصل *</label>
                    <input
                        type="number"
                        step="0.5"
                        required
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-gray-300 mb-2">عنوان الفصل</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-gray-300 mb-2">تاريخ النشر</label>
                    <input
                        type="date"
                        value={formData.release_date}
                        onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-gray-300 mb-2">استبدال ملف الفصل (اختياري)</label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <input
                            type="file"
                            accept=".zip,.cbz"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="chapter-file"
                        />
                        <label htmlFor="chapter-file" className="cursor-pointer">
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
                                    <p className="text-gray-400">اسحب ملف ZIP/CBZ أو انقر للاختيار</p>
                                    <p className="text-gray-500 text-sm mt-1">اتركه فارغًا للإبقاء على الصور الحالية</p>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                {/* Enhanced Upload Progress Bar */}
                {uploadState.status !== 'idle' && (
                    <EnhancedUploadProgress
                        stages={uploadState.stages}
                        currentStage={uploadState.currentStage}
                        currentStageProgress={uploadState.currentStageProgress}
                        status={uploadState.status}
                        message={uploadState.message}
                        error={uploadState.error}
                    />
                )}

                {progress && uploadState.status === 'idle' && (
                    <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 text-blue-400">
                        {progress}
                    </div>
                )}

                {error && uploadState.status === 'idle' && (
                    <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-400">
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                        <FaSave /> {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                    </button>
                    <Link
                        href={`/dashboard/manga/${mangaId}`}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                        <FaTimes /> إلغاء
                    </Link>
                </div>
            </form>
        </div>
    );
}

