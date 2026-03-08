'use client';

import { useState, useEffect } from 'react';

interface ProxyImageProps {
    src: string;
    alt: string;
    className?: string;
    fallbackSrc?: string;
    onError?: () => void;
    onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
}

// قائمة بوكلاء متعددين للاستخدام
const PROXY_URLS = [
    'https://images.weserv.nl/?url=',
    'https://corsproxy.io/?',
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
    onClick
}: ProxyImageProps) {
    // Detect if we should instantly proxy blocked domains
    const isBlockedDomain = src && (src.includes('ibb.co') || src.includes('imgur.com'));
    const initialIndex = isBlockedDomain ? 0 : -1;
    const getInitialSrc = () => isBlockedDomain ? `${PROXY_URLS[0]}${encodeURIComponent(src)}` : src;

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
            loading="lazy"
        />
    );
}

export function getProxiedUrl(url: string, proxyIndex: number = 0): string {
    if (!url || proxyIndex >= PROXY_URLS.length) return url;
    const encodedUrl = encodeURIComponent(url);
    return `${PROXY_URLS[proxyIndex]}${encodedUrl}`;
}
