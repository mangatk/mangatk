'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUpload, FaTrash, FaEdit, FaCheck, FaImages, FaTimes } from 'react-icons/fa';
import { parseChapterFileName, countImagesInZip, extractImagesFromZip } from '@/utils/chapterFileParser';
import { uploadMultipleWithProgress } from '@/services/imgbb';
import { EnhancedUploadProgress } from './EnhancedUploadProgress';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ChapterFile {
    id: string;
    file?: File;
    imageFiles?: File[];
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
            toast.error('الرجاء اختيار ملفات ZIP أو CBZ فقط');
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
            if (chapterFile.file) {
                const count = await countImagesInZip(chapterFile.file, getAuthHeaders());
                setChapterFiles(prev => prev.map(cf =>
                    cf.id === chapterFile.id
                        ? { ...cf, imageCount: count, isCountingImages: false }
                        : cf
                ));
            }
        }

        // Clear input
        e.target.value = '';
    }

    // Handle folder selection
    async function handleFolderSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const folderGroups = new Map<string, File[]>();
        
        for (const file of files) {
            const pathParts = file.webkitRelativePath.split('/');
            if (pathParts.length > 1) {
                // Get the immediate parent folder of the image
                const folderName = pathParts[pathParts.length - 2];
                if (file.type.startsWith('image/')) {
                    if (!folderGroups.has(folderName)) {
                        folderGroups.set(folderName, []);
                    }
                    folderGroups.get(folderName)!.push(file);
                }
            }
        }

        if (folderGroups.size === 0) {
            toast.error('لم يتم العثور على أي مجلدات تحتوي على صور');
            return;
        }

        const newChapterFiles: ChapterFile[] = [];
        folderGroups.forEach((imageFiles, folderName) => {
            const parsed = parseChapterFileName(folderName);
            newChapterFiles.push({
                id: `${Date.now()}-${Math.random()}`,
                imageFiles: imageFiles, // store raw files
                number: parsed.number,
                title: parsed.title || `${mangaTitle} - ${folderName}`,
                imageCount: imageFiles.length,
                isCountingImages: false,
                isEditing: false,
                uploadStatus: 'pending',
                uploadProgress: 0,
            });
        });

        setChapterFiles(prev => {
            const combined = [...prev, ...newChapterFiles];
            return combined.sort((a, b) => parseFloat(a.number || '0') - parseFloat(b.number || '0'));
        });

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
    const handleUploadAll = async () => {
        if (chapterFiles.length === 0) {
            toast.error('الرجاء إضافة ملفات أولاً');
            return;
        }

        // Check if any file is still counting images
        if (chapterFiles.some(cf => cf.isCountingImages)) {
            toast.error('الرجاء الانتظار حتى يتم حساب عدد الصور');
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
        try {
            // 1. Extract Images locally or use raw images
            let imageFiles: File[] = [];
            if (chapterFile.file) {
                imageFiles = await extractImagesFromZip(chapterFile.file);
            } else if (chapterFile.imageFiles) {
                imageFiles = chapterFile.imageFiles;
            }

            if (imageFiles.length === 0) {
                throw new Error("لا توجد صور في الملف المضغوط");
            }

            // 2. Upload to ImgBB with Parallel Chunks
            const imageUrls = await uploadMultipleWithProgress(imageFiles, (overallPercent) => {
                setChapterFiles(prev => prev.map(cf =>
                    cf.id === chapterFile.id
                        ? { ...cf, uploadProgress: overallPercent * 0.9 } // ImgBB is 90% of progress
                        : cf
                ));
            });

            // 3. Save to Django Backend instantly
            const token = localStorage.getItem('manga_token');
            const data = {
                manga: mangaId,
                number: chapterFile.number,
                title: chapterFile.title,
                release_date: releaseDate,
                image_urls: imageUrls
            };

            const response = await fetch(`${API_URL}/chapters/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || errData.detail || "فشل حفظ الفصل في قاعدة البيانات");
            }

            // Mark as 100% success
            setChapterFiles(prev => prev.map(cf =>
                cf.id === chapterFile.id
                    ? { ...cf, uploadStatus: 'success', uploadProgress: 100 }
                    : cf
            ));

        } catch (error: any) {
            throw error;
        }
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

                <div className="mb-6">
                    <label className="block text-gray-300 mb-2">إضافة الفصول</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ZIP Upload */}
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
                                <p className="text-gray-400 font-bold mb-1">رفع ملفات مضغوطة</p>
                                <p className="text-gray-500 text-xs">اختر عدة ملفات ZIP أو CBZ</p>
                            </label>
                        </div>

                        {/* Folder Upload */}
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                            <input
                                type="file"
                                // @ts-ignore - webkitdirectory is non-standard but widely supported
                                webkitdirectory="true"
                                directory="true"
                                multiple
                                onChange={handleFolderSelect}
                                className="hidden"
                                id="multi-chapter-folders"
                                disabled={isUploading}
                            />
                            <label htmlFor="multi-chapter-folders" className={isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}>
                                <FaUpload className="text-3xl text-purple-800 mx-auto mb-2" />
                                <p className="text-gray-400 font-bold mb-1">رفع المجلدات مباشرة</p>
                                <p className="text-gray-500 text-xs">اختر مجلداً يحتوي على مجلدات فرعية للفصول</p>
                            </label>
                        </div>
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
                                                        {cf.file ? cf.file.name : `مجلد: ${cf.title}`} {cf.file && `• ${(cf.file.size / 1024 / 1024).toFixed(2)} MB`}
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
