/**
 * ImgBB Image Upload Service
 * Central service for uploading images to ImgBB
 */

const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
// API Keys - loaded from environment variable, supports multiple keys comma-separated
const API_KEYS_ENV = process.env.NEXT_PUBLIC_IMGBB_API_KEYS || process.env.NEXT_PUBLIC_IMGBB_API_KEY || '';
const IMGBB_API_KEYS = API_KEYS_ENV.split(',').map(k => k.trim()).filter(Boolean);

export interface ImgbbUploadResult {
    url: string;
    thumb: string;
    delete_url: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Manage API Key Rotation State
let currentKeyIndex = 0;
let hasNotifiedFallback = false;

export function getCurrentImgbbKey() {
    if (IMGBB_API_KEYS.length === 0) return '';
    return IMGBB_API_KEYS[currentKeyIndex];
}

async function advanceToNextKey() {
    if (IMGBB_API_KEYS.length <= 1) return false;
    
    currentKeyIndex++;
    if (currentKeyIndex >= IMGBB_API_KEYS.length) {
        currentKeyIndex = 0; // Wrap around if we run out (not ideal, but loop prevents total crash)
    }
    
    // Notify Admin when we fall back to the 3rd key (index 2)
    if (currentKeyIndex === 2 && !hasNotifiedFallback) {
        hasNotifiedFallback = true;
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('manga_token') : null;
            if (token) {
                await fetch(`${API_URL}/notifications/report_api_fallback/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ key_index: currentKeyIndex })
                });
            }
        } catch (e) {
            console.error('Failed to notify backend about API fallback', e);
        }
    }
    
    return true;
}

/**
 * Silently track ImgBB uploads in the backend for quota monitoring
 */
export async function trackImgBBUpload(count: number) {
    if (count <= 0) return;
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('manga_token') : null;
        if (!token) return;
        
        await fetch(`${API_URL}/imgbb/track/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ count })
        });
    } catch (e) {
        console.error('Failed to sync ImgBB upload count', e);
    }
}

/**
 * Upload an image file to ImgBB
 * @param file - The image file to upload
 * @returns The uploaded image URL
 */
export async function uploadToImgbb(file: File, retries = 4): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            // Artificial delay for bulk uploads to respect rate limits (1.5s delay)
            if (attempt > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt)));
            } else {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const currentKey = getCurrentImgbbKey();
            if (!currentKey) throw new Error('مفتاح ImgBB غير متوفر. تحقق من ملف .env.local');

            const res = await fetch(`${IMGBB_API_URL}?key=${currentKey}`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (data.success) {
                return data.data.url;
            }

            const errorMsg = data.error?.message?.toLowerCase() || '';

            // If it's an API Key or Quota Limit issue, seamlessly rotate to the next key
            if (errorMsg.includes('key') || errorMsg.includes('limit') || errorMsg.includes('quota') || errorMsg.includes('invalid')) {
                const canAdvance = await advanceToNextKey();
                if (canAdvance) {
                    console.warn(`API key error (${errorMsg}). Switching to key index ${currentKeyIndex}`);
                    continue; // Skip the rest of this attempt, the loop will try again with the new key!
                } else {
                    throw new Error('تم استهلاك جميع مفاتيح ImgBB المتاحة');
                }
            }

            // Otherwise, treat as rate limit / temporary API failure and trigger retry
            throw new Error(`API Error: ${data.error?.message || res.status}`);

        } catch (err: any) {
            if (err.message === 'تم استهلاك جميع مفاتيح ImgBB المتاحة') {
                throw err;
            }

            if (attempt < retries - 1) {
                console.warn(`ImgBB upload failed (attempt ${attempt + 1}/${retries}). Retrying...`, err.message);
            } else {
                throw new Error('فشل الاتصال بـ imgbb بسبب قيود الضغط على الخادم. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.');
            }
        }
    }
    throw new Error('فشل الاتصال بـ imgbb بسبب قيود الضغط على الخادم.');
}

/**
 * Upload an image file to ImgBB with full result
 * @param file - The image file to upload
 * @returns Full upload result with url, thumb, and delete_url
 */
