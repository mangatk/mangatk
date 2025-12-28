import React from 'react';

interface SkeletonCardProps {
    count?: number;
}

export const MangaCardSkeleton: React.FC<SkeletonCardProps> = ({ count = 8 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="bg-gray-800 rounded-lg overflow-hidden animate-pulse"
                >
                    {/* Image skeleton */}
                    <div className="relative aspect-[3/4] bg-gray-700"></div>

                    {/* Content skeleton */}
                    <div className="p-4 space-y-3">
                        {/* Title */}
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>

                        {/* Info */}
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-2">
                            <div className="h-3 bg-gray-700 rounded w-12"></div>
                            <div className="h-3 bg-gray-700 rounded w-16"></div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

export const ListSkeleton: React.FC<SkeletonCardProps> = ({ count = 5 }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="bg-gray-800 rounded-lg p-4 flex gap-4 animate-pulse"
                >
                    {/* Image */}
                    <div className="w-20 h-28 bg-gray-700 rounded flex-shrink-0"></div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PageSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-white animate-pulse">
            {/* Header skeleton */}
            <div className="h-16 bg-gray-800 border-b border-gray-700"></div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8">
                {/* Title */}
                <div className="h-10 bg-gray-800 rounded w-64 mx-auto mb-8"></div>

                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    <MangaCardSkeleton count={10} />
                </div>
            </div>
        </div>
    );
};
