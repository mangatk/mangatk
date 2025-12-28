/**
 * Comments API Service
 * Handles all comment-related API calls with backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface Comment {
    id: string;
    user_name: string;
    user_avatar?: string;
    content: string;
    likes_count: number;
    created_at: string;
    updated_at: string;
    is_edited: boolean;
    user_has_liked?: boolean;
    parent?: string | null;
    replies: Comment[];
}

export interface CreateCommentData {
    content: string;
    chapter_id?: string;
    manga_id?: string;
    parent?: string;
}

/**
 * Get authentication headers
 */
function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('manga_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Get comments for a chapter
 */
export async function getCommentsByChapter(chapterId: string): Promise<Comment[]> {
    const res = await fetch(`${API_URL}/comments/?chapter=${chapterId}`, {
        headers: {
            ...getAuthHeaders()
        }
    });

    if (!res.ok) {
        throw new Error('Failed to load comments');
    }

    const data = await res.json();
    // Handle both array and paginated response
    return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Get comments for a manga
 */
export async function getCommentsByManga(mangaId: string): Promise<Comment[]> {
    const res = await fetch(`${API_URL}/comments/?manga=${mangaId}`, {
        headers: {
            ...getAuthHeaders()
        }
    });

    if (!res.ok) {
        throw new Error('Failed to load comments');
    }

    const data = await res.json();
    // Handle both array and paginated response
    return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Create a new comment
 */
export async function createComment(data: CreateCommentData): Promise<Comment> {
    const res = await fetch(`${API_URL}/comments/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to create comment');
    }

    return res.json();
}

/**
 * Update a comment
 */
export async function updateComment(id: string, content: string): Promise<Comment> {
    const res = await fetch(`${API_URL}/comments/${id}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ content })
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to update comment');
    }

    return res.json();
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteComment(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/comments/${id}/`, {
        method: 'DELETE',
        headers: {
            ...getAuthHeaders()
        }
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to delete comment');
    }
}

/**
 * Toggle like on a comment
 */
export async function toggleLike(id: string): Promise<{ liked: boolean; likes_count: number }> {
    const res = await fetch(`${API_URL}/comments/${id}/like/`, {
        method: 'POST',
        headers: {
            ...getAuthHeaders()
        }
    });

    if (!res.ok) {
        throw new Error('Failed to toggle like');
    }

    return res.json();
}
