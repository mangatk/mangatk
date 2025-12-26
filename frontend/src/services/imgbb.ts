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
export async function uploadToImgbb(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();

        if (data.success) {
            return data.data.url;
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
    const urls: string[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
        const url = await uploadToImgbbWithProgress(files[i], (filePercent) => {
            if (onProgress) {
                // Calculate overall progress: completed files + current file progress
                const completedProgress = (i / totalFiles) * 100;
                const currentFileProgress = (filePercent / totalFiles);
                const overallPercent = Math.round(completedProgress + currentFileProgress);
                onProgress(overallPercent, i + 1, totalFiles);
            }
        });
        urls.push(url);
    }

    return urls;
}
