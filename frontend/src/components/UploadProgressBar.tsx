import React from 'react';

interface UploadProgressBarProps {
    current: number;
    total: number;
    status?: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
    fileName?: string;
    error?: string;
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
    current,
    total,
    status = 'idle',
    fileName,
    error
}) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    const getStatusColor = () => {
        switch (status) {
            case 'uploading':
            case 'processing':
                return 'bg-blue-600';
            case 'success':
                return 'bg-green-600';
            case 'error':
                return 'bg-red-600';
            default:
                return 'bg-gray-400';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'uploading':
                return `جاري الرفع... ${current} من ${total} صورة`;
            case 'processing':
                return `جاري معالجة ورفع الصور إلى ImgBB...`;
            case 'success':
                return `✓ تم رفع ${total} صورة بنجاح`;
            case 'error':
                return `✗ خطأ في الرفع`;
            default:
                return 'في انتظار البدء...';
        }
    };

    if (status === 'idle') {
        return null;
    }

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {status === 'uploading' && (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {status === 'success' && (
                        <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {getStatusText()}
                    </span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {percentage}%
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                    className={`h-full ${getStatusColor()} transition-all duration-300 ease-out rounded-full relative overflow-hidden ${status === 'processing' ? 'w-full' : ''
                        }`}
                    style={status === 'processing' ? undefined : { width: `${percentage}%` }}
                >
                    {(status === 'uploading' || status === 'processing') && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    )}
                </div>
            </div>

            {/* File name or error message */}
            {fileName && (status === 'uploading' || status === 'processing') && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                    📄 {fileName}
                </p>
            )}
            {error && status === 'error' && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
};

// Shimmer animation for the progress bar
const styles = `
@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

.animate-shimmer {
    animation: shimmer 2s infinite;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
