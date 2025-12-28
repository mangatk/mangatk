'use client';

import { useState, useEffect } from 'react';
import { FaPaperPlane, FaUserCircle, FaThumbsUp, FaReply, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { ProxyImage } from '@/components/ProxyImage';
import * as commentsAPI from '@/services/comments';
import type { Comment } from '@/services/comments';

// 1. تعريف واجهة الـ Props للمكون الفرعي
interface CommentItemProps {
  comment: Comment;
  level?: number;
  isAuthenticated: boolean;
  currentUser: any;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editText: string;
  setEditText: (text: string) => void;
  submitting: boolean;
  onReply: (parentId: string) => void;
  onEdit: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
}

// 2. إخراج المكون ليكون مستقلاً (خارج CommentsSection)
function CommentItem({
  comment,
  level = 0,
  isAuthenticated,
  currentUser,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  editingId,
  setEditingId,
  editText,
  setEditText,
  submitting,
  onReply,
  onEdit,
  onDelete,
  onLike
}: CommentItemProps) {
  const isOwner = isAuthenticated && currentUser?.name === comment.user_name;
  const indentClass = level > 0 ? 'mr-8' : '';

  // دالة لتنسيق الوقت (نقلناها هنا أو يمكن تركها دالة مساعدة عامة)
  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
  }

  return (
    <div className={`${indentClass} mb-4`}>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {comment.user_avatar ? (
            <ProxyImage
              src={comment.user_avatar}
              alt={comment.user_name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <FaUserCircle className="w-10 h-10 text-gray-500" />
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{comment.user_name}</span>
              <span className="text-gray-500 text-sm">{formatTime(comment.created_at)}</span>
              {comment.is_edited && (
                <span className="text-gray-500 text-xs">(معدّل)</span>
              )}
            </div>
          </div>
        </div>

        {/* Content or Edit Mode */}
        {editingId === comment.id ? (
          <div className="mb-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none min-h-[80px] resize-none"
              placeholder="عدّل تعليقك..."
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onEdit(comment.id)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
              >
                <FaCheck /> حفظ
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditText('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2"
              >
                <FaTimes /> إلغاء
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-300 mb-3 whitespace-pre-wrap">{comment.content}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => onLike(comment.id)}
            disabled={!isAuthenticated}
            className={`flex items-center gap-1 ${isAuthenticated ? 'hover:text-blue-400 cursor-pointer' : 'cursor-not-allowed opacity-50'
              } text-gray-400 transition-colors`}
          >
            <FaThumbsUp />
            <span>{comment.likes_count}</span>
          </button>

          <button
            onClick={() => {
              setReplyingTo(comment.id);
              setReplyText('');
            }}
            disabled={!isAuthenticated}
            className={`flex items-center gap-1 ${isAuthenticated ? 'hover:text-blue-400 cursor-pointer' : 'cursor-not-allowed opacity-50'
              } text-gray-400 transition-colors`}
          >
            <FaReply /> رد
          </button>

          {isOwner && editingId !== comment.id && (
            <>
              <button
                onClick={() => {
                  setEditingId(comment.id);
                  setEditText(comment.content);
                }}
                className="flex items-center gap-1 text-gray-400 hover:text-yellow-400 transition-colors"
              >
                <FaEdit /> تعديل
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
              >
                <FaTrash /> حذف
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="mr-8 mt-3">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none min-h-[80px] resize-none"
              placeholder={`الرد على ${comment.user_name}...`}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onReply(comment.id)}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2"
              >
                <FaPaperPlane /> إرسال
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nested Replies (Recursive Call) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              level={level + 1}
              isAuthenticated={isAuthenticated}
              currentUser={currentUser}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              editingId={editingId}
              setEditingId={setEditingId}
              editText={editText}
              setEditText={setEditText}
              submitting={submitting}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 3. المكون الرئيسي
interface CommentsSectionProps {
  chapterId?: string;
  mangaId?: string;
}

export function CommentsSection({ chapterId, mangaId }: CommentsSectionProps) {
  const { isAuthenticated, user } = useAuth();

  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New comment
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Load comments on mount
  useEffect(() => {
    loadComments();
  }, [chapterId, mangaId]);

  async function loadComments() {
    setLoading(true);
    setError('');

    try {
      let data: Comment[];
      if (chapterId) {
        data = await commentsAPI.getCommentsByChapter(chapterId);
      } else if (mangaId) {
        data = await commentsAPI.getCommentsByManga(mangaId);
      } else {
        setError('No chapter or manga ID provided');
        return;
      }

      setComments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load comments');
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setSubmitting(true);
    try {
      const newCommentData = await commentsAPI.createComment({
        content: newComment.trim(),
        chapter_id: chapterId,
        manga_id: mangaId
      });

      setComments(prev => [newCommentData, ...prev]);
      setNewComment('');
    } catch (err: any) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string) {
    if (!replyText.trim() || !isAuthenticated) return;

    setSubmitting(true);
    try {
      const newReply = await commentsAPI.createComment({
        content: replyText.trim(),
        chapter_id: chapterId,
        manga_id: mangaId,
        parent: parentId
      });

      setComments(prev => addReplyToComment(prev, parentId, newReply));
      setReplyText('');
      setReplyingTo(null);
    } catch (err: any) {
      setError(err.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(commentId: string) {
    if (!editText.trim()) return;

    try {
      await commentsAPI.updateComment(commentId, editText.trim());

      setComments(prev => updateCommentContent(prev, commentId, editText.trim()));
      setEditingId(null);
      setEditText('');
    } catch (err: any) {
      setError(err.message || 'Failed to update comment');
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;

    try {
      await commentsAPI.deleteComment(commentId);
      setComments(prev => removeComment(prev, commentId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment');
    }
  }

  async function handleLike(commentId: string) {
    if (!isAuthenticated) return;

    try {
      const result = await commentsAPI.toggleLike(commentId);
      setComments(prev => updateCommentLikes(prev, commentId, result.likes_count));
    } catch (err: any) {
      setError(err.message || 'Failed to like comment');
    }
  }

  // Helper functions
  function addReplyToComment(comments: Comment[], parentId: string, newReply: Comment): Comment[] {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...comment.replies, newReply]
        };
      }
      if (comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToComment(comment.replies, parentId, newReply)
        };
      }
      return comment;
    });
  }

  function updateCommentContent(comments: Comment[], targetId: string, newContent: string): Comment[] {
    return comments.map(comment => {
      if (comment.id === targetId) {
        return { ...comment, content: newContent, is_edited: true };
      }
      if (comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentContent(comment.replies, targetId, newContent)
        };
      }
      return comment;
    });
  }

  function removeComment(comments: Comment[], targetId: string): Comment[] {
    return comments.filter(comment => {
      if (comment.id === targetId) return false;
      if (comment.replies.length > 0) {
        comment.replies = removeComment(comment.replies, targetId);
      }
      return true;
    });
  }

  function updateCommentLikes(comments: Comment[], targetId: string, newCount: number): Comment[] {
    return comments.map(comment => {
      if (comment.id === targetId) {
        return { ...comment, likes_count: newCount };
      }
      if (comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentLikes(comment.replies, targetId, newCount)
        };
      }
      return comment;
    });
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h3 className="text-2xl font-bold text-white mb-6">
        التعليقات ({comments.length})
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-600 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* New Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="شاركنا رأيك..."
              className="w-full bg-gray-800 text-gray-200 rounded-xl p-4 pr-12 min-h-[100px] border border-gray-700 focus:border-blue-500 outline-none resize-none transition-all placeholder:text-gray-500"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="absolute bottom-3 left-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FaPaperPlane />
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700 text-gray-400 text-center">
          سجّل دخول لإضافة تعليق
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          لا توجد تعليقات بعد. كن أول من يعلّق!
        </div>
      ) : (
        <div>
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isAuthenticated={isAuthenticated}
              currentUser={user}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              editingId={editingId}
              setEditingId={setEditingId}
              editText={editText}
              setEditText={setEditText}
              submitting={submitting}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLike={handleLike}
            />
          ))}
        </div>
      )}
    </div>
  );
}