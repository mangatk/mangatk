'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStorage } from '@/hooks/useStorage';
import { formatReadingTime } from '@/hooks/useReadingTime';
import { useAchievements } from '@/hooks/useAchievements';
import { ALL_ACHIEVEMENTS, Achievement, RARITY_COLORS } from '@/data/achievements';
import { ProxyImage } from '@/components/ProxyImage';
import {
   FaUser, FaHeart, FaHistory, FaSignOutAlt, FaClock,
   FaBook, FaDownload, FaCommentDots, FaReply, FaCheck, FaTrophy, FaLock
} from 'react-icons/fa';
import Link from 'next/link';
import { Header } from '@/components/Header';
import toast from 'react-hot-toast';

// واجهة لبيانات الردود
interface ReplyNotification {
   chapterId: string;
   parentId: number;
   replyId: number;
   user: string;
   text: string;
   myCommentText: string;
}

export default function ProfilePage() {
   const { user, login, logout, isLoading: authLoading, getAuthHeaders } = useAuth();
   const { bookmarks, history } = useStorage();
   const { unlockedIds } = useAchievements();
   const router = useRouter();

   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

   // الاحصائيات
   const [readingTime, setReadingTime] = useState({ days: 0, hours: 0, minutes: 0 });
   const [totalChaptersInFav, setTotalChaptersInFav] = useState(0);
   const [recentFavCount, setRecentFavCount] = useState(0);
   const [downloadedCount, setDownloadedCount] = useState(0);
   const [currentPoints, setCurrentPoints] = useState(0);

   // الإنجازات من قاعدة البيانات
   const [apiAchievements, setApiAchievements] = useState<any[] | null>(null);

   // الإشعارات (الردود)
   const [replyNotifications, setReplyNotifications] = useState<ReplyNotification[]>([]);
   const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
   const [replyText, setReplyText] = useState('');

   // اللقب المجهز
   const [equippedTitle, setEquippedTitle] = useState<{ id: string; title: string; rarity: string; iconUrl?: string } | null>(null);
   // لون خلفية شارة اللقب القابل للتعديل
   const [badgeColor, setBadgeColor] = useState<string>('');
   const [showColorPicker, setShowColorPicker] = useState(false);
   const PRESET_COLORS = [
      '#1e40af','#7c3aed','#be185d','#047857','#b45309',
      '#0891b2','#9333ea','#dc2626','#16a34a','#d97706',
      '#6366f1','#ec4899','#14b8a6','#f59e0b','#8b5cf6',
      '#000000','#1e293b','#ffffff',
   ];

   // حماية الصفحة وجلب البيانات
   useEffect(() => {
      if (!authLoading && !user) {
         login();
         return;
      }

      if (user) {
         // جلب البيانات معاً: الملف الشخصي + قائمة الإنجازات (لضمان توفر icon_url)
         Promise.all([
            fetch(`${API_URL}/auth/profile/`, { headers: { ...getAuthHeaders() } }).then(r => r.ok ? r.json() : null),
            fetch(`${API_URL}/achievements/`).then(r => r.ok ? r.json() : null),
         ])
            .then(([profileData, achData]) => {
               // إعداد قائمة الإنجازات
               const achievements: any[] = achData
                  ? (Array.isArray(achData) ? achData : achData.results || [])
                  : [];
               setApiAchievements(achievements);

               if (!profileData) return;

               if (profileData.points !== undefined) setCurrentPoints(profileData.points);

               if (profileData.equipped_title) {
                  // ابحث عن الإنجاز في قائمة ال**API** أولاً (للحصول على icon_url)
                  const apiAch = achievements.find(
                     (a: any) => a.slug === profileData.equipped_title || a.id === profileData.equipped_title || a.name_ar === profileData.equipped_title
                  );
                  const localAch = ALL_ACHIEVEMENTS.find(
                     a => a.id === profileData.equipped_title || a.title === profileData.equipped_title
                  );
                  const resolvedAch = apiAch || localAch;
                  if (resolvedAch) {
                     const iconUrl: string = apiAch?.icon_url || (localAch as any)?.iconUrl || localStorage.getItem('equipped_title_icon') || '';
                     const id: string = resolvedAch.id || resolvedAch.slug || profileData.equipped_title;
                     const title: string = resolvedAch.name_ar || resolvedAch.title || profileData.equipped_title;
                     const rarity: string = resolvedAch.rarity || 'common';
                     setEquippedTitle({ id, title, rarity, iconUrl });
                     // حفظ كل شيء لمنع اختفاء الأيقونة عند التحديث
                     localStorage.setItem('equipped_title', id);
                     localStorage.setItem('equipped_title_name', title);
                     localStorage.setItem('equipped_title_rarity', rarity);
                     if (iconUrl) localStorage.setItem('equipped_title_icon', iconUrl);
                  } else {
                     setEquippedTitle({ id: profileData.equipped_title, title: profileData.equipped_title, rarity: 'common' });
                  }
               } else {
                  // فالباك من localStorage
                  const titleId = localStorage.getItem('equipped_title');
                  const titleName = localStorage.getItem('equipped_title_name');
                  const titleRarity = localStorage.getItem('equipped_title_rarity');
                  const titleIcon = localStorage.getItem('equipped_title_icon');
                  if (titleId && titleName) {
                     setEquippedTitle({ id: titleId, title: titleName, rarity: titleRarity || 'common', iconUrl: titleIcon || '' });
                  }
               }
            })
            .catch(err => console.error('Error fetching profile/achievements:', err));

         // \u0627\u0633\u062a\u0631\u062c\u0627\u0639 \u0644\u0648\u0646 \u0627\u0644\u0634\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0641\u0648\u0638
         const savedColor = localStorage.getItem('badge_color') || '';
         setBadgeColor(savedColor);

         // 1. \u062d\u0633\u0627\u0628 \u0648\u0642\u062a \u0627\u0644\u0642\u0631\u0627\u0621\u0629
         const seconds = parseInt(localStorage.getItem('total_reading_seconds') || '0');
         setReadingTime(formatReadingTime(seconds));

         // 2. حساب إجمالي فصول المفضلة
         const totalChapters = bookmarks.reduce((acc, manga) => acc + manga.chapterCount, 0);
         setTotalChaptersInFav(totalChapters);

         // 3. حساب المانجا المضافة حديثاً
         setRecentFavCount(Math.min(bookmarks.length, 5)); // آخر 5 مضافة

         // 4. عدد التحميلات (محاكاة)
         setDownloadedCount(15);

         // 5. البحث عن الردود
         scanForReplies();
      }
   }, [user, authLoading, router, bookmarks]);

   // دالة البحث عن الردود - من API للمستخدمين المسجلين، من localStorage للضيوف
   const scanForReplies = async () => {
      const notifications: ReplyNotification[] = [];

      // للمستخدمين المسجلين - جلب من API
      try {
         const res = await fetch(`${API_URL}/comments/my_replies/`, {
            headers: { ...getAuthHeaders() },
         });
         if (res.ok) {
            const apiReplies = await res.json();
            apiReplies.forEach((reply: any) => {
               notifications.push({
                  chapterId: reply.chapter_id || '',
                  parentId: reply.parent_id,
                  replyId: reply.id,
                  user: reply.user_name,
                  text: reply.content,
                  myCommentText: reply.parent_content,
               });
            });
         }
      } catch (err) {
         console.error('Error fetching replies from API:', err);
      }

      // Fallback: البحث في localStorage أيضاً
      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key && key.startsWith('comments_')) {
            const chapterId = key.split('_')[1];
            const comments = JSON.parse(localStorage.getItem(key) || '[]');

            comments.forEach((comment: any) => {
               if (comment.user === 'أنت' && comment.replies && comment.replies.length > 0) {
                  comment.replies.forEach((reply: any) => {
                     if (reply.user !== 'أنت') {
                        // تجنب التكرار
                        if (!notifications.find(n => n.replyId === reply.id)) {
                           notifications.push({
                              chapterId,
                              parentId: comment.id,
                              replyId: reply.id,
                              user: reply.user,
                              text: reply.text,
                              myCommentText: comment.text
                           });
                        }
                     }
                  });
               }
            });
         }
      }
      setReplyNotifications(notifications);
   };

   // دالة الرد السريع
   const handleQuickReply = async (notif: ReplyNotification) => {
      if (!replyText.trim()) return;

      // إرسال للـ API إذا كان المستخدم مسجل
      try {
         const res = await fetch(`${API_URL}/comments/`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               ...getAuthHeaders(),
            },
            body: JSON.stringify({
               chapter_id: notif.chapterId,
               content: replyText,
               parent: notif.parentId,
            }),
         });
         if (res.ok) {
            setReplyNotifications(prev => prev.filter(n => n.replyId !== notif.replyId));
            setActiveReplyId(null);
            setReplyText('');
            toast.success('تم إرسال ردك بنجاح! ✅');
            return;
         }
      } catch (err) {
         console.error('Error posting reply:', err);
      }

      // Fallback: حفظ محلياً
      const localKey = `comments_${notif.chapterId}`;
      const allComments = JSON.parse(localStorage.getItem(localKey) || '[]');

      const newReply = {
         id: Date.now(),
         user: "أنت",
         text: replyText,
         time: "الآن",
         votes: 0,
         isNew: true,
         replies: []
      };

      const updatedComments = allComments.map((c: any) => {
         if (c.id === notif.parentId) {
            return { ...c, replies: [...c.replies, newReply] };
         }
         return c;
      });

      localStorage.setItem(localKey, JSON.stringify(updatedComments));
      setReplyNotifications(prev => prev.filter(n => n.replyId !== notif.replyId));
      setActiveReplyId(null);
      setReplyText('');
      toast.success('تم إرسال ردك بنجاح! ✅');
   };

   if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div></div>;

   return (
      <>
         <Header />
         <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-8 pb-12 font-sans transition-colors duration-300">
            <div className="container mx-auto px-4">

               {/* --- Epic Banner Header --- */}
               <div className="relative mb-12 rounded-[2rem] overflow-hidden shadow-2xl group border border-gray-200 dark:border-gray-800">
                  {/* الخلفية الملحمية */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 opacity-90 transition-transform duration-1000 group-hover:scale-105"></div>
                  <div className="absolute inset-0 bg-[url('https://i.ibb.co/6PZKbqk/abstract-anime-banner.jpg')] bg-cover bg-center mix-blend-overlay opacity-40"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>

                  <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
                     <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* الصورة الشخصية: تدرج الإنجاز كخلفية دائماً، وصورة الأيقونة فوقها إن صحّت */}
                        {(() => {
                           const rarityGrad = equippedTitle
                              ? RARITY_COLORS[equippedTitle.rarity as keyof typeof RARITY_COLORS] || 'from-blue-500 to-indigo-600'
                              : 'from-blue-500 to-indigo-600';
                           return (
                              <div className={`w-28 h-28 md:w-32 md:h-32 rounded-[2rem] bg-gradient-to-br ${rarityGrad} flex items-center justify-center text-5xl font-black text-white shadow-2xl relative transform transition-transform hover:-translate-y-2 hover:shadow-blue-500/50 border-4 border-white/20 overflow-hidden`}>
                                 {equippedTitle?.iconUrl ? (
                                    <img
                                       src={equippedTitle.iconUrl}
                                       alt="avatar"
                                       className="w-full h-full object-cover absolute inset-0"
                                       onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                 ) : (
                                    <span className="drop-shadow-lg relative z-10">{user.name[0].toUpperCase()}</span>
                                 )}
                                 {equippedTitle && <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-gray-900 shadow-lg animate-pulse z-10 hidden md:block"></div>}
                              </div>
                           );
                        })()}

                        {/* معلومات المستخدم */}
                        <div className="text-center md:text-right mt-2 md:mt-0">
                           <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md mb-2">
                              أهلاً، <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{user.name}</span> 👋
                           </h1>

                           {equippedTitle && (
                              <div className="relative inline-block">
                                 {/* زر شارة اللقب */}
                                 <div
                                    onClick={() => setShowColorPicker(p => !p)}
                                    style={badgeColor ? { backgroundColor: badgeColor, borderColor: badgeColor + '66' } : {}}
                                    className={`inline-flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                                       badgeColor ? '' : 'bg-black/40 backdrop-blur-sm'
                                    } border border-white/10 px-4 py-2 rounded-full shadow-lg hover:brightness-110 transition-all cursor-pointer select-none`}
                                 >
                                    {equippedTitle.iconUrl && (
                                       <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 shadow-inner">
                                          <ProxyImage src={equippedTitle.iconUrl} alt={equippedTitle.title} className="w-full h-full object-cover" />
                                       </div>
                                    )}
                                    <div className={`text-sm font-black ${
                                       badgeColor ? 'text-white drop-shadow' : `bg-gradient-to-r ${RARITY_COLORS[equippedTitle.rarity as keyof typeof RARITY_COLORS] || 'from-gray-300 to-gray-400'} bg-clip-text text-transparent drop-shadow-sm`
                                    }`}>
                                       {equippedTitle.title}
                                    </div>
                                    <span className="text-white/40 text-[10px]">🎨</span>
                                 </div>

                                 {/* لوحة اختيار اللون (Fixed لتظهر فوق كل شيء) */}
                                 {showColorPicker && (
                                    <>
                                       <div className="fixed inset-0 z-[9998]" onClick={() => setShowColorPicker(false)} />
                                       <div className="fixed left-1/2 -translate-x-1/2 top-1/3 z-[9999] bg-gray-900/98 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl w-72 animate-in fade-in zoom-in-95">
                                          <p className="text-white text-xs font-bold mb-4 opacity-60 uppercase tracking-widest text-center">اختر لون شارتك</p>
                                          <div className="grid grid-cols-6 gap-2.5 mb-4">
                                             {PRESET_COLORS.map(c => (
                                                <button
                                                   key={c}
                                                   onClick={() => {
                                                      setBadgeColor(c);
                                                      localStorage.setItem('badge_color', c);
                                                      setShowColorPicker(false);
                                                   }}
                                                   style={{ backgroundColor: c }}
                                                   className={`w-9 h-9 rounded-xl border-2 transition-transform hover:scale-110 shadow-md ${
                                                      badgeColor === c ? 'border-white scale-110 ring-2 ring-white/30' : 'border-white/20'
                                                   }`}
                                                />
                                             ))}
                                          </div>
                                          <div className="flex items-center gap-3 mt-1 p-3 bg-white/5 rounded-xl border border-white/10">
                                             <input
                                                type="color"
                                                value={badgeColor || '#7c3aed'}
                                                onChange={e => {
                                                   setBadgeColor(e.target.value);
                                                   localStorage.setItem('badge_color', e.target.value);
                                                }}
                                                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                                             />
                                             <span className="text-white/60 text-xs font-medium">لون مخصص بالكامل</span>
                                          </div>
                                          {badgeColor && (
                                             <button
                                                onClick={() => {
                                                   setBadgeColor('');
                                                   localStorage.removeItem('badge_color');
                                                   setShowColorPicker(false);
                                                }}
                                                className="w-full mt-3 text-xs text-red-400 hover:text-red-300 transition-colors font-bold py-2 rounded-xl border border-red-500/20 hover:bg-red-500/10"
                                             >
                                                إعادة للتدرج الافتراضي
                                             </button>
                                          )}
                                       </div>
                                    </>
                                 )}
                              </div>
                           )}

                           <p className="text-blue-100/70 text-sm mt-3 font-medium hidden md:block">مرحباً بك في مركز القيادة الخاص بك</p>
                        </div>
                     </div>

                     {/* الأزرار العلوية */}
                     <button onClick={logout} className="px-5 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 backdrop-blur-md rounded-2xl transition-all flex items-center gap-2 font-bold shadow-lg hover:shadow-red-500/20 hover:-translate-y-1 group">
                        <FaSignOutAlt className="group-hover:rotate-12 transition-transform" /> <span className="hidden sm:inline">تسجيل الخروج</span>
                     </button>
                  </div>
               </div>

               {/* الشبكة الرئيسية */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                  {/* العمود العريض (الإحصائيات + الإنجازات) */}
                  <div className="lg:col-span-2 space-y-8">

                     {/* --- Bento Box Stats Grid --- */}
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* 1. Points Card (Large) */}
                        <div className="col-span-2 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-3xl p-6 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden group hover:-translate-y-1 transition-transform border border-white/10 hidden md:block">
                           <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                           <div className="absolute left-6 bottom-6 opacity-20 group-hover:opacity-40 transition-opacity transform group-hover:-rotate-12 duration-500">
                              <FaTrophy className="text-6xl" />
                           </div>
                           <div className="relative z-10">
                              <p className="text-purple-100 text-sm font-bold mb-1 opacity-80 uppercase tracking-wider">رصيد النقاط الذكية</p>
                              <div className="flex items-end gap-3 mt-2">
                                 <h3 className="text-5xl font-black tracking-tighter drop-shadow-lg">{currentPoints}</h3>
                                 <span className="text-sm font-bold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-xl mb-2 shadow-inner border border-white/20">🪙 +1/فصل</span>
                              </div>
                           </div>
                        </div>

                        {/* 2. Reading Time */}
                        <div className="col-span-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group hover:-translate-y-1 transition-transform border border-white/10">
                           <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                           <div className="relative z-10">
                              <p className="text-blue-100 text-sm font-bold mb-1 opacity-80 uppercase tracking-wider flex items-center gap-2">
                                <FaClock /> إجمالي وقت الاستمتاع
                              </p>
                              <div className="flex items-baseline gap-2 mt-3 bg-black/10 backdrop-blur-sm rounded-2xl p-3 w-max border border-white/10">
                                 <span className="text-3xl font-black tracking-tight">{readingTime.days}</span><span className="text-xs opacity-80 font-bold pr-1">يوم</span>
                                 <span className="text-3xl font-black tracking-tight ml-4">{readingTime.hours}</span><span className="text-xs opacity-80 font-bold pr-1">ساعة</span>
                                 <span className="text-3xl font-black tracking-tight ml-4">{readingTime.minutes}</span><span className="text-xs opacity-80 font-bold pr-1">دقيقة</span>
                              </div>
                           </div>
                        </div>

                        {/* 3. Favorites */}
                        <Link href="/favorites" className="col-span-1 bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:border-red-500/30 transition-all group flex flex-col justify-between hover:-translate-y-1">
                           <div className="flex justify-between items-start">
                              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-500 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-red-100 dark:border-red-500/10"><FaHeart className="text-xl" /></div>
                              <span className="bg-green-100 dark:bg-green-900/30 text-green-600 text-xs font-bold px-2 py-1 rounded-xl flex items-center gap-1"><FaCheck /> {recentFavCount}</span>
                           </div>
                           <div className="mt-5">
                              <h3 className="text-4xl font-black text-gray-900 dark:text-white group-hover:text-red-500 transition-colors drop-shadow-sm">{bookmarks.length}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-1">المفضلة الأسطورية</p>
                           </div>
                        </Link>

                        {/* 4. History */}
                        <div className="col-span-1 bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:border-purple-500/30 transition-all group flex flex-col justify-between hover:-translate-y-1">
                           <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl text-purple-500 w-max group-hover:scale-110 transition-transform duration-300 shadow-sm border border-purple-100 dark:border-purple-500/10"><FaHistory className="text-xl" /></div>
                           <div className="mt-5">
                              <h3 className="text-4xl font-black text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors drop-shadow-sm">{history.length}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-1">الفصول المقروءة</p>
                           </div>
                        </div>

                        {/* 5. Downloads */}
                        <div className="col-span-1 bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:border-green-500/30 transition-all group flex flex-col justify-between hover:-translate-y-1 hidden md:flex">
                           <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl text-green-500 w-max group-hover:scale-110 transition-transform duration-300 shadow-sm border border-green-100 dark:border-green-500/10"><FaDownload className="text-xl" /></div>
                           <div className="mt-5">
                              <h3 className="text-4xl font-black text-gray-900 dark:text-white group-hover:text-green-500 transition-colors drop-shadow-sm">{downloadedCount}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-1">تنزيلات محمولة</p>
                           </div>
                        </div>

                        {/* 6. Total Chapters */}
                        <div className="col-span-1 bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:border-orange-500/30 transition-all group flex flex-col justify-between hover:-translate-y-1 hidden md:flex">
                           <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl text-orange-500 w-max group-hover:scale-110 transition-transform duration-300 shadow-sm border border-orange-100 dark:border-orange-500/10"><FaBook className="text-xl" /></div>
                           <div className="mt-5">
                              <h3 className="text-4xl font-black text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors drop-shadow-sm">{totalChaptersInFav}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-1">فصول متاحة لك</p>
                           </div>
                        </div>
                     </div>

                     {/* 3. قسم الإنجازات */}
                     <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                           <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <FaTrophy className="text-yellow-500" /> قاعة الإنجازات
                           </h2>
                           <span className="text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full">
                              {unlockedIds.length} / {apiAchievements !== null ? apiAchievements.length : ALL_ACHIEVEMENTS.length} مكتمل
                           </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                           {(apiAchievements !== null ? apiAchievements : ALL_ACHIEVEMENTS).map((ach: any) => {
                              const achId = ach.slug || ach.id;
                              const achTitle = ach.name_ar || ach.name || ach.title;
                              const isUnlocked = unlockedIds.includes(achId);
                              const isEquipped = equippedTitle?.id === achId || equippedTitle?.title === achTitle;
                              const achDesc = ach.description;
                              const isSecret = ach.is_secret || ach.secret;
                              const rarityColor = RARITY_COLORS[ach.rarity as keyof typeof RARITY_COLORS] || 'from-gray-500 to-gray-600';

                              // Find local achievement for icon fallback
                              const localAch = ALL_ACHIEVEMENTS.find(a => a.id === achId || a.title === achTitle);

                              return (
                                 <div
                                    key={achId}
                                    onClick={async () => {
                                       if (isUnlocked) {
                                          // حفظ اللقب محلياً
                                          localStorage.setItem('equipped_title', ach.id);
                                          localStorage.setItem('equipped_title_name', achTitle);
                                          localStorage.setItem('equipped_title_rarity', ach.rarity || 'common');
                                          if (ach.icon_url) localStorage.setItem('equipped_title_icon', ach.icon_url);
                                          setEquippedTitle({ id: ach.id, title: achTitle, rarity: ach.rarity || 'common', iconUrl: ach.icon_url });

                                          // مزامنة مع API
                                          try {
                                             await fetch(`${API_URL}/achievements/${ach.id}/equip/`, {
                                                method: 'POST',
                                                headers: {
                                                   'Content-Type': 'application/json',
                                                   ...getAuthHeaders(),
                                                }
                                             });
                                             // Also update legacy title for backward compatibility
                                             fetch(`${API_URL}/auth/profile/`, {
                                                method: 'PATCH',
                                                headers: {
                                                   'Content-Type': 'application/json',
                                                   ...getAuthHeaders(),
                                                },
                                                body: JSON.stringify({ equipped_title: achTitle }),
                                             });
                                          } catch (err) {
                                             console.error('Error syncing equipped title:', err);
                                          }

                                          toast.success(`تم تجهيز اللقب: "${achTitle}" بنجاح!`);
                                       }
                                    }}
                                    className={`relative p-5 rounded-2xl border flex flex-col items-center text-center transition-all duration-500 group overflow-hidden ${isUnlocked
                                       ? `cursor-pointer bg-white dark:bg-gray-800 shadow-lg hover:-translate-y-2 hover:shadow-2xl ${isEquipped ? 'border-yellow-400 ring-4 ring-yellow-400/20 shadow-yellow-500/30' : 'border-gray-100 dark:border-gray-700 hover:border-blue-500/50 hover:shadow-blue-500/10'}`
                                       : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60 grayscale cursor-not-allowed'
                                       }`}
                                 >
                                    {/* Holographic Sweep Effect */}
                                    {isUnlocked && <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 translate-y-full group-hover:-translate-y-full transition-transform duration-1000 ease-in-out z-0 opacity-20"></div>}
                                    {/* علامة المستخدم */}
                                    {isEquipped && (
                                       <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] px-2 py-0.5 rounded-full font-bold shadow-sm z-10">
                                          مُستخدم
                                       </div>
                                    )}

                                    {/* الأيقونة */}
                                    <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-all duration-500 ${isUnlocked
                                       ? `bg-gradient-to-br ${rarityColor} text-white shadow-xl shadow-current/30 group-hover:scale-110 group-hover:rotate-12`
                                       : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                       }`}>
                                       {isUnlocked ? (
                                          ach.icon_url ? (
                                             <ProxyImage
                                                src={ach.icon_url}
                                                alt={achTitle}
                                                className="w-6 h-6"
                                             />
                                          ) : localAch?.icon ? (
                                             <localAch.icon />
                                          ) : (
                                             <FaTrophy />
                                          )
                                       ) : <FaLock />}
                                    </div>

                                    {/* النصوص */}
                                    <div className="relative z-10 w-full">
                                       <h3 className={`font-black tracking-tight text-sm mb-1 ${isUnlocked ? 'text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors' : 'text-gray-500'}`}>
                                          {achTitle}
                                       </h3>
                                       <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                                          {isSecret && !isUnlocked ? '؟؟؟ (إنجاز سري)' : achDesc}
                                       </p>
                                    </div>

                                    {/* النقاط المكتسبة */}
                                    {ach.reward_points && (
                                       <p className="relative z-10 text-[10px] font-bold text-yellow-600 dark:text-yellow-500 mt-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-md border border-yellow-200 dark:border-yellow-700/50">
                                          🪙 +{ach.reward_points}
                                       </p>
                                    )}

                                    {/* تلميح "اضغط للتجهيز" */}
                                    {isUnlocked && !isEquipped && (
                                       <div className="relative z-10 mt-3 text-[10px] font-black text-white bg-blue-500 px-3 py-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                          اضغط واستخدمه
                                       </div>
                                    )}

                                    {!isUnlocked && !isSecret && (
                                       <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
                                          <div className="h-full bg-yellow-500/50" style={{ width: '20%' }}></div>
                                       </div>
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  </div>

               </div>

               {/* العمود الجانبي (الإشعارات والردود) */}
               {/* العمود الجانبي (الإشعارات والردود) */}
               <div className="lg:col-span-1">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/20 dark:border-gray-700/50 h-full flex flex-col sticky top-24 overflow-hidden">
                     {/* Header */}
                     <div className="p-6 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-700/30">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center justify-between">
                           <span className="flex items-center gap-3">
                              <span className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shadow-inner">
                                 <FaCommentDots />
                              </span>
                              صندوق الوارد
                           </span>
                           {replyNotifications.length > 0 && (
                              <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow-lg font-bold animate-pulse">
                                 {replyNotifications.length} جديد
                              </span>
                           )}
                        </h2>
                     </div>

                     <div className="flex-1 overflow-y-auto max-h-[600px] p-5 space-y-6 custom-scrollbar bg-gray-50/30 dark:bg-gray-900/10">
                        {replyNotifications.length === 0 ? (
                           <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4 py-20">
                              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-inner">
                                 <FaCommentDots className="text-3xl text-gray-400" />
                              </div>
                              <p className="text-sm font-bold text-gray-500">صندوق الوارد فارغ</p>
                           </div>
                        ) : (
                           replyNotifications.map((notif) => (
                              <div key={notif.replyId} className="group flex flex-col gap-2">
                                 {/* الرسالة الأصلية (الخاصة بك) */}
                                 <div className="flex justify-end">
                                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] text-xs shadow-md">
                                       <p className="opacity-70 text-[10px] mb-1 font-bold">تعليقك السابق:</p>
                                       <p className="line-clamp-2 leading-relaxed font-medium">{notif.myCommentText}</p>
                                    </div>
                                 </div>

                                 {/* رد المستخدم الآخر */}
                                 <div className="flex justify-start">
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-sm max-w-[95%] shadow-lg border border-gray-100 dark:border-gray-700 relative group-hover:-translate-y-1 transition-transform duration-300">
                                       <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-700/50">
                                          <div className="flex items-center gap-2">
                                             <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-black text-white shadow-sm ring-2 ring-white dark:ring-gray-800">
                                                {notif.user[0].toUpperCase()}
                                             </div>
                                             <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">{notif.user}</span>
                                          </div>
                                          <Link href={`/read/${notif.chapterId}`} className="text-[10px] font-extrabold bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 px-2 py-1.5 rounded-lg hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors shadow-sm">
                                             فصل {notif.chapterId}
                                          </Link>
                                       </div>
                                       
                                       <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed mb-3">
                                          {notif.text}
                                       </p>

                                       {activeReplyId === notif.replyId ? (
                                          <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                             <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="اكتب ردك السريع..."
                                                className="w-full text-xs p-3 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/10 focus:ring-2 focus:ring-blue-500 outline-none transition-all mb-3 shadow-inner min-h-[60px] text-gray-900 dark:text-gray-100"
                                             />
                                             <div className="flex gap-2">
                                                <button onClick={() => handleQuickReply(notif)} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold py-2.5 rounded-xl hover:shadow-lg hover:opacity-90 transition-all flex justify-center items-center gap-2">
                                                   <FaReply /> إرسال الرد
                                                </button>
                                                <button onClick={() => setActiveReplyId(null)} className="px-5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm">إلغاء</button>
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="flex justify-end mt-1">
                                             <button onClick={() => setActiveReplyId(notif.replyId)} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                                                <FaReply /> رد سريع
                                             </button>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </>
   );
}