export async function uploadToImgbbFull(file: File): Promise<ImgbbUploadResult> {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const currentKey = getCurrentImgbbKey();
        const res = await fetch(`${IMGBB_API_URL}?key=${currentKey}`, {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();

        if (data.success) {
            // Track single upload
            trackImgBBUpload(1).catch(() => {});
            
            return {
                url: data.data.url,
                thumb: data.data.thumb?.url || data.data.url,
                delete_url: data.data.delete_url,
            };
        }

        const errorMsg = data.error?.message?.toLowerCase() || '';
        if (errorMsg.includes('key') || errorMsg.includes('limit') || errorMsg.includes('quota') || errorMsg.includes('invalid')) {
            const canAdvance = await advanceToNextKey();
            if (canAdvance) {
                console.warn(`API key error (${errorMsg}). Switching to key index ${currentKeyIndex}`);
                // Simple recursive retry with new key
                return uploadToImgbbFull(file);
            }
        }

        throw new Error(data.error?.message || 'فشل رفع الصورة إلى imgbb');
    } catch (err: any) {
        if (err.message.includes('imgbb') || err.message.includes('فشل')) {
            throw err;
        }
        throw new Error('فشل الاتصال بـ imgbb. تحقق من اتصال الإنترنت.');
    }
}

/**
 * Check if ImgBB API key is configured
 */
export function isImgbbConfigured(): boolean {
    return IMGBB_API_KEYS.length > 0;
}

/**
 * Upload an image file to ImgBB with progress tracking
 * Uses XMLHttpRequest to enable progress monitoring
 * @param file - The image file to upload
 * @param onProgress - Callback function with progress percentage (0-100)
 * @returns The uploaded image URL
 */
export function uploadToImgbbWithProgress(
    file: File,
    onProgress?: (percent: number) => void
): Promise<string> {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('image', file);

        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(percent);
            }
        });

        xhr.addEventListener('load', () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (data.success) {
                    trackImgBBUpload(1).catch(() => {});
                    resolve(data.data.url);
                } else {
                    reject(new Error(data.error?.message || 'فشل رفع الصورة إلى imgbb'));
                }
            } catch (e) {
                reject(new Error('خطأ في معالجة استجابة imgbb'));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('فشل الاتصال بـ imgbb. تحقق من اتصال الإنترنت.'));
        });

        const currentKey = getCurrentImgbbKey();
        xhr.open('POST', `${IMGBB_API_URL}?key=${currentKey}`);
        xhr.send(formData);
    });
}

/**
 * Upload multiple images with overall progress tracking
 * @param files - Array of image files to upload
 * @param onProgress - Callback with overall progress (0-100) and current file index
 * @returns Array of uploaded image URLs
 */
export async function uploadMultipleWithProgress(
    files: File[],
    onProgress?: (overallPercent: number, currentFile: number, totalFiles: number) => void
): Promise<string[]> {
    const urls: string[] = new Array(files.length);
    const totalFiles = files.length;
    let completedCount = 0;

    // Concurrency limit restored to 5 per user request.
    const CONCURRENCY_LIMIT = 5;
    const tasks = files.map((file, index) => {
        return async () => {
            // Upload without individual progress to simplify parallel execution
            const url = await uploadToImgbb(file);
            urls[index] = url; // Maintain original order!

            completedCount++;
            if (onProgress) {
                const overallPercent = Math.round((completedCount / totalFiles) * 100);
                onProgress(overallPercent, completedCount, totalFiles);
            }
        };
    });

    // Execute with concurrency pool
    const executing = new Set<Promise<void>>();
    for (const task of tasks) {
        const p = task().then(() => { executing.delete(p); });
        executing.add(p);
        if (executing.size >= CONCURRENCY_LIMIT) {
            await Promise.race(executing);
        }
    }
    await Promise.all(executing);

    // Track all completed parallel uploads
    if (urls.length > 0) {
        trackImgBBUpload(urls.length).catch(() => {});
    }

    return urls;
}
