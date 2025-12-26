'use client';

import { useState, useEffect } from 'react';
import { FaUpload, FaRobot, FaDownload, FaCheckCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface AIModel {
    id: string;
    name: string;
    is_default: boolean;
    is_active: boolean;
}

interface TranslationJob {
    id: string;
    original_filename: string;
    status: string;
    status_display: string;
    total_pages: number;
    translated_pages: number;
    error_message: string;
    created_at: string;
    completed_at: string;
}

export default function TranslatePage() {
    const [aiModels, setAiModels] = useState<AIModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [currentJob, setCurrentJob] = useState<TranslationJob | null>(null);
    const [jobs, setJobs] = useState<TranslationJob[]>([]);
    const [error, setError] = useState<string>('');

    // Fetch AI models
    useEffect(() => {
        fetchAIModels();
        fetchJobs();
    }, []);

    // Poll job status when translating
    useEffect(() => {
        if (currentJob && !['completed', 'failed'].includes(currentJob.status)) {
            const interval = setInterval(() => {
                fetchJobStatus(currentJob.id);
            }, 2000); // Poll every 2 seconds

            return () => clearInterval(interval);
        }
    }, [currentJob]);

    const fetchAIModels = async () => {
        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/translation/ai-models/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setAiModels(data);

                // Auto-select default model
                const defaultModel = data.find((m: AIModel) => m.is_default);
                if (defaultModel) {
                    setSelectedModel(defaultModel.id);
                }
            }
        } catch (error) {
            console.error('Error fetching AI models:', error);
        }
    };

    const fetchJobs = async () => {
        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/translation/jobs/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setJobs(data);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }
    };

    const fetchJobStatus = async (jobId: string) => {
        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/translation/jobs/${jobId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setCurrentJob(data);

                // If completed or failed, refresh jobs list
                if (['completed', 'failed'].includes(data.status)) {
                    fetchJobs();
                }
            }
        } catch (error) {
            console.error('Error fetching job status:', error);
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

    const handleUpload = async () => {
        if (!file) {
            setError('يرجى اختيار ملف');
            return;
        }

        if (!selectedModel) {
            setError('يرجى اختيار نموذج AI');
            return;
        }

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('ai_model_id', selectedModel);

        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/translation/upload/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                setCurrentJob(data as any);
                setFile(null);
                // Reset file input
                const fileInput = document.getElementById('file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            } else {
                setError(data.error || 'حدث خطأ أثناء الرفع');
            }
        } catch (error) {
            setError('فشل الاتصال بالخادم');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (jobId: string, filename: string) => {
        const token = localStorage.getItem('manga_token');
        const downloadUrl = `${API_URL}/translation/jobs/${jobId}/download/?token=${token}`;

        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <FaCheckCircle className="text-green-500" />;
            case 'failed':
                return <FaExclamationTriangle className="text-red-500" />;
            default:
                return <FaSpinner className="text-blue-500 animate-spin" />;
        }
    };

    const getProgressPercentage = (job: TranslationJob) => {
        if (job.total_pages === 0) return 0;
        return Math.round((job.translated_pages / job.total_pages) * 100);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-white mb-8">ترجمة المانجا بالذكاء الاصطناعي</h1>

            {/* Upload Section */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FaUpload className="text-blue-400" />
                    رفع فصل جديد
                </h2>

                {/* AI Model Selector */}
                <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">نموذج الذكاء الاصطناعي</label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                    >
                        <option value="">-- اختر نموذج --</option>
                        {aiModels.filter(m => m.is_active).map((model) => (
                            <option key={model.id} value={model.id}>
                                {model.name} {model.is_default && '(افتراضي)'}
                            </option>
                        ))}
                    </select>
                </div>

                {/* File Input */}
                <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">ملف الفصل (ZIP أو CBZ)</label>
                    <input
                        id="file-input"
                        type="file"
                        accept=".zip,.cbz"
                        onChange={handleFileSelect}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    {file && (
                        <p className="text-green-400 text-sm mt-2">✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Upload Button */}
                <button
                    onClick={handleUpload}
                    disabled={uploading || !file || !selectedModel}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                    {uploading ? (
                        <>
                            <FaSpinner className="animate-spin" />
                            جاري الرفع...
                        </>
                    ) : (
                        <>
                            <FaUpload />
                            رفع وترجمة
                        </>
                    )}
                </button>
            </div>

            {/* Current Job Progress */}
            {currentJob && !['completed', 'failed'].includes(currentJob.status) && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FaRobot className="text-purple-400" />
                        جاري الترجمة...
                    </h2>

                    <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                            <span>{currentJob.status_display}</span>
                            <span>{currentJob.translated_pages} / {currentJob.total_pages} صفحة</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                                style={{ width: `${getProgressPercentage(currentJob)}%` }}
                            />
                        </div>
                        <p className="text-center text-white font-bold mt-2">{getProgressPercentage(currentJob)}%</p>
                    </div>
                </div>
            )}

            {/* Jobs History */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-xl font-bold text-white mb-4">سجل الترجمات</h2>

                {jobs.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">لا توجد ترجمات بعد</p>
                ) : (
                    <div className="space-y-3">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    {getStatusIcon(job.status)}
                                    <div>
                                        <p className="text-white font-medium">{job.original_filename}</p>
                                        <p className="text-gray-400 text-sm">
                                            {job.status_display} • {job.translated_pages}/{job.total_pages} صفحة
                                        </p>
                                        {job.error_message && (
                                            <p className="text-red-400 text-xs mt-1">{job.error_message}</p>
                                        )}
                                    </div>
                                </div>

                                {job.status === 'completed' && (
                                    <button
                                        onClick={() => handleDownload(job.id, job.original_filename)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <FaDownload />
                                        تنزيل CBZ
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
