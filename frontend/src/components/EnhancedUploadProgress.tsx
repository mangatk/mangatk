import React from 'react';

export interface UploadStage {
    name: string;
    weight: number; // النسبة من الإجمالي (مثلاً: 10 = 10%)
}

interface EnhancedUploadProgressProps {
    stages: UploadStage[];
    currentStage: number;
    currentStageProgress: number; // 0-100 for current stage
    status: 'idle' | 'uploading' | 'success' | 'error';
    message?: string;
    error?: string;
}

export const EnhancedUploadProgress: React.FC<EnhancedUploadProgressProps> = ({
    stages,
    currentStage,
    currentStageProgress,
    status,
    message,
    error
}) => {
    // Calculate overall progress
    const calculateOverallProgress = () => {
        let totalProgress = 0;

        // Add completed stages
        for (let i = 0; i < currentStage && i < stages.length; i++) {
            totalProgress += stages[i].weight;
        }

        // Add current stage progress
        if (currentStage < stages.length) {
            const currentWeight = stages[currentStage].weight;
            totalProgress += (currentStageProgress / 100) * currentWeight;
        }

        return Math.min(Math.round(totalProgress), 100);
    };

    const overallProgress = calculateOverallProgress();

    const getStatusColor = () => {
        switch (status) {
            case 'uploading':
                return 'bg-blue-600';
            case 'success':
                return 'bg-green-600';
            case 'error':
                return 'bg-red-600';
            default:
                return 'bg-gray-400';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'uploading':
                return (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                );
            case 'success':
                return (
                    <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'error':
                return (
                    <div className="w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            default:
                return null;
        }
    };

    if (status === 'idle') {
        return null;
    }

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {message || 'جاري المعالجة...'}
                    </span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {overallProgress}%
                </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-3">
                <div
                    className={`h-full ${getStatusColor()} transition-all duration-300 ease-out relative overflow-hidden`}
                    style={{ width: `${overallProgress}%` }}
                >
                    {status === 'uploading' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    )}
                </div>
            </div>

            {/* Stages */}
            {status === 'uploading' && stages.length > 1 && (
                <div className="space-y-2">
                    {stages.map((stage, index) => {
                        const isActive = index === currentStage;
                        const isCompleted = index < currentStage;

                        return (
                            <div key={index} className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted
                                        ? 'bg-green-500 text-white'
                                        : isActive
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                                    }`}>
                                    {isCompleted ? '✓' : index + 1}
                                </div>
                                <span className={`text-sm flex-1 ${isActive
                                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                                        : isCompleted
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {stage.name}
                                </span>
                                {isActive && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {currentStageProgress}%
                                    </span>
                                )}
                                {isCompleted && (
                                    <span className="text-xs text-green-600 dark:text-green-400">
                                        ✓
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Error message */}
            {error && status === 'error' && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
};

// Shimmer animation
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
if (typeof document !== 'undefined' && !document.getElementById('enhanced-upload-progress-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'enhanced-upload-progress-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
