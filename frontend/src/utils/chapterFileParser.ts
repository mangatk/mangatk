/**
 * Chapter File Name Parser
 * 
 * Extracts chapter number and title from ZIP/CBZ file names
 */

export interface ParsedChapterInfo {
    number: string;
    title: string;
    originalFileName: string;
}

// Common chapter indicators to filter out (case-insensitive)
const CHAPTER_INDICATORS = [
    'ch',
    'chp',
    'chap',
    'chapter',
    'cha',
    'فصل',
    'الفصل',
    'c',
];

/**
 * Parse chapter information from a file name
 * @param fileName - The file name (including extension)
 * @returns Parsed chapter info with number and title
 */
export function parseChapterFileName(fileName: string): ParsedChapterInfo {
    // Remove extension
    let baseName = fileName.replace(/\.(zip|cbz)$/i, '').trim();

    // Common separators: -, _, |, :, etc.
    const separators = /[\-_|:–—]/g;

    // Split by separators
    const parts = baseName.split(separators).map(p => p.trim()).filter(p => p.length > 0);

    let chapterNumber = '';
    let chapterTitle = '';
    const titleParts: string[] = [];

    for (const part of parts) {
        // Try to extract chapter number
        // Pattern: optional chapter indicator + number (including decimals)
        const numberMatch = part.match(/^(?:ch|chp|chap|chapter|cha|فصل|الفصل|c)?\s*(\d+(?:\.\d+)?)/i);

        if (numberMatch && !chapterNumber) {
            // Found chapter number
            chapterNumber = numberMatch[1];

            // Check if there's text after the number in the same part
            const afterNumber = part.substring(numberMatch[0].length).trim();
            if (afterNumber && !isChapterIndicator(afterNumber)) {
                titleParts.push(afterNumber);
            }
        } else {
            // Not a number, might be part of title
            // Filter out chapter indicators
            if (!isChapterIndicator(part)) {
                titleParts.push(part);
            }
        }
    }

    chapterTitle = titleParts.join(' ').trim();

    // If no chapter number found, try to find any number in the filename
    if (!chapterNumber) {
        const anyNumber = baseName.match(/(\d+(?:\.\d+)?)/);
        if (anyNumber) {
            chapterNumber = anyNumber[1];
        }
    }

    return {
        number: chapterNumber || '1',
        title: chapterTitle,
        originalFileName: fileName,
    };
}

/**
 * Check if a string is a common chapter indicator
 */
function isChapterIndicator(text: string): boolean {
    const normalized = text.trim().toLowerCase();
    return CHAPTER_INDICATORS.some(indicator =>
        normalized === indicator.toLowerCase()
    );
}

/**
 * Count images in a ZIP file using backend API
 * @param file - The ZIP file
 * @param headers - Auth headers to use for the request
 * @returns Promise with image count
 */
export async function countImagesInZip(file: File, headers?: Record<string, string>): Promise<number> {
    try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const zipFile = await zip.loadAsync(file);

        let count = 0;
        zipFile.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
                const ext = relativePath.split('.').pop()?.toLowerCase();
                if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext || '')) {
                    count++;
                }
            }
        });

        return count;
    } catch (error: any) {
        console.error('Error counting images in ZIP locally:', error);
        return 0;
    }
}

/**
 * Extract image files from a ZIP archive locally
 * @param file - The ZIP file
 * @returns Promise with array of image File objects sorted by name
 */
export async function extractImagesFromZip(file: File): Promise<File[]> {
    try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const zipFile = await zip.loadAsync(file);

        const imageEntries: { path: string, entry: any }[] = [];

        zipFile.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && !relativePath.includes('__MACOSX')) {
                const ext = relativePath.split('.').pop()?.toLowerCase();
                if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext || '')) {
                    imageEntries.push({ path: relativePath, entry: zipEntry });
                }
            }
        });

        // Sort alphabetically by path to maintain correct page order
        imageEntries.sort((a, b) => a.path.localeCompare(b.path));

        const extractedFiles: File[] = [];

        for (const { path, entry } of imageEntries) {
            const blob = await entry.async('blob');
            const filename = path.split('/').pop() || path;
            extractedFiles.push(new File([blob], filename, { type: blob.type || 'image/jpeg' }));
        }

        return extractedFiles;
    } catch (error) {
        console.error('Error extracting images from ZIP:', error);
        throw new Error('فشل استخراج الصور من الملف المضغوط');
    }
}
