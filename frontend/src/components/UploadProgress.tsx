'use client';

import { FaSpinner, FaCheck } from 'react-icons/fa';

interface UploadProgressProps {
    progress: number;  // 0-100
    currentFile?: number;
    totalFiles?: number;
    isComplete?: boolean;
    label?: string;
}

export function UploadProgress({
    progress,
    currentFile,
    totalFiles,
    isComplete,
    label = 'جاري الرفع...'
}: UploadProgressProps) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm">
                    {isComplete ? (
                        <FaCheck className="text-green-500" />
                    ) : (
                        <FaSpinner className="animate-spin text-blue-500" />
                    )}
                    <span className="text-gray-300">
                        {isComplete ? 'اكتمل الرفع!' : label}
                    </span>
                </div>
                <span className="text-sm text-gray-400">
                    {progress}%
                    {totalFiles && totalFiles > 1 && ` (${currentFile}/${totalFiles})`}
                </span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
