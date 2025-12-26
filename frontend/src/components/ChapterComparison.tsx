import React, { useState, useRef, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaExpand, FaCompress } from 'react-icons/fa';

interface ChapterComparisonProps {
    originalImages: string[];
    translatedImages: string[];
    onClose?: () => void;
}

export const ChapterComparison: React.FC<ChapterComparisonProps> = ({
    originalImages,
    translatedImages,
    onClose
}) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [syncScroll, setSyncScroll] = useState(true);

    const originalScrollRef = useRef<HTMLDivElement>(null);
    const translatedScrollRef = useRef<HTMLDivElement>(null);

    const totalPages = Math.min(originalImages.length, translatedImages.length);

    // Sync scroll between both containers
    const handleScroll = (source: 'original' | 'translated') => {
        if (!syncScroll) return;

        const sourceRef = source === 'original' ? originalScrollRef : translatedScrollRef;
        const targetRef = source === 'original' ? translatedScrollRef : originalScrollRef;

        if (sourceRef.current && targetRef.current) {
            targetRef.current.scrollTop = sourceRef.current.scrollTop;
        }
    };

    const nextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'd') nextPage();
            if (e.key === 'ArrowLeft' || e.key === 'a') prevPage();
            if (e.key === 'f') toggleFullscreen();
            if (e.key === 'Escape' && onClose) onClose();
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentPage, totalPages]);

    if (totalPages === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
                <p className="text-gray-400">لا توجد صور للمقارنة</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                        المقارنة: صفحة {currentPage + 1} من {totalPages}
                    </h3>

                    <div className="flex items-center gap-2">
                        {/* Sync Scroll Toggle */}
                        <button
                            onClick={() => setSyncScroll(!syncScroll)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${syncScroll
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {syncScroll ? '🔗 التمرير المزامن' : '🔓 تمرير مستقل'}
                        </button>

                        {/* Fullscreen Toggle */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                            title="ملء الشاشة (F)"
                        >
                            {isFullscreen ? <FaCompress /> : <FaExpand />}
                        </button>

                        {/* Close Button */}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            >
                                إغلاق
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Images Container */}
            <div className="grid grid-cols-2 gap-1 bg-black">
                {/* Original */}
                <div className="relative">
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3 z-10">
                        <h4 className="text-white font-bold text-center">الأصلي</h4>
                    </div>
                    <div
                        ref={originalScrollRef}
                        onScroll={() => handleScroll('original')}
                        className="h-[600px] overflow-y-auto custom-scrollbar"
                    >
                        <img
                            src={originalImages[currentPage]}
                            alt={`Original page ${currentPage + 1}`}
                            className="w-full h-auto"
                        />
                    </div>
                </div>

                {/* Translated */}
                <div className="relative">
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3 z-10">
                        <h4 className="text-white font-bold text-center">المترجم</h4>
                    </div>
                    <div
                        ref={translatedScrollRef}
                        onScroll={() => handleScroll('translated')}
                        className="h-[600px] overflow-y-auto custom-scrollbar"
                    >
                        <img
                            src={translatedImages[currentPage]}
                            alt={`Translated page ${currentPage + 1}`}
                            className="w-full h-auto"
                        />
                    </div>
                </div>
            </div>

            {/* Navigation Footer */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={prevPage}
                        disabled={currentPage === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors"
                    >
                        <FaArrowRight />
                        السابقة (A)
                    </button>

                    <div className="text-center">
                        <input
                            type="range"
                            min="0"
                            max={totalPages - 1}
                            value={currentPage}
                            onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                            className="w-64"
                        />
                        <p className="text-sm text-gray-400 mt-1">
                            استخدم الأسهم أو A/D للتنقل
                        </p>
                    </div>

                    <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages - 1}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors"
                    >
                        التالية (D)
                        <FaArrowLeft />
                    </button>
                </div>
            </div>

            {/* CSS for custom scrollbar */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1f2937;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #4b5563;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #6b7280;
                }
            `}</style>
        </div>
    );
};
