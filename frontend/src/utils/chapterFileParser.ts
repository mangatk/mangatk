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
export async function countImagesInZip(file: File, headers: Record<string, string> = {}): Promise<number> {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

        const response = await fetch(`${API_URL}/chapters/analyze-zip/`, {
            method: 'POST',
            headers: headers,
            body: formData,
        });

        if (!response.ok) {
            // Get error details from response
            let errorMessage = `Failed to analyze ZIP file: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.detail || errorMessage;
            } catch (e) {
                // If response is not JSON, use default error message
            }
            console.error('ZIP analysis error:', errorMessage);
            // Return 0 instead of throwing to allow the form to continue
            return 0;
        }

        const data = await response.json();
        return data.image_count || 0;

    } catch (error: any) {
        console.error('Error counting images in ZIP:', error);
        // Return 0 instead of throwing to allow the form to continue
        return 0;
    }
}
