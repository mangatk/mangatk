'use client';

import { useState, useEffect } from 'react';
import { FaUpload, FaDownload, FaRobot, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import ChapterPreview, { ViewMode } from '@/components/ChapterPreview';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
    original_filename?: string;
}

export default function TranslatePage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [currentJob, setCurrentJob] = useState<TranslationJob | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('translated');
    const [error, setError] = useState('');
    const [polling, setPolling] = useState(false);
    const [userPoints, setUserPoints] = useState<number | null>(null);
    const [requiredPoints] = useState(20); // التكلفة الثابتة

    // Fetch user points on mount
    useEffect(() => {
        fetchUserPoints();
    }, []);

    const fetchUserPoints = async () => {
        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/auth/profile/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setUserPoints(data.points || 0);
            }
        } catch (error) {
            console.error('Error fetching user points:', error);
        }
    };

    // Poll for translation status
    useEffect(() => {
        if (currentJob && !['completed', 'failed'].includes(currentJob.status) && polling) {
            const interval = setInterval(() => {
                fetchStatus(currentJob.job_id);
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [currentJob, polling]);

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

    const handleUpload = async () => {
        if (!file) {
            setError('يرجى اختيار ملف');
            return;
        }

        setUploading(true);
        setError('');
        setPolling(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/translate/upload/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                setCurrentJob({
                    job_id: data.job_id,
                    status: data.status,
                    total_pages: data.total_pages,
                    translated_pages: 0
                });

                // Reset file
                setFile(null);
                const fileInput = document.getElementById('file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            } else {
                setError(data.error || 'حدث خطأ أثناء رفع الملف');
                setPolling(false);
            }
        } catch (error) {
            setError('فشل الاتصال بالخادم');
            setPolling(false);
        } finally {
            setUploading(false);
        }
    };

    const fetchStatus = async (jobId: string) => {
        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/translate/status/${jobId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();

                // Update job status
                setCurrentJob(prev => prev ? {
                    ...prev,
                    status: data.status,
                    total_pages: data.total_pages,
                    translated_pages: data.translated_pages,
                    error_message: data.error_message,
                    original_filename: data.original_filename
                } : null);

                // If completed, fetch preview
                if (data.status === 'completed') {
                    setPolling(false);
                    await fetchPreview(jobId);
                } else if (data.status === 'failed') {
                    setPolling(false);
                    setError(data.error_message || 'فشلت عملية الترجمة');
                }
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    };

    const fetchPreview = async (jobId: string) => {
        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/translate/preview/${jobId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();

                // Backend returns URLs like /api/translate/preview/.../image/...
                // So we need base URL WITHOUT /api suffix
                const BASE_URL = 'http://localhost:8000';

                // Convert relative URLs to absolute
                const originalImages = data.original_images.map((img: any) => ({
                    ...img,
                    url: `${BASE_URL}${img.url}`
                }));

                const translatedImages = data.translated_images.map((img: any) => ({
                    ...img,
                    url: `${BASE_URL}${img.url}`
                }));

                setCurrentJob(prev => prev ? {
                    ...prev,
                    original_images: originalImages,
                    translated_images: translatedImages
                } : null);
            }
        } catch (error) {
            console.error('Error fetching preview:', error);
        }
    };

    const handleDownload = () => {
        if (!currentJob) return;

        const token = localStorage.getItem('manga_token');
        const downloadUrl = `${API_URL}/translate/download/${currentJob.job_id}/`;

        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('Authorization', `Bearer ${token}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setCurrentJob(null);
        setFile(null);
        setError('');
        setViewMode('translated');
        setPolling(false);
    };

    const getStatusDisplay = () => {
        if (!currentJob) return '';

        const statusMap: Record<string, string> = {
            'uploading': 'جاري الرفع...',
            'extracting': 'جاري فك الضغط...',
            'translating': 'جاري الترجمة...',
            'creating_cbz': 'جاري إنشاء الملف...',
            'completed': 'اكتمل!',
            'failed': 'فشل'
        };

        return statusMap[currentJob.status] || currentJob.status;
    };

    const getProgressPercentage = () => {
        if (!currentJob || currentJob.total_pages === 0) return 0;

        if (currentJob.status === 'completed') return 100;
        if (currentJob.status === 'failed') return 0;

        return Math.round((currentJob.translated_pages / currentJob.total_pages) * 100);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                        <FaRobot className="text-blue-400" />
                        ترجمة المانجا بالذكاء الاصطناعي
                    </h1>
                    <p className="text-gray-400 text-lg mb-4">
                        ارفع فصل من المانجا واحصل على الترجمة تلقائياً
                    </p>

                    {/* Points Display */}
                    {userPoints !== null && (
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-600/50 rounded-lg px-6 py-3">
                            <span className="text-yellow-400 font-bold text-lg">{userPoints}</span>
                            <span className="text-gray-300">نقطة</span>
                            <span className="text-gray-500 mx-2">|</span>
                            <span className="text-gray-400 text-sm">التكلفة: {requiredPoints} نقطة</span>
                        </div>
                    )}
                </div>

                {/* Upload Section */}
                {!currentJob && (
                    <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700 p-8 mb-8">
                        <div className="flex flex-col items-center">
                            <div className="w-full max-w-2xl">
                                <label className="block text-gray-300 text-lg font-semibold mb-4 text-center">
                                    اختر ملف الفصل
                                </label>

                                <div className="relative">
                                    <input
                                        id="file-input"
                                        type="file"
                                        accept=".zip,.cbz"
                                        onChange={handleFileSelect}
                                        className="w-full bg-gray-700 border-2 border-dashed border-gray-600 rounded-xl py-12 px-6 text-white text-center cursor-pointer hover:border-blue-500 transition-colors file:hidden"
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <FaUpload className="text-6xl text-gray-500 mb-4" />
                                        <p className="text-gray-400">
                                            {file ? file.name : 'اسحب الملف هنا أو اضغط للاختيار'}
                                        </p>
                                        {file && (
                                            <p className="text-green-400 text-sm mt-2">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || !file}
                                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3"
                                >
                                    {uploading ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            جاري الرفع...
                                        </>
                                    ) : (
                                        <>
                                            <FaRobot />
                                            رفع وترجمة
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Section */}
                {currentJob && !['completed', 'failed'].includes(currentJob.status) && (
                    <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700 p-8 mb-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <FaSpinner className="text-blue-400 animate-spin text-2xl" />
                            <h2 className="text-2xl font-bold text-white">{getStatusDisplay()}</h2>
                        </div>

                        <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden mb-4">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500 flex items-center justify-center text-white text-sm font-bold"
                                style={{ width: `${getProgressPercentage()}%` }}
                            >
                                {getProgressPercentage()}%
                            </div>
                        </div>

                        <p className="text-center text-gray-400">
                            {currentJob.translated_pages} من {currentJob.total_pages} صفحة
                        </p>
                    </div>
                )}

                {/* Preview Section */}
                {currentJob && currentJob.status === 'completed' && currentJob.original_images && currentJob.translated_images && (
                    <>
                        <ChapterPreview
                            originalImages={currentJob.original_images}
                            translatedImages={currentJob.translated_images}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                        />

                        <div className="mt-8 flex gap-4 justify-center">
                            <button
                                onClick={handleDownload}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-3"
                            >
                                <FaDownload />
                                تنزيل CBZ
                            </button>

                            <button
                                onClick={handleReset}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-xl font-medium text-lg transition-colors"
                            >
                                ترجمة فصل جديد
                            </button>
                        </div>
                    </>
                )}

                {/* Error Section */}
                {(error || (currentJob && currentJob.status === 'failed')) && (
                    <div className="bg-red-900/30 border-2 border-red-600 rounded-xl p-6 flex items-start gap-3">
                        <FaExclamationTriangle className="text-red-400 text-2xl mt-1" />
                        <div>
                            <h3 className="text-red-400 font-bold text-lg mb-2">حدث خطأ</h3>
                            <p className="text-red-300">
                                {error || currentJob?.error_message || 'حدث خطأ غير متوقع'}
                            </p>
                            <button
                                onClick={handleReset}
                                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                إعادة المحاولة
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
