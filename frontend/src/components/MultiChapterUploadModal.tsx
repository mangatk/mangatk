'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUpload, FaTrash, FaEdit, FaCheck, FaImages, FaTimes } from 'react-icons/fa';
import { parseChapterFileName, countImagesInZip } from '@/utils/chapterFileParser';
import { EnhancedUploadProgress } from './EnhancedUploadProgress';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ChapterFile {
    id: string;
    file: File;
    number: string;
    title: string;
    imageCount: number;
    isCountingImages: boolean;
    isEditing: boolean;
    uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
    uploadProgress: number;
    error?: string;
    jobId?: string;
}

interface MultiChapterUploadModalProps {
    mangaId: string;
    mangaTitle: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function MultiChapterUploadModal({
    mangaId,
    mangaTitle,
    onClose,
    onSuccess,
}: MultiChapterUploadModalProps) {
    const router = useRouter();
    const [chapterFiles, setChapterFiles] = useState<ChapterFile[]>([]);
    const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [isUploading, setIsUploading] = useState(false);
    const [totalImageCount, setTotalImageCount] = useState(0);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const { getAuthHeaders } = useAuth();

    // Update total image count when files change
    useEffect(() => {
        const total = chapterFiles.reduce((sum, file) => sum + file.imageCount, 0);
        setTotalImageCount(total);
    }, [chapterFiles]);

    // Handle file selection
    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Filter ZIP/CBZ files
        const zipFiles = files.filter(f =>
            f.name.toLowerCase().endsWith('.zip') || f.name.toLowerCase().endsWith('.cbz')
        );

        if (zipFiles.length === 0) {
            alert('الرجاء اختيار ملفات ZIP أو CBZ فقط');
            return;
        }

        // Parse and add files
        const newChapterFiles: ChapterFile[] = zipFiles.map(file => {
            const parsed = parseChapterFileName(file.name);
            return {
                id: `${Date.now()}-${Math.random()}`,
                file,
                number: parsed.number,
                title: parsed.title || `${mangaTitle} - الفصل ${parsed.number}`,
                imageCount: 0,
                isCountingImages: true,
                isEditing: false,
                uploadStatus: 'pending',
                uploadProgress: 0,
            };
        });

        setChapterFiles(prev => [...prev, ...newChapterFiles]);

        // Count images for each file
        for (const chapterFile of newChapterFiles) {
            const count = await countImagesInZip(chapterFile.file, getAuthHeaders());
            setChapterFiles(prev => prev.map(cf =>
                cf.id === chapterFile.id
                    ? { ...cf, imageCount: count, isCountingImages: false }
                    : cf
            ));
        }

        // Clear input
        e.target.value = '';
    }

    // Remove a file
    function removeFile(id: string) {
        setChapterFiles(prev => prev.filter(cf => cf.id !== id));
    }

    // Toggle edit mode
    function toggleEdit(id: string) {
        setChapterFiles(prev => prev.map(cf =>
            cf.id === id ? { ...cf, isEditing: !cf.isEditing } : cf
        ));
    }

    // Update chapter info
    function updateChapterInfo(id: string, field: 'number' | 'title', value: string) {
        setChapterFiles(prev => prev.map(cf =>
            cf.id === id ? { ...cf, [field]: value } : cf
        ));
    }

    // Upload all chapters
    async function handleUploadAll() {
        if (chapterFiles.length === 0) {
            alert('الرجاء إضافة ملفات أولاً');
            return;
        }

        // Check if any file is still counting images
        if (chapterFiles.some(cf => cf.isCountingImages)) {
            alert('الرجاء الانتظار حتى يتم حساب عدد الصور');
            return;
        }

        setIsUploading(true);

        // Upload each chapter sequentially
        for (const chapterFile of chapterFiles) {
            try {
                // Mark as uploading
                setChapterFiles(prev => prev.map(cf =>
                    cf.id === chapterFile.id ? { ...cf, uploadStatus: 'uploading', uploadProgress: 0 } : cf
                ));

                await uploadSingleChapter(chapterFile);

            } catch (error: any) {
                console.error(`Error uploading chapter ${chapterFile.number}:`, error);
                setChapterFiles(prev => prev.map(cf =>
                    cf.id === chapterFile.id
                        ? { ...cf, uploadStatus: 'error', error: error.message }
                        : cf
                ));
            }
        }

        setIsUploading(false);

        // Check if all succeeded
        const allSuccess = chapterFiles.every(cf => cf.uploadStatus === 'success');
        if (allSuccess) {
            setShowSuccessMessage(true);
            setTimeout(() => {
                onSuccess();
                // Redirect to manga view page
                router.push(`/manga/${mangaId}`);
            }, 2000);
        }
    }

