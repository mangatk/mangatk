import React from 'react';

interface DashboardSkeletonProps {
    count?: number;
}

// Manga Table Row Skeleton
export const MangaTableSkeleton: React.FC<DashboardSkeletonProps> = ({ count = 5 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <tr key={index} className="border-b border-gray-700 animate-pulse">
                    <td className="p-4">
                        <div className="h-4 bg-gray-700 rounded w-8"></div>
                    </td>
                    <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-16 bg-gray-700 rounded"></div>
                            <div className="h-4 bg-gray-700 rounded w-32"></div>
                        </div>
                    </td>
                    <td className="p-4">
                        <div className="h-4 bg-gray-700 rounded w-20"></div>
                    </td>
                    <td className="p-4">
                        <div className="h-4 bg-gray-700 rounded w-16"></div>
                    </td>
                    <td className="p-4">
                        <div className="h-4 bg-gray-700 rounded w-24"></div>
                    </td>
                    <td className="p-4">
                        <div className="flex gap-2">
                            <div className="h-8 w-8 bg-gray-700 rounded"></div>
                            <div className="h-8 w-8 bg-gray-700 rounded"></div>
                            <div className="h-8 w-8 bg-gray-700 rounded"></div>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
};

// Banner Card Skeleton
export const BannerCardSkeleton: React.FC<DashboardSkeletonProps> = ({ count = 4 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="bg-gray-800 rounded-xl p-4 animate-pulse">
                    <div className="aspect-video bg-gray-700 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-32"></div>
                </div>
            ))}
        </>
    );
};

// Generic List Skeleton
export const DashboardListSkeleton: React.FC<DashboardSkeletonProps> = ({ count = 8 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="h-4 bg-gray-700 rounded w-48 mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-32"></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-8 w-8 bg-gray-700 rounded"></div>
                            <div className="h-8 w-8 bg-gray-700 rounded"></div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

// Chapter Table Skeleton
export const ChapterTableSkeleton: React.FC<DashboardSkeletonProps> = ({ count = 10 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <tr key={index} className="border-b border-gray-700 animate-pulse">
                    <td className="p-4">
                        <div className="h-4 bg-gray-700 rounded w-12"></div>
                    </td>
                    <td className="p-4">
                        <div className="h-4 bg-gray-700 rounded w-40"></div>
                    </td>
                    <td className="p-4">
                        <div className="h-4 bg-gray-700 rounded w-24"></div>
                    </td>
                    <td className="p-4">
                        <div className="h-4 bg-gray-700 rounded w-20"></div>
                    </td>
                    <td className="p-4">
                        <div className="flex gap-2">
                            <div className="h-8 w-8 bg-gray-700 rounded"></div>
                            <div className="h-8 w-8 bg-gray-700 rounded"></div>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
};

// Comment Item Skeleton
export const CommentItemSkeleton: React.FC<DashboardSkeletonProps> = ({ count = 5 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                    <div className="flex gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-24"></div>
                        </div>
                    </div>
                    <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                </div>
            ))}
        </>
    );
};
