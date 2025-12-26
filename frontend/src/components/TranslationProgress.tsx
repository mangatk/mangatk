import React from 'react';
import { FaCheck, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

interface TranslationStage {
    name: string;
    status: 'pending' | 'active' | 'completed' | 'error';
    message?: string;
}

interface TranslationProgressProps {
    currentStage: number;
    stages: TranslationStage[];
    progress: number;
    estimatedTime?: number;
    onCancel?: () => void;
    canCancel?: boolean;
}

export const TranslationProgress: React.FC<TranslationProgressProps> = ({
    currentStage,
    stages,
    progress,
    estimatedTime,
    onCancel,
    canCancel = false
}) => {
    const getStageIcon = (stage: TranslationStage) => {
        switch (stage.status) {
            case 'completed':
                return <FaCheck className="text-green-500" />;
            case 'active':
                return <FaSpinner className="text-blue-500 animate-spin" />;
            case 'error':
                return <FaExclamationTriangle className="text-red-500" />;
            default:
                return <div className="w-5 h-5 rounded-full border-2 border-gray-500"></div>;
        }
    };

    const getStageColor = (stage: TranslationStage) => {
        switch (stage.status) {
            case 'completed':
                return 'text-green-400';
            case 'active':
                return 'text-blue-400 font-bold';
            case 'error':
                return 'text-red-400';
            default:
                return 'text-gray-500';
        }
    };

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${Math.round(seconds)} ثانية`;
        const minutes = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${minutes} دقيقة${secs > 0 ? ` و ${secs} ثانية` : ''}`;
    };

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">تقدم الترجمة</h3>
                {canCancel && onCancel && (
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
                    >
                        إلغاء
                    </button>
                )}
            </div>

            {/* Overall Progress Bar */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">التقدم الإجمالي</span>
                    <span className="text-lg font-bold text-white">{progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 ease-out relative overflow-hidden"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                </div>
                {estimatedTime && estimatedTime > 0 && (
                    <p className="text-xs text-gray-500 mt-1 text-right">
                        الوقت المتبقي المتوقع: {formatTime(estimatedTime)}
                    </p>
                )}
            </div>

            {/* Stages */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">المراحل:</h4>
                {stages.map((stage, index) => (
                    <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-all ${stage.status === 'active'
                                ? 'bg-blue-900/30 border border-blue-700'
                                : stage.status === 'completed'
                                    ? 'bg-green-900/20 border border-green-800'
                                    : stage.status === 'error'
                                        ? 'bg-red-900/30 border border-red-700'
                                        : 'bg-gray-700/30 border border-gray-700'
                            }`}
                    >
                        <div className="mt-0.5">{getStageIcon(stage)}</div>
                        <div className="flex-1">
                            <p className={`font-medium ${getStageColor(stage)}`}>
                                {index + 1}. {stage.name}
                            </p>
                            {stage.message && (
                                <p className="text-xs text-gray-400 mt-1">{stage.message}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Box */}
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                    💡 يمكنك ترك هذه الصفحة والعودة لاحقاً. سيستمر العمل في الخلفية.
                </p>
            </div>
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
if (typeof document !== 'undefined' && !document.getElementById('translation-progress-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'translation-progress-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
