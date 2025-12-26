'use client';

import { useState, useEffect } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface RatingSectionProps {
    chapterId: string;
    mangaId?: string;
    initialRating?: number;
}

export function RatingSection({ chapterId, mangaId, initialRating = 0 }: RatingSectionProps) {
    const { isAuthenticated, getAuthHeaders } = useAuth();
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [averageRating, setAverageRating] = useState<number>(initialRating);
    const [totalRatings, setTotalRatings] = useState<number>(0);
    const [hasRated, setHasRated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadRating();
    }, [chapterId, isAuthenticated]);

    const loadRating = async () => {
        // Load from localStorage first
        const localKey = `rating_${chapterId}`;
        const savedRating = localStorage.getItem(localKey);
        if (savedRating) {
            setRating(parseInt(savedRating));
            setHasRated(true);
        }

        if (isAuthenticated) {
            try {
                // Get user's rating
                const myRes = await fetch(`${API_URL}/ratings/my_rating/?chapter=${chapterId}`, {
                    headers: { ...getAuthHeaders() },
                });
                if (myRes.ok) {
                    const data = await myRes.json();
                    if (data.rating) {
                        setRating(data.rating);
                        setHasRated(true);
                    }
                }

                // Get average rating (could be a separate endpoint)
                // For now we'll use the local average
            } catch (e) {
                console.error("Error loading rating", e);
            }
        }
    };

    const handleRate = async (value: number) => {
        if (isLoading) return;

        setIsLoading(true);
        setRating(value);
        setHasRated(true);

        // Save locally
        const localKey = `rating_${chapterId}`;
        localStorage.setItem(localKey, value.toString());

        if (isAuthenticated) {
            try {
                await fetch(`${API_URL}/ratings/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                    },
                    body: JSON.stringify({
                        chapter_id: chapterId,
                        rating: value,
                    }),
                });
            } catch (e) {
                console.error("Error saving rating", e);
            }
        }

        setIsLoading(false);
    };

    const displayRating = hoverRating || rating;

    return (
        <div className="flex flex-col items-center gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <h4 className="text-sm font-semibold text-gray-400">قيّم هذا الفصل</h4>

            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => handleRate(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        disabled={isLoading}
                        className={`text-2xl transition-all duration-150 transform hover:scale-110 ${star <= displayRating
                            ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                            : 'text-gray-600 hover:text-gray-500'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        {star <= displayRating ? <FaStar /> : <FaRegStar />}
                    </button>
                ))}
            </div>

            {hasRated && (
                <p className="text-xs text-green-400 animate-in fade-in">
                    ✓ شكراً لتقييمك!
                </p>
            )}

            {averageRating > 0 && (
                <p className="text-xs text-gray-500">
                    متوسط التقييم: {averageRating.toFixed(1)} ({totalRatings} تقييم)
                </p>
            )}

            {!isAuthenticated && (
                <p className="text-xs text-gray-500 mt-1">
                    سجّل دخول لحفظ تقييمك
                </p>
            )}
        </div>
    );
}
