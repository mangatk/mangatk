'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FaCog, FaArrowRight, FaChevronLeft, FaChevronRight,
  FaList, FaHome, FaExpand, FaCompress
} from 'react-icons/fa';
import { useStorage } from '@/hooks/useStorage';
import { useAuth } from '@/context/AuthContext';
// Removed mocks
import { CommentsSection } from '@/components/CommentsSection';
import { ChapterRating } from '@/components/ChapterRating';
import { useReadingTime } from '@/hooks/useReadingTime';
import { getChapterDetails } from '@/services/api';
import { ChapterData } from '@/types/manga';

type ReadingMode = 'vertical' | 'single' | 'double';

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAuthHeaders } = useAuth();
  const chapterId = params.chapterId as string;
  const mangaId = searchParams.get('mangaId') || '1';

  useReadingTime(true, chapterId);

  const { addToHistory } = useStorage();

  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);

  // States related to Reading Experience
  const [mode, setMode] = useState<ReadingMode>('vertical');
  const [width, setWidth] = useState(800);
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false); // New: حالة ملء الشاشة

  // 1. جلب البيانات
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        // Use the real API service instead of internal endpoint
        const chapterData = await getChapterDetails(chapterId);

        if (chapterData) {
          // جلب تفاصيل المانجا للحصول على الغلاف (اختياري للتحسين)
          let coverImage = chapterData.images[0]?.url || '';

          setChapter(chapterData);

          // حفظ في السجل
          addToHistory({
            id: chapterData.mangaId,
            title: chapterData.mangaTitle || "Manga",
            imageUrl: coverImage,
            description: '',
            chapterCount: 0,
            avgRating: 0,
            genres: [],
            status: 'ongoing',
            lastUpdated: '',
            author: '',
            views: 0,
            category: ''
          }, chapterId, chapterData.number);

          // زيادة عدد المشاهدات وكسب النقاط
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
          fetch(`${API_URL}/chapters/${chapterId}/increment_views/`, {
            method: 'POST',
            headers: { ...getAuthHeaders() },
          })
            .then(res => {
              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
              }
              return res.json();
            })
            .then(data => console.log('Points earned:', data.points_earned, 'Total:', data.total_points))
            .catch(err => console.log('Views increment:', err));

        } else {
          console.error('Failed to load chapter');
        }
      } catch (err) {
        console.error("Error fetching chapter:", err);
      } finally {
        setLoading(false);
      }
    };

    if (chapterId) {
      fetchImages();
    }
  }, [chapterId, addToHistory]);

  // 2. 🔥 ميزة خارقة: التحميل المسبق للصور (Smart Preloading)
  useEffect(() => {
    if (!chapter || !chapter.images) return;

    // عدد الصور التي سيتم تحميلها مسبقاً (3 صور قادمة)
    const PRELOAD_COUNT = 3;

    // نحدد الصور التالية بناءً على الصفحة الحالية
    const nextImages = chapter.images.slice(currentPage + 1, currentPage + 1 + PRELOAD_COUNT);

    nextImages.forEach((img) => {
      const preloadImg = new Image();
      preloadImg.src = img.url;
    });
  }, [currentPage, chapter]);

  // 3. التحكم في التمرير (Scroll) لإخفاء القوائم
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (mode === 'vertical') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setShowControls(false);
        } else {
          setShowControls(true);
        }
        lastScrollY = window.scrollY;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mode]);

  // 4. اختصارات الكيبورد
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'vertical') return;
      if (e.key === 'ArrowRight' || e.key === 'd') prevPage(); // دعم D
      if (e.key === 'ArrowLeft' || e.key === 'a') nextPage();  // دعم A
      if (e.key === 'Space') { // دعم المسافة للنزول
        e.preventDefault();
        window.scrollBy({ top: 300, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, currentPage]);

  // 5. وظيفة وضع Zen (ملء الشاشة)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const nextPage = () => {
    if (!chapter) return;
    if (mode === 'single') {
      if (currentPage < chapter.images.length - 1) {
        setCurrentPage(p => p + 1);
        window.scrollTo(0, 0);
      }
    } else if (mode === 'double') {
      if (currentPage < chapter.images.length - 2) {
        setCurrentPage(p => p + 2);
        window.scrollTo(0, 0);
      }
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      if (mode === 'single') {
        setCurrentPage(p => p - 1);
        window.scrollTo(0, 0);
      }
      else {
        setCurrentPage(p => p - 2);
        window.scrollTo(0, 0);
      }
    }
  };

  const handleModeChange = (newMode: ReadingMode) => {
    setMode(newMode);
    setCurrentPage(0);
    window.scrollTo(0, 0);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white gap-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p>جاري تحضير الفصل...</p>
    </div>
  );

  if (!chapter) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">خطأ في التحميل أو الفصل غير موجود</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 font-sans selection:bg-blue-500 selection:text-white">

      {/* --- Header --- */}
      <header
        className={`fixed top-0 left-0 right-0 h-16 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 z-50 transition-transform duration-300 flex items-center justify-between px-4 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <Link href={`/manga/${chapter.mangaId}`} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
            <FaArrowRight className="text-xl" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-white truncate max-w-[150px] md:max-w-md">{chapter.title}</h1>
            <span className="text-xs text-gray-400">الفصل {chapter.number}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* وضع القراءة السريع */}
          <div className="hidden md:flex bg-gray-800 rounded-lg p-1 mr-2">
            <button onClick={() => handleModeChange('vertical')} className={`px-3 py-1 text-xs rounded-md transition-colors ${mode === 'vertical' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>Webtoon</button>
            <button onClick={() => handleModeChange('single')} className={`px-3 py-1 text-xs rounded-md transition-colors ${mode === 'single' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>صفحة</button>
          </div>

          {/* زر Zen Mode الجديد */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-800 rounded-full text-white"
            title="وضع التركيز (ملء الشاشة)"
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>

          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-800 rounded-full text-white"><FaCog className="text-lg" /></button>
        </div>
      </header>

      {/* --- Main Content --- */}
      {/* قمنا بإضافة min-h-screen و flex لتوسيط المحتوى في وضع الصفحة الواحدة */}
      <main
        className="pt-16 pb-20 flex flex-col items-center relative min-h-screen justify-center"
        onClick={() => setShowControls(!showControls)}
      >
        <div key={mode} className="w-full flex justify-center">

          {/* الوضع العمودي (Webtoon) */}
          {mode === 'vertical' && (
            <div className="flex flex-col items-center w-full" style={{ maxWidth: width }}>
              {chapter.images.map((img, idx) => (
                <div key={img.id} className="w-full relative min-h-[200px] bg-gray-800/50">
                  {/* نستخدم loading="eager" للصور الأولى لسرعة العرض */}
                  <img
                    src={img.url}
                    alt={`Page ${idx + 1}`}
                    className="w-full h-auto block"
                    loading={idx < 2 ? "eager" : "lazy"}
                  />
                </div>
              ))}
            </div>
          )}

          {/* وضع الصفحة الواحدة */}
          {mode === 'single' && (
            <div className="flex items-center justify-center h-[calc(100vh-64px)] w-full relative">
              <div className="relative max-h-full max-w-full">
                {/* مؤشر تحميل يظهر خلف الصورة حتى يتم تحميلها */}
                <div className="absolute inset-0 flex items-center justify-center z-0">
                  <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <img
                  src={chapter.images[currentPage]?.url}
                  alt={`Page ${currentPage + 1}`}
                  className="relative z-10 max-h-[calc(100vh-80px)] max-w-full object-contain shadow-2xl"
                  style={{ maxWidth: `${width}px` }}
                />
              </div>

              {/* أزرار التنقل الجانبية */}
              <button
                onClick={(e) => { e.stopPropagation(); nextPage(); }}
                className="absolute left-0 inset-y-0 w-1/6 hover:bg-gradient-to-r hover:from-black/20 to-transparent transition-all z-20 flex items-center justify-start pl-4 opacity-0 hover:opacity-100 group"
              >
                <span className="p-3 bg-black/50 rounded-full text-white group-hover:scale-110 transition-transform"><FaChevronLeft /></span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); prevPage(); }}
                className="absolute right-0 inset-y-0 w-1/6 hover:bg-gradient-to-l hover:from-black/20 to-transparent transition-all z-20 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 group"
              >
                <span className="p-3 bg-black/50 rounded-full text-white group-hover:scale-110 transition-transform"><FaChevronRight /></span>
              </button>
            </div>
          )}

          {/* وضع الصفحتين */}
          {mode === 'double' && (
            <div className="flex items-center justify-center h-[calc(100vh-64px)] w-full space-x-1 relative">
              {chapter.images[currentPage] && (
                <img src={chapter.images[currentPage].url} className="max-h-[calc(100vh-80px)] w-1/2 object-contain" />
              )}
              {chapter.images[currentPage + 1] && (
                <img src={chapter.images[currentPage + 1].url} className="max-h-[calc(100vh-80px)] w-1/2 object-contain" />
              )}

              {/* مناطق النقر المخفية */}
              <div className="absolute inset-y-0 left-0 w-1/4 cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); nextPage(); }}></div>
              <div className="absolute inset-y-0 right-0 w-1/4 cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); prevPage(); }}></div>
            </div>
          )}
        </div>

        {/* أزرار التنقل السفلية ... */}
        {mode === 'vertical' && (
          <div className="w-full max-w-2xl mx-auto mt-8 p-4 flex justify-between space-x-4 space-x-reverse px-4">
            {/* ... أزرار التالي والسابق ... */}
          </div>
        )}

        {/* 👇👇👇 قسم التقييم الجديد 👇👇👇 */}
        <div className="w-full px-4 mt-12">
          {/* نمرر بيانات المانجا الوهمية للحساب */}
          <ChapterRating
            mangaId={mangaId}
            chapterId={chapterId}
            // نبحث عن المانجا الحالية لنأخذ تقييمها، إذا لم نجدها نستخدم 4.5 كافتراضي
            currentMangaRating={0}
          />
        </div>

        {/* قسم التعليقات */}
        <div className="w-full px-4 mb-20">
          <CommentsSection chapterId={chapterId} />
        </div>

      </main>
      {/* --- Sidebar Settings --- */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 z-[60] p-6 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-white">إعدادات القراءة</h2>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white"><FaArrowRight /></button>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-400 mb-3">نمط العرض</h3>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleModeChange('vertical')} className={`p-3 rounded-lg border text-sm flex flex-col items-center justify-center gap-2 ${mode === 'vertical' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 hover:bg-gray-800'}`}><FaList /><span>عمودي</span></button>
            <button onClick={() => handleModeChange('single')} className={`p-3 rounded-lg border text-sm flex flex-col items-center justify-center gap-2 ${mode === 'single' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 hover:bg-gray-800'}`}><div className="border border-current w-4 h-6 rounded"></div><span>صفحة</span></button>
            <button onClick={() => handleModeChange('double')} className={`p-3 rounded-lg border text-sm flex flex-col items-center justify-center gap-2 ${mode === 'double' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 hover:bg-gray-800'}`}><div className="flex gap-0.5"><div className="border border-current w-3 h-5 rounded"></div><div className="border border-current w-3 h-5 rounded"></div></div><span>صفحتين</span></button>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-400 mb-3">حجم العرض (Zoom)</h3>
          <input type="range" min="400" max="1600" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        </div>

        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">التنقل</h3>
          <div className="space-y-3">
            <Link href={`/manga/${chapter.mangaId}`} className="flex items-center w-full p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
              <FaHome className="ml-3 text-blue-500" /><span>تفاصيل المانجا</span>
            </Link>
            <Link href="/" className="flex items-center w-full p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
              <FaArrowRight className="ml-3 text-green-500" /><span>الصفحة الرئيسية</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Overlay لإغلاق القائمة الجانبية */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-[55] backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* --- Footer Controls --- */}
      {showControls && (
        <footer className="fixed bottom-0 left-0 right-0 h-12 bg-gray-900/90 border-t border-gray-800 flex items-center justify-between px-4 z-50 text-xs text-gray-400">
          <div className="w-1/3">
            {chapter.prevChapterId ? (
              <button onClick={() => router.push(`/read/${chapter.prevChapterId}?mangaId=${mangaId}`)} className="hover:text-white flex items-center gap-2"><FaChevronRight /> السابق</button>
            ) : <span>البداية</span>}
          </div>
          <div className="w-1/3 text-center">
            {mode === 'vertical' ? <span>Webtoon Mode</span> : <span>{currentPage + 1} / {chapter.images.length}</span>}
          </div>
          <div className="w-1/3 flex justify-end">
            {chapter.nextChapterId ? (
              <button onClick={() => router.push(`/read/${chapter.nextChapterId}?mangaId=${mangaId}`)} className="hover:text-white flex items-center gap-2">التالي <FaChevronLeft /></button>
            ) : <span>النهاية</span>}
          </div>
        </footer>
      )}
    </div>
  );
}