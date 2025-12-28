/**
 * Chapter Preview Component
 * Displays chapter images with multiple view modes for comparison
 */

'use client';

import { useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaExpand, FaTimes } from 'react-icons/fa';
import { ProxyImage } from './ProxyImage';

export type ViewMode = 'original' | 'translated' | 'sidebyside';

interface PreviewImage {
    page_number: number;
    url: string;
    filename: string;
}

interface ChapterPreviewProps {
    originalImages: PreviewImage[];
    translatedImages: PreviewImage[];
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export default function ChapterPreview({
    originalImages,
    translatedImages,
    viewMode,
    onViewModeChange
}: ChapterPreviewProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const totalPages = Math.max(originalImages.length, translatedImages.length);

    const getCurrentOriginalImage = () => {
        return originalImages.find(img => img.page_number === currentPage);
    };

    const getCurrentTranslatedImage = () => {
        return translatedImages.find(img => img.page_number === currentPage);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleImageClick = (url: string) => {
        setZoomedImage(url);
    };

    const closeZoom = () => {
        setZoomedImage(null);
    };

    const currentOriginal = getCurrentOriginalImage();
    const currentTranslated = getCurrentTranslatedImage();

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            {/* Header with view mode toggle */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">معاينة الفصل</h2>

                <div className="flex gap-2">
                    <button
                        onClick={() => onViewModeChange('original')}
                        className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'original'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        الأصلي
                    </button>
                    <button
                        onClick={() => onViewModeChange('translated')}
                        className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'translated'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        المترجم
                    </button>
                    <button
                        onClick={() => onViewModeChange('sidebyside')}
                        className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'sidebyside'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        جنباً إلى جنب
                    </button>
                </div>
            </div>

            {/* Image Display */}
            <div className="mb-6">
                {viewMode === 'original' && currentOriginal && (
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <ProxyImage
                                src={currentOriginal.url}
                                alt={`الصفحة ${currentPage} - الأصلي`}
                                className="max-w-full max-h-[600px] rounded-lg cursor-pointer"
                                onClick={() => handleImageClick(currentOriginal.url)}
                            />
                            <button
                                onClick={() => handleImageClick(currentOriginal.url)}
                                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <FaExpand />
                            </button>
                        </div>
                        <p className="text-gray-400 text-sm mt-2">الصورة الأصلية</p>
                    </div>
                )}

                {viewMode === 'translated' && currentTranslated && (
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <ProxyImage
                                src={currentTranslated.url}
                                alt={`الصفحة ${currentPage} - المترجم`}
                                className="max-w-full max-h-[600px] rounded-lg cursor-pointer"
                                onClick={() => handleImageClick(currentTranslated.url)}
                            />
                            <button
                                onClick={() => handleImageClick(currentTranslated.url)}
                                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <FaExpand />
                            </button>
                        </div>
                        <p className="text-gray-400 text-sm mt-2">الصورة المترجمة</p>
                    </div>
                )}

                {viewMode === 'sidebyside' && (
                    <div className="grid grid-cols-2 gap-4">
                        {currentOriginal && (
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    <ProxyImage
                                        src={currentOriginal.url}
                                        alt={`الصفحة ${currentPage} - الأصلي`}
                                        className="w-full max-h-[500px] object-contain rounded-lg cursor-pointer"
                                        onClick={() => handleImageClick(currentOriginal.url)}
                                    />
                                    <button
                                        onClick={() => handleImageClick(currentOriginal.url)}
                                        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <FaExpand />
                                    </button>
                                </div>
                                <p className="text-gray-400 text-sm mt-2">الأصلي</p>
                            </div>
                        )}
                        {currentTranslated && (
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    <ProxyImage
                                        src={currentTranslated.url}
                                        alt={`الصفحة ${currentPage} - المترجم`}
                                        className="w-full max-h-[500px] object-contain rounded-lg cursor-pointer"
                                        onClick={() => handleImageClick(currentTranslated.url)}
                                    />
                                    <button
                                        onClick={() => handleImageClick(currentTranslated.url)}
                                        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <FaExpand />
                                    </button>
                                </div>
                                <p className="text-gray-400 text-sm mt-2">المترجم</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Page Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <FaArrowRight /> الصفحة السابقة
                </button>

                <div className="text-white font-medium">
                    الصفحة {currentPage} من {totalPages}
                </div>

                <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                    الصفحة التالية <FaArrowLeft />
                </button>
            </div>

            {/* Page Grid Navigation */}
            <div className="mt-6 grid grid-cols-10 gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`py-2 rounded text-sm transition-colors ${currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        {pageNum}
                    </button>
                ))}
            </div>

            {/* Zoomed Image Modal */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={closeZoom}
                >
                    <button
                        onClick={closeZoom}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-colors"
                    >
                        <FaTimes size={24} />
                    </button>
                    <ProxyImage
                        src={zoomedImage}
                        alt="Zoomed"
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
