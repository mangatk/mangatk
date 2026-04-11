'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaUpload, FaDownload, FaRobot, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import ChapterPreview, { ViewMode } from '@/components/ChapterPreview';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { useLanguage } from '@/context/LanguageContext';

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
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, token } = useAuth();
    const { t } = useLanguage();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [currentJob, setCurrentJob] = useState<TranslationJob | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('translated');
    const [error, setError] = useState('');
    const [polling, setPolling] = useState(false);
    const [userPoints, setUserPoints] = useState<number | null>(null);
    const [requiredPoints] = useState(20); // التكلفة الثابتة

    // Language selection states
    const [sourceLanguage, setSourceLanguage] = useState<string>('');
    const targetLanguage = 'arabic'; // ثابت على العربية

    // Fetch user points on mount
    useEffect(() => {
        fetchUserPoints();
    }, [token]);

    // Resume from URL if exists
    useEffect(() => {
        const jobId = searchParams.get('job_id');
        if (jobId && !currentJob) {
            setCurrentJob({
                job_id: jobId,
                status: 'fetching',
                total_pages: 0,
                translated_pages: 0,
            });
            setPolling(true);
        }
    }, [searchParams]);

    const fetchUserPoints = async () => {
        try {
            if (!token) return;
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
                setError(t('errFileType'));
                return;
            }

            setFile(selectedFile);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!user) {
            setError(t('errLoginRequired'));
            return;
        }

        if (!file) {
            setError(t('errSelectFile'));
            return;
        }

        // Validate language selection
        if (!sourceLanguage) {
            setError(t('errSelectLang'));
            return;
        }

        setUploading(true);
        setError('');
        setPolling(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('source_language', sourceLanguage);
        formData.append('target_language', targetLanguage);

        try {
            if (!token) throw new Error("No auth token");
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
                
                // Track in URL so user can return
                router.replace(`?job_id=${data.job_id}`);

                // Reset file
                setFile(null);
                const fileInput = document.getElementById('file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            } else {
                setError(data.error || t('errUpload'));
                setPolling(false);
            }
        } catch (error) {
            setError(t('errConnect'));
            setPolling(false);
        } finally {
            setUploading(false);
        }
    };

    const fetchStatus = async (jobId: string) => {
        try {
            if (!token) return;
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
                    setError(data.error_message || t('errConnect'));
                }
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    };

    const fetchPreview = async (jobId: string) => {
        try {
            if (!token) return;
            const res = await fetch(`${API_URL}/translate/preview/${jobId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();

                // Backend returns URLs like /api/translate/preview/.../image/...
                // So we need base URL WITHOUT /api suffix
                const BASE_URL = API_URL.replace(/\/api\/?$/, '');

                // Convert relative URLs to absolute
                const originalImages = data.original_images.map((img: any) => ({
                    ...img,
                    url: img.url.startsWith('http') ? img.url : `${BASE_URL}${img.url}`
                }));

                const translatedImages = data.translated_images.map((img: any) => ({
                    ...img,
                    url: img.url.startsWith('http') ? img.url : `${BASE_URL}${img.url}`
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
        if (!currentJob || !token) return;

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
            'uploading':   t('statusUploading'),
            'extracting':  t('statusExtracting'),
            'translating': t('statusTranslating'),
            'creating_cbz':t('statusCreating'),
            'completed':   t('statusCompleted'),
            'failed':      t('statusFailed'),
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 transition-colors duration-300">
            <Header />

            {/* Hero Banner */}
            <div className="relative overflow-hidden pt-8 pb-12">
                {/* Decorative blobs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-10 right-1/4 w-72 h-72 bg-purple-400/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10 text-center">
                    {/* Icon + Title */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl shadow-blue-500/30 mb-6 text-4xl">
                        <FaRobot className="text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                        {t('translateH1a')}{' '}
                        <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                            {t('translateH1b')}
                        </span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-6 max-w-xl mx-auto">
                        {t('translateDesc')}
                    </p>

                    {/* Points Badge */}
                    {userPoints !== null && (
                        <div className="inline-flex items-center gap-3 bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-yellow-300/50 dark:border-yellow-500/30 rounded-2xl px-6 py-3 shadow-lg shadow-yellow-500/5">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🪙</span>
                                <span className="text-yellow-600 dark:text-yellow-400 font-black text-xl">{userPoints}</span>
                                <span className="text-gray-500 dark:text-gray-400 font-medium">{t('pointsUnit')}</span>
                            </div>
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span>{t('cost')}</span>
                                <span className="font-bold text-purple-600 dark:text-purple-400">{requiredPoints}</span>
                                <span>{t('pointsUnit')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 pb-16 max-w-3xl">

                {/* ===== Upload Section ===== */}
                {!currentJob && (
                    <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-white dark:border-gray-700/50 shadow-xl shadow-gray-200/50 dark:shadow-black/30 p-8 mb-6">

                        {/* Language Selection */}
                        <div className="mb-8 p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40">
                            <h3 className="text-gray-800 dark:text-white font-bold text-base mb-1 flex items-center gap-2">
                                <span className="text-xl">🌐</span>
                                {t('selectSourceLang')}
                                <span className="text-red-500 text-xs font-black bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">{t('required')}</span>
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                                {t('selectSourceDesc')}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Source Language */}
                                <div>
                                    <label className="block text-gray-600 dark:text-gray-300 text-sm font-semibold mb-2">
                                        {t('fromLang')} *
                                    </label>
                                    <select
                                        value={sourceLanguage}
                                        onChange={(e) => setSourceLanguage(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                        required
                                    >
                                        <option value="">{t('selectLangOption')}</option>
                                        <option value="chinese">🇨🇳 {t('chinese')}</option>
                                        <option value="japanese">🇯🇵 {t('japanese')}</option>
                                        <option value="korean">🇰🇷 {t('korean')}</option>
                                        <option value="english">🇬🇧 {t('english')}</option>
                                    </select>
                                </div>

                                {/* Target Language (Fixed) */}
                                <div>
                                    <label className="block text-gray-600 dark:text-gray-300 text-sm font-semibold mb-2">
                                        {t('toLang')}
                                    </label>
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-500 dark:text-gray-400 flex items-center gap-3 shadow-sm">
                                        <span className="text-2xl">🇸🇦</span>
                                        <span className="font-medium">{t('arabic')}</span>
                                        <span className="mr-auto text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{t('fixed')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* File Upload Zone */}
                        <label
                            htmlFor="file-input"
                            className={`relative flex flex-col items-center justify-center w-full h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 group
                                ${file
                                    ? 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/10'
                                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/30 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                                }`}
                        >
                            <input
                                id="file-input"
                                type="file"
                                accept=".zip,.cbz"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            {file ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-3xl shadow-inner">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                    <p className="font-bold text-gray-800 dark:text-white text-sm">{file.name}</p>
                                    <p className="text-green-600 dark:text-green-400 text-xs bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full font-medium">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB ✓
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors shadow-inner">
                                        <FaUpload className="text-gray-400 dark:text-gray-500 text-2xl group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                                            {t('dragFile')} <span className="text-blue-500 dark:text-blue-400">{t('orClick')}</span>
                                        </p>
                                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{t('supports')} ZIP, CBZ</p>
                                    </div>
                                </div>
                            )}
                        </label>

                        {/* Upload Button */}
                        <button
                            onClick={handleUpload}
                            disabled={uploading || !file || !sourceLanguage}
                            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-3"
                        >
                            {uploading ? (
                                <>
                                    <FaSpinner className="animate-spin" />
                                    {t('statusUploading')}
                                </>
                            ) : (
                                <>
                                    <FaRobot />
                                    {t('uploadAndTranslate')}
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* ===== Progress Section ===== */}
                {currentJob && !['completed', 'failed'].includes(currentJob.status) && (
                    <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-white dark:border-gray-700/50 shadow-xl p-8 mb-6">
                        <div className="flex flex-col items-center text-center gap-4">
                            {/* Spinning icon */}
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 opacity-20 animate-ping" />
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                                    <FaSpinner className="text-white text-2xl animate-spin" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{getStatusDisplay()}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                {currentJob.translated_pages} / {currentJob.total_pages}  {t('pagesTranslatedOk')}
                            </p>

                            {/* Progress Bar */}
                            <div className="w-full">
                                <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                                    <span>{t('progress')}</span>
                                    <span>{getProgressPercentage()}%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                                        style={{ width: `${getProgressPercentage()}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== Preview + Download Section ===== */}
                {currentJob && currentJob.status === 'completed' && currentJob.original_images && currentJob.translated_images && (
                    <>
                        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-white dark:border-gray-700/50 shadow-xl p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <FaCheckCircle className="text-green-500 text-lg" />
                                </div>
                                <div>
                                    <h2 className="text-gray-900 dark:text-white font-black text-lg">{t('translationDone')}</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{currentJob.total_pages} {t('pagesTranslatedOk')}</p>
                                </div>
                            </div>

                            <ChapterPreview
                                originalImages={currentJob.original_images}
                                translatedImages={currentJob.translated_images}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                            />

                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-3"
                                >
                                    <FaDownload />
                                    {t('downloadCBZ')}
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white py-4 rounded-2xl font-bold text-base transition-all border border-gray-200 dark:border-gray-600"
                                >
                                    {t('translateNew')}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ===== Error Section ===== */}
                {(error || (currentJob && currentJob.status === 'failed')) && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600/40 rounded-2xl p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                            <FaExclamationTriangle className="text-red-500 text-lg" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-red-600 dark:text-red-400 font-bold text-base mb-1">{t('errorOccurred')}</h3>
                            <p className="text-red-500 dark:text-red-300 text-sm">
                                {error || currentJob?.error_message || t('unexpectedError')}
                            </p>
                            <button
                                onClick={handleReset}
                                className="mt-4 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
                            >
                                {t('retry')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
