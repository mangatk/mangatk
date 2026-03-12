/**
 * ImgBB Image Upload Service
 * Central service for uploading images to ImgBB
 */

const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
// API Key - loaded from environment variable
const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || '';

export interface ImgbbUploadResult {
    url: string;
    thumb: string;
    delete_url: string;
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

            const res = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (data.success) {
                return data.data.url;
            }

            // If invalid key, fail immediately
            if (data.error?.message?.toLowerCase().includes('api key')) {
                throw new Error('مفتاح ImgBB غير صالح');
            }

            // Otherwise, treat as rate limit / temporary API failure and trigger retry
            throw new Error(`API Error: ${data.error?.message || res.status}`);

        } catch (err: any) {
            // If it's a hard API key error, don't retry
            if (err.message === 'مفتاح ImgBB غير صالح') {
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
        const res = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();

        if (data.success) {
            return {
                url: data.data.url,
                thumb: data.data.thumb?.url || data.data.url,
                delete_url: data.data.delete_url,
            };
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
    return !!IMGBB_API_KEY;
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

        xhr.open('POST', `${IMGBB_API_URL}?key=${IMGBB_API_KEY}`);
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

    // Concurrency 1 enforces a strict sequential queue to prevent IP rate bans during massive uploads
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

    return urls;
}
