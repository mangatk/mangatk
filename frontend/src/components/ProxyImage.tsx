'use client';

import React, { useState, useEffect } from 'react';

interface ProxyImageProps {
    src: string;
    alt: string;
    className?: string;
    fallbackSrc?: string;
    onError?: () => void;
    onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
    style?: React.CSSProperties;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// قائمة بوكلاء متعددين للاستخدام
const PROXY_URLS = [
    `${API_URL}/proxy-image/?url=`,
    'https://images.weserv.nl/?url=',
    'https://api.allorigins.win/raw?url=',
];

/**
 * مكون الصورة مع دعم البروكسي
 * 1. يحاول تحميل الصورة مباشرة
 * 2. إذا فشل، يستخدم بروكسي وسيط
 * 3. إذا فشل الكل، يعرض صورة بديلة
 */
export function ProxyImage({
    src,
    alt,
    className = '',
    fallbackSrc = '/placeholder.png',
    onError,
    onClick,
    style
}: ProxyImageProps) {
    // Start by assuming the image can be loaded directly from its source url
    // If it fails (due to regional blocking), the handleImageError will pick it up
    const initialIndex = -1;
    const getInitialSrc = () => src;

    const [currentSrc, setCurrentSrc] = useState(getInitialSrc());
    const [proxyIndex, setProxyIndex] = useState(initialIndex);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setCurrentSrc(getInitialSrc());
        setProxyIndex(initialIndex);
        setHasError(false);
    }, [src]);

    const handleImageError = () => {
        const nextIndex = proxyIndex + 1;

        if (nextIndex < PROXY_URLS.length) {
            setProxyIndex(nextIndex);
            const encodedUrl = encodeURIComponent(src);
            setCurrentSrc(`${PROXY_URLS[nextIndex]}${encodedUrl}`);
        } else {
            setHasError(true);
            setCurrentSrc(fallbackSrc);
            onError?.();
        }
    };

    if (!src) {
        return (
            <img
                src={fallbackSrc}
                alt={alt}
                className={className}
                onClick={onClick}
                style={style}
                loading="lazy"
            />
        );
    }

    return (
        <img
            src={currentSrc}
            alt={alt}
            className={className}
            onError={handleImageError}
            onClick={onClick}
            style={style}
            loading="lazy"
        />
    );
}

export function getProxiedUrl(url: string, proxyIndex: number = 0): string {
    if (!url || proxyIndex >= PROXY_URLS.length) return url;
    const encodedUrl = encodeURIComponent(url);
    return `${PROXY_URLS[proxyIndex]}${encodedUrl}`;
}
