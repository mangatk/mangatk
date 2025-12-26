'use client';

import { useState, useEffect } from 'react';
import { FaPaperPlane, FaUserCircle, FaThumbsUp, FaThumbsDown, FaReply, FaEdit, FaTrash, FaTimes, FaCheck } from 'react-icons/fa';
import { getAchievementById, RARITY_COLORS } from '@/data/achievements';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Comment {
  id: string | number;
  user: string;
  avatar?: string;
  text: string;
  time: string;
  votes: number;
  isNew?: boolean;
  userVote?: 'up' | 'down' | null;
  replies: Comment[];
}

export function CommentsSection({ chapterId, mangaId }: { chapterId: string; mangaId?: string }) {
  const { isAuthenticated, getAuthHeaders, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [myEquippedTitle, setMyEquippedTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadComments();
    // استخدام اللقب من السياق أولاً، ثم localStorage كنسخة احتياطية
    if (user?.equipped_title) {
      setMyEquippedTitle(user.equipped_title);
    } else {
      const titleId = localStorage.getItem('equipped_title');
      setMyEquippedTitle(titleId);
    }
  }, [chapterId, isAuthenticated, user]);

  const loadComments = async () => {
    setIsLoading(true);

    if (isAuthenticated) {
      // Load from API
      try {
        const res = await fetch(`${API_URL}/comments/?chapter=${chapterId}`, {
          headers: { ...getAuthHeaders() },
        });
        if (res.ok) {
          const data = await res.json();
          const apiComments = (Array.isArray(data) ? data : data.results || []).map((c: any) => ({
            id: c.id,
            user: c.user_name || 'مجهول',
            avatar: c.user_avatar,
            text: c.content,
            time: formatTime(c.created_at),
            votes: c.likes_count || 0,
            replies: (c.replies || []).map((r: any) => ({
              id: r.id,
              user: r.user_name || 'مجهول',
              text: r.content,
              time: formatTime(r.created_at),
              votes: r.likes_count || 0,
              replies: []
            }))
          }));
          setComments(apiComments);
        }
      } catch (e) {
        console.error("Error loading comments from API", e);
        loadFromLocal();
      }
    } else {
      loadFromLocal();
    }
    setIsLoading(false);
  };

  const loadFromLocal = () => {
    const localKey = `comments_${chapterId}`;
    const saved = localStorage.getItem(localKey);
    const localComments = saved ? JSON.parse(saved) : [];
    setComments(localComments.map((c: any) => ({
      ...c,
      replies: c.replies || []
    })));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
  };

  const saveToLocal = (updatedList: Comment[]) => {
    setComments(updatedList);
    const localKey = `comments_${chapterId}`;
    localStorage.setItem(localKey, JSON.stringify(updatedList));
  };

  const handleVote = async (commentId: string | number, type: 'up' | 'down') => {
    if (isAuthenticated) {
      try {
        await fetch(`${API_URL}/comments/${commentId}/like/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
        });
        loadComments(); // Reload to get updated likes
      } catch (e) {
        console.error("Error liking comment", e);
      }
    } else {
      // Local vote handling
      const updateVoteForList = (list: Comment[]): Comment[] => {
        return list.map(comment => {
          if (comment.id === commentId) {
            let newVotes = comment.votes;
            let newStatus = comment.userVote;

            if (newStatus === type) {
              newVotes -= (type === 'up' ? 1 : -1);
              newStatus = null;
            } else {
              if (newStatus === 'up' && type === 'down') newVotes -= 2;
              else if (newStatus === 'down' && type === 'up') newVotes += 2;
              else newVotes += (type === 'up' ? 1 : -1);
              newStatus = type;
            }
            return { ...comment, votes: newVotes, userVote: newStatus };
          }

          if (comment.replies.length > 0) {
            return { ...comment, replies: updateVoteForList(comment.replies) };
          }
          return comment;
        });
      };
      saveToLocal(updateVoteForList(comments));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (isAuthenticated) {
      try {
        const res = await fetch(`${API_URL}/comments/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            chapter_id: chapterId,
            manga_id: mangaId || null,
            content: newComment,
          }),
        });
        if (res.ok) {
          setNewComment('');
          loadComments();
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error("Comment post failed:", res.status, errorData);
          alert(`فشل إرسال التعليق: ${errorData.detail || errorData.content || JSON.stringify(errorData)}`);
        }
      } catch (e) {
        console.error("Error posting comment", e);
        alert(`خطأ في الاتصال: ${e}`);
      }
    } else {
      // Save locally for guests
      const comment: Comment = {
        id: Date.now(),
        user: "أنت",
        text: newComment,
        time: "الآن",
        votes: 0,
        isNew: true,
        replies: []
      };
      saveToLocal([comment, ...comments]);
      setNewComment('');
    }
  };

  const submitReply = async (parentId: string | number) => {
    if (!replyText.trim()) return;

    if (isAuthenticated) {
      try {
        const res = await fetch(`${API_URL}/comments/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            chapter_id: chapterId,
            manga_id: mangaId,
            content: replyText,
            parent: parentId,
          }),
        });
        if (res.ok) {
          setReplyText('');
          setActiveReplyId(null);
          loadComments();
        }
      } catch (e) {
        console.error("Error posting reply", e);
      }
    } else {
      const newReply: Comment = {
        id: Date.now(),
        user: "أنت",
        text: replyText,
        time: "الآن",
        votes: 0,
        isNew: true,
        replies: []
      };

      const updatedComments = comments.map(c => {
        if (c.id === parentId) {
          return { ...c, replies: [...c.replies, newReply] };
        }
        return c;
      });

      saveToLocal(updatedComments);
      setActiveReplyId(null);
      setReplyText('');
    }
  };

  const handleEdit = async (commentId: string | number, newContent: string) => {
    if (!newContent.trim()) return;

    if (isAuthenticated) {
      try {
        const res = await fetch(`${API_URL}/comments/${commentId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ content: newContent }),
        });
        if (res.ok) {
          setEditingId(null);
          setEditText('');
          loadComments();
        }
      } catch (e) {
        console.error("Error editing comment", e);
      }
    } else {
      // Local edit
      const updateText = (list: Comment[]): Comment[] => {
        return list.map(c => {
          if (c.id === commentId) return { ...c, text: newContent };
          return { ...c, replies: updateText(c.replies) };
        });
      };
      saveToLocal(updateText(comments));
      setEditingId(null);
      setEditText('');
    }
  };

  const handleDelete = async (commentId: string | number) => {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;

    if (isAuthenticated) {
      try {
        const res = await fetch(`${API_URL}/comments/${commentId}/`, {
          method: 'DELETE',
          headers: { ...getAuthHeaders() },
        });
        if (res.ok) {
          loadComments();
        }
      } catch (e) {
        console.error("Error deleting comment", e);
      }
    } else {
      // Local delete
      const removeComment = (list: Comment[]): Comment[] => {
        return list.filter(c => c.id !== commentId).map(c => ({
          ...c,
          replies: removeComment(c.replies)
        }));
      };
      saveToLocal(removeComment(comments));
    }
  };

  const sortedComments = [...comments].sort((a, b) => b.votes - a.votes);

  const CommentItem = ({ data, isReply = false, parentId }: { data: Comment, isReply?: boolean, parentId?: string | number }) => {
    let displayTitle = null;
    if (data.user === 'أنت' && myEquippedTitle) {
      displayTitle = getAchievementById(myEquippedTitle);
    }

    return (
      <div className={`flex gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isReply ? 'mr-12 mt-3 p-3 bg-gray-800/30 rounded-lg border-r-2 border-gray-700' : 'p-4 bg-blue-900/5 rounded-xl border border-gray-800'}`}>

        <div className="flex-shrink-0">
          {data.avatar ? (
            <img src={data.avatar} alt={data.user} className={`rounded-full ${isReply ? 'w-8 h-8' : 'w-10 h-10'}`} />
          ) : data.isNew || data.user === user?.name ? (
            <div className={`rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg ${isReply ? 'w-8 h-8 text-xs' : 'w-10 h-10'}`}>أ</div>
          ) : (
            <FaUserCircle className={`text-gray-600 ${isReply ? 'text-3xl' : 'text-4xl'}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex flex-col">
              <h4 className={`font-bold truncate ${data.isNew || data.user === user?.name ? 'text-blue-400' : 'text-gray-300'} ${isReply ? 'text-sm' : 'text-base'}`}>
                {data.user}
              </h4>

              {displayTitle && (
                <span className={`text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${RARITY_COLORS[displayTitle.rarity]} bg-clip-text text-transparent w-fit -mt-0.5`}>
                  {displayTitle.title}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{data.time}</span>
          </div>

          <p className={`text-gray-400 leading-relaxed mb-3 break-words ${isReply ? 'text-xs' : 'text-sm'}`}>{data.text}</p>

          {/* Edit Mode */}
          {editingId === data.id ? (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                autoFocus
              />
              <button onClick={() => handleEdit(data.id, editText)} className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"><FaCheck /></button>
              <button onClick={() => { setEditingId(null); setEditText(''); }} className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"><FaTimes /></button>
            </div>
          ) : null}

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleVote(data.id, 'up')}
              className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${data.userVote === 'up' ? 'text-green-400' : 'text-gray-500 hover:text-green-400'}`}
            >
              <FaThumbsUp />
              <span>{data.votes}</span>
            </button>

            <button
              onClick={() => handleVote(data.id, 'down')}
              className={`flex items-center gap-1 text-xs transition-colors ${data.userVote === 'down' ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
              <FaThumbsDown />
            </button>

            {!isReply && (
              <button
                onClick={() => {
                  setActiveReplyId(activeReplyId === data.id ? null : data.id);
                  setReplyText('');
                }}
                className={`text-xs flex items-center gap-1 transition-colors ${activeReplyId === data.id ? 'text-blue-400' : 'text-gray-500 hover:text-white'}`}
              >
                <FaReply /> رد
              </button>
            )}

            {/* Edit/Delete buttons - only for own comments */}
            {(data.isNew || data.user === user?.name || data.user === 'أنت') && (
              <>
                <button
                  onClick={() => { setEditingId(data.id); setEditText(data.text); }}
                  className="text-xs flex items-center gap-1 text-gray-500 hover:text-yellow-400 transition-colors"
                >
                  <FaEdit /> تعديل
                </button>
                <button
                  onClick={() => handleDelete(data.id)}
                  className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <FaTrash /> حذف
                </button>
              </>
            )}
          </div>

          {activeReplyId === data.id && !isReply && (
            <div className="mt-4 flex gap-2 animate-in fade-in slide-in-from-top-1">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`الرد على ${data.user}...`}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                autoFocus
              />
              <button
                onClick={() => submitReply(data.id)}
                disabled={!replyText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
              >
                إرسال
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-12 p-4 md:p-6 bg-gray-900/50 rounded-2xl border border-gray-800 backdrop-blur-sm">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        التعليقات <span className="text-sm bg-blue-600 px-2 py-0.5 rounded-full">{comments.reduce((acc, curr) => acc + 1 + curr.replies.length, 0)}</span>
      </h3>

      <form onSubmit={handleSubmit} className="mb-10 relative">
        <div className="flex gap-4">
          <div className="mt-1 hidden sm:block">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">أ</div>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isAuthenticated ? "شاركنا رأيك..." : "سجّل دخول لإضافة تعليق..."}
              className="w-full bg-gray-800 text-gray-200 rounded-xl p-4 pr-12 min-h-[100px] border border-gray-700 focus:border-blue-500 outline-none resize-none transition-all placeholder:text-gray-500"
              disabled={!isAuthenticated && false}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="absolute bottom-3 left-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </form>

      {isLoading ? (
        <div className="text-center text-gray-500 py-8">جاري تحميل التعليقات...</div>
      ) : (
        <div className="space-y-4">
          {sortedComments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">لا توجد تعليقات بعد. كن أول من يعلق!</div>
          ) : (
            sortedComments.map((comment) => (
              <div key={comment.id} className="flex flex-col">
                <CommentItem data={comment} />
                {comment.replies && comment.replies.length > 0 && (
                  <div className="flex flex-col border-l-2 border-gray-800 mr-5 mt-1">
                    {comment.replies.map(reply => (
                      <CommentItem key={reply.id} data={reply} isReply={true} parentId={comment.id} />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}