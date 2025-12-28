'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaUpload, FaRobot, FaSave, FaSpinner, FaCheckCircle,
    FaExclamationTriangle, FaArrowRight
} from 'react-icons/fa';
import Link from 'next/link';
import ChapterPreview, { ViewMode } from '@/components/ChapterPreview';
import { UploadProgressBar } from '@/components/UploadProgressBar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Manga {
    id: string;
    title: string;
    cover_image_url: string;
}

interface PreviewImage {
    page_number: number;
    url: string;
    filename: string;
}

interface TranslationJob {
    job_id: string;
    status: string;
    total_pages: number;
    translated_pages: number;
    original_images?: PreviewImage[];
    translated_images?: PreviewImage[];
    error_message?: string;
}

export default function TranslatePage() {
    const router = useRouter();

    // Manga and Chapter Data
    const [allManga, setAllManga] = useState<Manga[]>([]);
    const [selectedManga, setSelectedManga] = useState('');
    const [chapterNumber, setChapterNumber] = useState('');
    const [chapterTitle, setChapterTitle] = useState('');
    const [releaseDate, setReleaseDate] = useState('');

    // File Upload
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Translation Job
    const [currentJob, setCurrentJob] = useState<TranslationJob | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('translated');

    // Publishing
    const [publishing, setPublishing] = useState(false);
    const [publishProgress, setPublishProgress] = useState({
        current: 0,
        total: 0,
        status: 'idle' as 'idle' | 'uploading' | 'processing' | 'success' | 'error',
        fileName: '',
        error: ''
    });

    const [error, setError] = useState('');

    // Fetch manga list
    useEffect(() => {
        fetchManga();
    }, []);

    const fetchManga = async () => {
        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/manga/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setAllManga(Array.isArray(data) ? data : data.results || []);
            }
        } catch (error) {
            console.error('Error fetching manga:', error);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate file type
            const validTypes = ['.zip', '.cbz'];
            const fileExt = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();

            if (!validTypes.includes(fileExt)) {
                setError('يرجى اختيار ملف ZIP أو CBZ فقط');
                return;
            }

            setFile(selectedFile);
            setError('');
        }
    };

    const handleUploadAndTranslate = async () => {
        if (!file) {
            setError('يرجى اختيار ملف');
            return;
        }

        setUploading(true);
        setError('');
        setCurrentJob(null);

        // Initialize upload progress
        setPublishProgress({
            current: 0,
            total: 100,
            status: 'uploading',
            fileName: file.name,
            error: ''
        });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('manga_token');

            // Use XMLHttpRequest for upload progress tracking
            const data = await new Promise<any>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // Track upload progress
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100);
                        setPublishProgress(prev => ({
                            ...prev,
                            current: percentComplete,
                            total: 100,
                            status: 'uploading'
                        }));
                    }
                });

                // Handle completion
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
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
                xhr.open('POST', `${API_URL}/translation/upload-for-preview/`);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.send(formData);
            });

            // Upload complete, now processing
            setPublishProgress(prev => ({
                ...prev,
                current: 100,
                total: 100,
                status: 'success'
            }));

            if (data) {
                setCurrentJob({
                    job_id: data.job_id,
                    status: data.status || 'processing',
                    total_pages: data.total_pages || 0,
                    translated_pages: 0,
                    original_images: [],
                    translated_images: [],
                    error_message: undefined
                });

                // Start polling for status updates
                startPolling(data.job_id);

                // Reset file and progress after a delay
                setTimeout(() => {
                    setPublishProgress({
                        current: 0,
                        total: 0,
                        status: 'idle',
                        fileName: '',
                        error: ''
                    });
                }, 2000);

                // Reset file input
                setFile(null);
                const fileInput = document.getElementById('file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'فشل الرفع');
            setPublishProgress(prev => ({
                ...prev,
                status: 'error',
                error: err.message || 'فشل الرفع'
            }));
        } finally {
            setUploading(false);
        }
    };

    const startPolling = (jobId: string) => {
        const pollInterval = setInterval(async () => {
            try {
                const token = localStorage.getItem('manga_token');
                const res = await fetch(`${API_URL}/translation/status/${jobId}/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();

                    setCurrentJob(prev => prev ? {
                        ...prev,
                        status: data.status,
                        total_pages: data.total_pages || prev.total_pages,
                        translated_pages: data.translated_pages || 0,
                        error_message: data.error_message
                    } : null);

                    // Stop polling when complete or failed
                    if (data.status === 'completed') {
                        clearInterval(pollInterval);
                        await fetchPreview(jobId);
                    } else if (data.status === 'failed') {
                        clearInterval(pollInterval);
                        setError(data.error_message || 'فشلت عملية الترجمة');
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 2000); // Poll every 2 seconds

        // Store interval ID to clear on unmount
        return () => clearInterval(pollInterval);
    };

    const fetchPreview = async (jobId: string) => {
        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/translation/preview/${jobId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();

                // Backend returns URLs like /api/translation/preview/.../image/...
                // So we need base URL WITHOUT /api suffix
                const BASE_URL = 'http://localhost:8000';

                // Convert relative URLs to absolute
                const originalImages = (data.original_images || []).map((img: PreviewImage) => ({
                    ...img,
                    url: `${BASE_URL}${img.url}`
                }));

                const translatedImages = (data.translated_images || []).map((img: PreviewImage) => ({
                    ...img,
                    url: `${BASE_URL}${img.url}`
                }));

                setCurrentJob({
                    job_id: data.job_id,
                    status: data.status,
                    total_pages: data.total_pages,
                    translated_pages: data.total_pages,
                    original_images: originalImages,
                    translated_images: translatedImages,
                    error_message: data.error_message
                });
            }
        } catch (error) {
            console.error('Error fetching preview:', error);
        }
    };

    const handlePublish = async () => {
        if (!currentJob || !selectedManga || !chapterNumber) {
            setError('يرجى اختيار المانجا ورقم الفصل');
            return;
        }

        setPublishing(true);
        setError('');

        // Initial uploading state
        setPublishProgress({
            current: 0,
            total: currentJob.total_pages,
            status: 'uploading',
            fileName: `جاري رفع ${currentJob.total_pages} صورة إلى ImgBB...`,
            error: ''
        });

        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/translation/publish-chapter/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    job_id: currentJob.job_id,
                    manga_id: selectedManga,
                    chapter_number: parseFloat(chapterNumber),
                    title: chapterTitle || null,
                    release_date: releaseDate || null
                })
            });

            if (res.status === 202) {
                // Accepted! Start polling
                const data = await res.json();
                const jobId = data.job_id;

                const pollInterval = setInterval(async () => {
                    try {
                        const statusRes = await fetch(`${API_URL}/translation/status/${jobId}/`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (statusRes.ok) {
                            const statusData = await statusRes.json();

                            // Update progress
                            setPublishProgress(prev => ({
                                ...prev,
                                current: statusData.translated_pages || 0,
                                total: statusData.total_pages || currentJob.total_pages,
                                status: 'uploading',
                                fileName: `جاري الرفع... (${statusData.translated_pages || 0}/${statusData.total_pages || currentJob.total_pages})`
                            }));

                            // Check if completed
                            if (statusData.status === 'published') {
                                clearInterval(pollInterval);
                                setPublishProgress(prev => ({
                                    ...prev,
                                    current: statusData.total_pages,
                                    total: statusData.total_pages,
                                    status: 'success',
                                    fileName: `تم رفع ${statusData.total_pages} صورة بنجاح!`
                                }));

                                // Reset after success
                                setTimeout(() => {
                                    setPublishProgress({
                                        current: 0,
                                        total: 0,
                                        status: 'idle',
                                        fileName: '',
                                        error: ''
                                    });

                                    // Reset form
                                    setCurrentJob(null);
                                    setSelectedManga('');
                                    setChapterNumber('');
                                    setChapterTitle('');
                                    setReleaseDate('');
                                    setPublishing(false);
                                }, 2000);
                            } else if (statusData.status === 'failed') {
                                clearInterval(pollInterval);
                                throw new Error(statusData.error_message || 'فشل رفع الصور');
                            }
                        }
                    } catch (pollError: any) {
                        console.error('Polling error:', pollError);
                        clearInterval(pollInterval);
                        throw pollError;
                    }
                }, 1000); // Poll every second

            } else if (res.ok) {
                // Fallback for older backend version
                const data = await res.json();
                setPublishProgress(prev => ({
                    ...prev,
                    current: data.uploaded_count || currentJob.total_pages,
                    total: currentJob.total_pages,
                    status: 'success',
                    fileName: `تم رفع ${data.uploaded_count || currentJob.total_pages} صورة بنجاح!`
                }));

                setTimeout(() => {
                    setPublishProgress({
                        current: 0,
                        total: 0,
                        status: 'idle',
                        fileName: '',
                        error: ''
                    });
                    setCurrentJob(null);
                    setSelectedManga('');
                    setChapterNumber('');
                    setChapterTitle('');
                    setReleaseDate('');
                }, 2000);
            } else {
                const data = await res.json();
                throw new Error(data.error || 'فشل نشر الفصل');
            }
        } catch (err: any) {
            console.error('Publish error:', err);
            setError(err.message || 'فشل نشر الفصل');
            setPublishProgress(prev => ({
                ...prev,
                status: 'error',
                error: err.message || 'فشل النشر'
            }));
        } finally {
            setPublishing(false);
        }
    };

    const resetAll = () => {
        setCurrentJob(null);
        setFile(null);
        setSelectedManga('');
        setChapterNumber('');
        setChapterTitle('');
        setReleaseDate('');
        setError('');
        setPublishProgress({
            current: 0,
            total: 0,
            status: 'idle',
            fileName: '',
            error: ''
        });
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 text-gray-400 hover:text-white transition-colors">
                        <FaArrowRight />
                    </Link>
                    <h1 className="text-3xl font-bold text-white">ترجمة وإضافة فصل</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Form */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Manga and Chapter Selection */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">بيانات الفصل</h2>

                        <div className="space-y-4">
                            {/* Manga Select */}
                            <div>
                                <label className="block text-gray-300 mb-2">اختر المانجا *</label>
                                <select
                                    value={selectedManga}
                                    onChange={(e) => setSelectedManga(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                                    disabled={publishing}
                                >
                                    <option value="">-- اختر مانجا --</option>
                                    {allManga.map((manga) => (
                                        <option key={manga.id} value={manga.id}>
                                            {manga.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Chapter Number */}
                            <div>
                                <label className="block text-gray-300 mb-2">رقم الفصل *</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={chapterNumber}
                                    onChange={(e) => setChapterNumber(e.target.value)}
                                    placeholder="مثال: 1 أو 1.5"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                                    disabled={publishing}
                                />
                            </div>

                            {/* Chapter Title */}
                            <div>
                                <label className="block text-gray-300 mb-2">عنوان الفصل (اختياري)</label>
                                <input
                                    type="text"
                                    value={chapterTitle}
                                    onChange={(e) => setChapterTitle(e.target.value)}
                                    placeholder="سيتم توليده تلقائياً إذا تُرك فارغاً"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                                    disabled={publishing}
                                />
                            </div>

                            {/* Release Date */}
                            <div>
                                <label className="block text-gray-300 mb-2">تاريخ النشر (اختياري)</label>
                                <input
                                    type="date"
                                    value={releaseDate}
                                    onChange={(e) => setReleaseDate(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                                    disabled={publishing}
                                />
                            </div>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FaUpload className="text-blue-400" />
                            رفع الفصل
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">ملف الفصل (ZIP أو CBZ)</label>
                                <input
                                    id="file-input"
                                    type="file"
                                    accept=".zip,.cbz"
                                    onChange={handleFileSelect}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                    disabled={uploading || !!currentJob}
                                />
                                {file && (
                                    <p className="text-green-400 text-sm mt-2">
                                        ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleUploadAndTranslate}
                                disabled={uploading || !file || !!currentJob}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <FaSpinner className="animate-spin" />
                                        جاري الرفع والترجمة...
                                    </>
                                ) : (
                                    <>
                                        <FaRobot />
                                        رفع وترجمة
                                    </>
                                )}
                            </button>

                            {currentJob && (
                                <div className="bg-green-900/30 border border-green-600 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-green-400">
                                        <FaCheckCircle />
                                        <span>تمت الترجمة بنجاح! ({currentJob.total_pages} صفحة)</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Publish Button */}
                    {currentJob && (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <button
                                onClick={handlePublish}
                                disabled={publishing || !selectedManga || !chapterNumber}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
                            >
                                {publishing ? (
                                    <>
                                        <FaSpinner className="animate-spin" />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <FaSave />
                                        حفظ الفصل المترجم
                                    </>
                                )}
                            </button>

                            <button
                                onClick={resetAll}
                                disabled={publishing}
                                className="w-full mt-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
                            >
                                إعادة تعيين
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column - Preview */}
                <div className="lg:col-span-2">
                    {currentJob && currentJob.original_images && currentJob.translated_images ? (
                        <ChapterPreview
                            originalImages={currentJob.original_images}
                            translatedImages={currentJob.translated_images}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                        />
                    ) : (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 flex flex-col items-center justify-center text-center">
                            <FaRobot className="text-6xl text-gray-600 mb-4" />
                            <h3 className="text-xl font-bold text-gray-400 mb-2">
                                لا توجد معاينة بعد
                            </h3>
                            <p className="text-gray-500">
                                قم برفع ملف فصل للبدء في الترجمة والمعاينة
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Progress Bar */}
            {publishProgress.status !== 'idle' && (
                <div className="mt-6">
                    <UploadProgressBar
                        current={publishProgress.current}
                        total={publishProgress.total}
                        status={publishProgress.status}
                        fileName={publishProgress.fileName}
                        error={publishProgress.error}
                    />
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="mt-6 bg-red-900/30 border border-red-600 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-400">
                        <FaExclamationTriangle />
                        <span>{error}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