    // Upload a single chapter
    async function uploadSingleChapter(chapterFile: ChapterFile): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const formData = new FormData();
                formData.append('manga', mangaId);
                formData.append('number', chapterFile.number);
                formData.append('title', chapterFile.title);
                formData.append('release_date', releaseDate);
                formData.append('file', chapterFile.file);

                const token = localStorage.getItem('manga_token');

                // Use XMLHttpRequest for upload progress
                const xhr = new XMLHttpRequest();

                // Track file upload progress
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100);
                        setChapterFiles(prev => prev.map(cf =>
                            cf.id === chapterFile.id
                                ? { ...cf, uploadProgress: percentComplete * 0.2 } // File upload is 20% of total
                                : cf
                        ));
                    }
                });

                // Handle completion
                xhr.addEventListener('load', async () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            const jobId = response.job_id;

                            // Update with job ID
                            setChapterFiles(prev => prev.map(cf =>
                                cf.id === chapterFile.id ? { ...cf, jobId } : cf
                            ));

                            // Poll for progress
                            await pollUploadProgress(chapterFile.id, jobId);
                            resolve();
                        } catch (e) {
                            reject(new Error('فشل في قراءة الاستجابة'));
                        }
                    } else {
                        let errorMessage = `فشل الرفع: ${xhr.status}`;
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            errorMessage = errorResponse.error || errorMessage;
                        } catch (e) {
                            // Ignore
                        }
                        reject(new Error(errorMessage));
                    }
                });

                // Handle errors
                xhr.addEventListener('error', () => {
                    reject(new Error('حدث خطأ أثناء الرفع'));
                });

                // Send request
                xhr.open('POST', `${API_URL}/chapters/upload-async/`);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.send(formData);

            } catch (error) {
                reject(error);
            }
        });
    }

    // Poll upload progress
    async function pollUploadProgress(chapterFileId: string, jobId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const pollInterval = setInterval(async () => {
                try {
                    const progressRes = await fetch(
                        `${API_URL}/chapters/upload-progress/${jobId}/`,
                        { headers: getAuthHeaders() }
                    );

                    if (!progressRes.ok) {
                        throw new Error('فشل الحصول على حالة الرفع');
                    }

                    const progressData = await progressRes.json();

                    // Update progress (20% file upload + 80% ImgBB upload)
                    const imgbbProgress = progressData.percentage || 0;
                    const totalProgress = 20 + (imgbbProgress * 0.8);

                    setChapterFiles(prev => prev.map(cf =>
                        cf.id === chapterFileId
                            ? { ...cf, uploadProgress: totalProgress }
                            : cf
                    ));

                    // Check if completed
                    if (progressData.status === 'completed') {
                        clearInterval(pollInterval);
                        setChapterFiles(prev => prev.map(cf =>
                            cf.id === chapterFileId
                                ? { ...cf, uploadStatus: 'success', uploadProgress: 100 }
                                : cf
                        ));
                        resolve();
                    } else if (progressData.status === 'failed') {
                        clearInterval(pollInterval);
                        setChapterFiles(prev => prev.map(cf =>
                            cf.id === chapterFileId
                                ? { ...cf, uploadStatus: 'error', error: progressData.error }
                                : cf
                        ));
                        reject(new Error(progressData.error || 'فشلت عملية الرفع'));
                    }

                } catch (error: any) {
                    clearInterval(pollInterval);
                    reject(error);
                }
            }, 500);
        });
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-gray-800 rounded-xl w-full max-w-4xl p-6 my-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">رفع فصول متعددة</h2>
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* File Upload Area */}
                <div className="mb-6">
                    <label className="block text-gray-300 mb-2">ملفات الفصول (ZIP أو CBZ) *</label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <input
                            type="file"
                            accept=".zip,.cbz"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="multi-chapter-files"
                            disabled={isUploading}
                        />
                        <label htmlFor="multi-chapter-files" className={isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}>
                            <FaUpload className="text-3xl text-gray-500 mx-auto mb-2" />
                            <p className="text-gray-400">اضغط لاختيار ملفات متعددة</p>
                            <p className="text-gray-500 text-sm">ZIP أو CBZ - يمكن اختيار أكثر من ملف</p>
                        </label>
                    </div>
                </div>

                {/* Release Date */}
                <div className="mb-6">
                    <label className="block text-gray-300 mb-2">تاريخ النشر (لجميع الفصول)</label>
                    <input
                        type="date"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                        disabled={isUploading}
                    />
                </div>

                {/* Success Message */}
                {showSuccessMessage && (
                    <div className="mb-6 bg-green-900/30 border border-green-600 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-green-400 text-lg font-semibold mb-2">
                            <FaCheck className="text-2xl" />
                            <span>تم رفع جميع الفصول بنجاح!</span>
                        </div>
                        <p className="text-green-300 text-sm">جاري التحويل إلى صفحة المانجا...</p>
                    </div>
                )}

                {/* Files List */}
                {chapterFiles.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-white">
                                الفصول المحددة ({chapterFiles.length})
                            </h3>
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                                <FaImages />
                                <span>إجمالي الصور: {totalImageCount}</span>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {chapterFiles.map((cf) => (
                                <div
                                    key={cf.id}
                                    className={`bg-gray-700 rounded-lg p-4 border ${cf.uploadStatus === 'success' ? 'border-green-500' :
                                        cf.uploadStatus === 'error' ? 'border-red-500' :
                                            cf.uploadStatus === 'uploading' ? 'border-blue-500' :
                                                'border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center text-blue-400 flex-shrink-0">
                                            {cf.uploadStatus === 'success' ? (
                                                <FaCheck className="text-green-400" />
                                            ) : cf.uploadStatus === 'error' ? (
                                                <FaTimes className="text-red-400" />
                                            ) : (
                                                <FaImages />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {cf.isEditing ? (
                                                <div className="space-y-2">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            value={cf.number}
                                                            onChange={(e) => updateChapterInfo(cf.id, 'number', e.target.value)}
                                                            className="w-24 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                                                            placeholder="رقم"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={cf.title}
                                                            onChange={(e) => updateChapterInfo(cf.id, 'title', e.target.value)}
                                                            className="flex-1 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                                                            placeholder="العنوان"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <h4 className="text-white font-medium">
                                                        الفصل {cf.number}: {cf.title}
                                                    </h4>
                                                    <p className="text-gray-400 text-sm mt-1">
                                                        {cf.file.name} • {(cf.file.size / 1024 / 1024).toFixed(2)} MB
                                                        {cf.isCountingImages ? (
                                                            <span className="ml-2 text-blue-400">جاري حساب الصور...</span>
                                                        ) : (
                                                            <span className="ml-2">{cf.imageCount} صفحة</span>
                                                        )}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Upload Progress */}
                                            {cf.uploadStatus === 'uploading' && (
                                                <div className="mt-2">
                                                    <div className="flex items-center justify-between text-sm mb-1">
                                                        <span className="text-gray-400">جاري الرفع...</span>
                                                        <span className="text-blue-400">{Math.round(cf.uploadProgress)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-600 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${cf.uploadProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Error */}
                                            {cf.uploadStatus === 'error' && cf.error && (
                                                <p className="text-red-400 text-sm mt-2">{cf.error}</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {cf.uploadStatus === 'pending' && (
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => toggleEdit(cf.id)}
                                                    disabled={isUploading}
                                                    className="p-2 text-yellow-400 hover:bg-yellow-600/20 rounded transition-colors"
                                                    title="تعديل"
                                                >
                                                    {cf.isEditing ? <FaCheck /> : <FaEdit />}
                                                </button>
                                                <button
                                                    onClick={() => removeFile(cf.id)}
                                                    disabled={isUploading}
                                                    className="p-2 text-red-400 hover:bg-red-600/20 rounded transition-colors"
                                                    title="حذف"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                    <button
                        onClick={handleUploadAll}
                        disabled={isUploading || chapterFiles.length === 0 || chapterFiles.some(cf => cf.isCountingImages)}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                جاري رفع الفصول...
                            </>
                        ) : (
                            <>
                                <FaUpload /> رفع {chapterFiles.length} فصل
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="px-6 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                        {isUploading ? 'لا يمكن الإلغاء' : 'إلغاء'}
                    </button>
                </div>
            </div>
        </div>
    );
}
