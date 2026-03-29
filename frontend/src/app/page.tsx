'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Carousel } from '@/components/Carousel';
import { QuickMenu } from '@/components/QuickMenu';
import { FilterSection } from '@/components/FilterSection';
import { CategoryNav } from '@/components/CategoryNav';
import { ComicGrid } from '@/components/ComicGrid';
import { SectionTitle } from '@/components/SectionTitle';
import { CTASection } from '@/components/CTASection';
import { Footer } from '@/components/Footer';
import { ProxyImage } from '@/components/ProxyImage';
import { getMangaList, getMangaByCategory } from '@/services/api';
import { Manga } from '@/types/manga';
import { useStorage } from '@/hooks/useStorage';
import { useAuth } from '@/context/AuthContext';
import { FaPlay, FaHistory, FaTimesCircle } from 'react-icons/fa';

interface Filters {
  query?: string;
  status?: string;
  categories?: string[];
  genres?: string[];
  sortBy?: string;
  author?: string;
  artist?: string;
}

// Category titles (keeping for UI)
const categoryInfo = {
  'best-webtoon': {
    title: 'Best Webtoon',
    description: 'أفضل المانغا والويبتون حسب التقييمات'
  },
  'golden-week': {
    title: 'Golden Week',
    description: 'مانغا الأسبوع الذهبي الأكثر شهرة'
  },
  'new-releases': {
    title: 'New Releases',
    description: 'أحدث الإصدارات والمانغا الجديدة'
  },
  'action-fantasy': {
    title: 'Action & Fantasy',
    description: 'أقوى مانغا الأكشن والخيال'
  },
  'romance-drama': {
    title: 'Romance & Drama',
    description: 'أجمل قصص الرومانسية والدراما'
  }
};

function HomeContent() {
  const { user } = useAuth();
  const { history } = useStorage();
  const searchParams = useSearchParams();

  const [allManga, setAllManga] = useState<Manga[]>([]);
  const [featuredManga, setFeaturedManga] = useState<Manga[]>([]);
  const [filteredManga, setFilteredManga] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [greeting, setGreeting] = useState('');
  
  // Initialize filters based on explicit URL parameters (like clicks from Manga Details page)
  const initialAuthor = searchParams.get('author') || undefined;
  const initialArtist = searchParams.get('artist') || undefined;
  const [currentFilters, setCurrentFilters] = useState<Filters>({
    author: initialAuthor,
    artist: initialArtist,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Category manga (loaded separately)
  const [categorizedManga, setCategorizedManga] = useState<{
    [key: string]: Manga[];
  }>({
    'best-webtoon': [],
    'golden-week': [],
    'new-releases': [],
    'action-fantasy': [],
    'romance-drama': []
  });

  // Load manga from API on mount
  useEffect(() => {
    async function fetchManga() {
      try {
        setLoading(true);

        // 1. Fetch first page of manga (20 items) respecting explicit initial URL filters
        const response = await getMangaList(1, 20, currentFilters);
        setAllManga(response.results);
        setFilteredManga(response.results);
        setTotalCount(response.count);
        setHasMore(response.next !== null);
        setCurrentPage(1);

        // 2. Fetch featured manga (for carousel) - USE CORRECT ENDPOINT
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
          const featuredRes = await fetch(`${API_URL}/manga/featured/`);
          if (featuredRes.ok) {
            const featuredData = await featuredRes.json();
            const featuredResults = Array.isArray(featuredData) ? featuredData : featuredData.results || [];

            // Map and ensure we use banner_image_url
            setFeaturedManga(featuredResults.map((item: any) => ({
              id: item.id,
              title: item.title,
              description: item.description || '',
              imageUrl: item.cover_image_url || '/images/placeholder.jpg',
              banner_image_url: item.banner_image_url, // CRITICAL: Banner image for carousel
              chapterCount: item.chapter_count || 0,
              avgRating: parseFloat(item.avg_rating || '0'),
              genres: item.genres ? (Array.isArray(item.genres) ? item.genres.map((g: any) => g.name || g) : []) : [],
              status: item.status,
              lastUpdated: item.last_updated,
              author: item.author || 'Unknown',
              views: item.views || 0,
              category: typeof item.category === 'object' && item.category !== null ? item.category.slug : item.category,
            })));
          } else {
            // If request fails, use fallback
            setFeaturedManga(response.results.slice(0, 5));
          }
        } catch (err) {
          console.error('Error fetching featured manga:', err);
          // Fallback to first 5 manga if featured fetch fails
          setFeaturedManga(response.results.slice(0, 5));
        }

        // Load categorized manga in background (don't block initial load)
        loadCategorizedManga();

      } catch (error) {
        console.error('Error loading manga:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchManga();

    // Set greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('صباح الخير ☀️');
    else if (hour < 18) setGreeting('طاب مساؤك 🌤️');
    else setGreeting('سهرة ممتعة 🌙');
  }, []);

  // Load categorized manga separately to not block initial load
  async function loadCategorizedManga() {
    try {
      const bestWebtoon = await getMangaByCategory('best-webtoon');
      const goldenWeek = await getMangaByCategory('golden-week');
      const newReleases = await getMangaByCategory('new-releases');
      const actionFantasy = await getMangaByCategory('action-fantasy');
      const romanceDrama = await getMangaByCategory('romance-drama');

      setCategorizedManga({
        'best-webtoon': bestWebtoon,
        'golden-week': goldenWeek,
        'new-releases': newReleases,
        'action-fantasy': actionFantasy,
        'romance-drama': romanceDrama
      });
    } catch (error) {
      console.error('Error loading categorized manga:', error);
    }
  }

  // Load more manga
  const loadMoreManga = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const response = await getMangaList(nextPage, 20, currentFilters);

      setAllManga(prev => [...prev, ...response.results]);
      setFilteredManga(prev => [...prev, ...response.results]);
      setCurrentPage(nextPage);
      setHasMore(response.next !== null);
    } catch (error) {
      console.error('Error loading more manga:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const isInitialMount = useRef(true);

  // Server-side filtering logic
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    async function fetchFiltered() {
      setLoading(true);
      try {
        const response = await getMangaList(1, 20, currentFilters);
        setAllManga(response.results);
        setFilteredManga(response.results);
        setTotalCount(response.count);
        setHasMore(response.next !== null);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error fetching filtered manga:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFiltered();
  }, [currentFilters]);

  const handleFilter = (filters: Filters) => setCurrentFilters(prev => ({ ...prev, ...filters }));
  const handleSort = (order: string) => setCurrentFilters(prev => ({ ...prev, sortBy: order }));
  const handleCategorySelect = (cat: string) => setCurrentFilters(prev => ({ ...prev, categories: [cat] }));

  const clearFilters = () => {
    setCurrentFilters({});
  };

  const hasActiveFilters = currentFilters.query || (currentFilters.status && currentFilters.status !== 'All') || (currentFilters.categories && currentFilters.categories.length > 0) || (currentFilters.genres && currentFilters.genres.length > 0) || (currentFilters.sortBy && currentFilters.sortBy !== 'Name');
  const lastRead = history.length > 0 ? history[0] : null;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">جاري تحميل المانجا...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 font-sans">
      <Header />

      <div id="main-content">

        {/* Hero Section - Always show Carousel */}
        <Carousel mangaList={featuredManga.length > 0 ? featuredManga : allManga.slice(0, 5)} />

        <QuickMenu />

        {/* Recent Reading */}
        {!hasActiveFilters && history.length > 1 && (
          <section className="py-8 bg-gray-50 dark:bg-gray-800/30 border-y border-gray-100 dark:border-gray-800">
            <div className="container mx-auto px-4">
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <FaHistory /> قراءاتك الأخيرة
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {history.slice(1, 6).map((item, idx) => (
                  <Link key={idx} href={`/read/${item.chapterId}?mangaId=${item.mangaId}`} className="flex-shrink-0 w-48 group">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden relative mb-2">
                      <ProxyImage
                        src={item.imageUrl}
                        alt={item.mangaTitle}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <FaPlay className="text-white text-2xl" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {item.chapterNumber ? `Ch. ${item.chapterNumber}` : (item.chapterId.length > 10 ? 'Ch' : `Ch. ${item.chapterId}`)}
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-800 dark:text-white text-sm truncate">{item.mangaTitle}</h4>
                    <p className="text-xs text-gray-500">تابع القراءة</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Filter Section */}
        <FilterSection onFilter={handleFilter} onSort={handleSort} initialCategories={currentFilters.genres || []} />
        <CategoryNav onCategorySelect={handleCategorySelect} />

        {/* Search Results or Main Content */}
        {hasActiveFilters ? (
          <section className="py-12 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <SectionTitle
                  title={`نتائج البحث (${filteredManga.length})`}
                  description="المانجا التي تطابق معايير البحث الخاصة بك"
                />
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-5 py-2.5 rounded-full font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shadow-sm"
                >
                  <FaTimesCircle className="text-lg" />
                  إلغاء الفلتر والعودة
                </button>
              </div>
              <ComicGrid mangaList={filteredManga} onLoadMore={() => { }} hasMore={false} showHeader={false} limit={undefined} />
            </div>
          </section>
        ) : (
          /* Main Content Sections */
          <>
            {/* Top Rated */}
            <section className="py-12 bg-white dark:bg-gray-900">
              <div className="container mx-auto px-4">
                <SectionTitle title="الأعلى تقييماً 🔥" description="بناءً على تقييمات القراء" />
                <ComicGrid mangaList={allManga.slice(0, 5)} onLoadMore={() => { }} hasMore={false} limit={5} showHeader={false} />
              </div>
            </section>

            {/* Best Webtoon */}
            {categorizedManga['best-webtoon'].length > 0 && (
              <section className="py-12 bg-gray-50 dark:bg-gray-800">
                <div className="container mx-auto px-4">
                  <SectionTitle title={categoryInfo['best-webtoon'].title} description={categoryInfo['best-webtoon'].description} viewAllLink="/category/best-webtoon" />
                  <ComicGrid mangaList={categorizedManga['best-webtoon']} onLoadMore={() => { }} hasMore={false} limit={4} showHeader={false} />
                </div>
              </section>
            )}

            {/* Golden Week */}
            {categorizedManga['golden-week'].length > 0 && (
              <section className="py-12 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-4">
                  <SectionTitle title={categoryInfo['golden-week'].title} description={categoryInfo['golden-week'].description} viewAllLink="/category/golden-week" />
                  <ComicGrid mangaList={categorizedManga['golden-week']} onLoadMore={() => { }} hasMore={false} limit={4} showHeader={false} />
                </div>
              </section>
            )}

            {/* New Releases */}
            {categorizedManga['new-releases'].length > 0 && (
              <section className="py-12 bg-gray-50 dark:bg-gray-800">
                <div className="container mx-auto px-4">
                  <SectionTitle title={categoryInfo['new-releases'].title} description={categoryInfo['new-releases'].description} viewAllLink="/category/new-releases" />
                  <ComicGrid mangaList={categorizedManga['new-releases']} onLoadMore={() => { }} hasMore={false} limit={4} showHeader={false} />
                </div>
              </section>
            )}

            {/* Action & Fantasy */}
            {categorizedManga['action-fantasy'].length > 0 && (
              <section className="py-12 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-4">
                  <SectionTitle title={categoryInfo['action-fantasy'].title} description={categoryInfo['action-fantasy'].description} viewAllLink="/category/action-fantasy" />
                  <ComicGrid mangaList={categorizedManga['action-fantasy']} onLoadMore={() => { }} hasMore={false} limit={4} showHeader={false} />
                </div>
              </section>
            )}

            {/* Romance & Drama */}
            {categorizedManga['romance-drama'].length > 0 && (
              <section className="py-12 bg-gray-50 dark:bg-gray-800">
                <div className="container mx-auto px-4">
                  <SectionTitle title={categoryInfo['romance-drama'].title} description={categoryInfo['romance-drama'].description} viewAllLink="/category/romance-drama" />
                  <ComicGrid mangaList={categorizedManga['romance-drama']} onLoadMore={() => { }} hasMore={false} limit={4} showHeader={false} />
                </div>
              </section>
            )}

            {/* All Manga */}
            <section className="py-12 bg-white dark:bg-gray-900">
              <div className="container mx-auto px-4">
                <SectionTitle title="جميع المانجا" description="استكشف مكتبتنا الكاملة" viewAllLink="/browse" />
                <ComicGrid mangaList={allManga} onLoadMore={() => { }} hasMore={allManga.length > 12} limit={12} showHeader={false} />
              </div>
            </section>
          </>
        )}

        {/* CTAs للتواصل */}
        <CTASection />

        {/* Load More Button */}
        {!loading && hasMore && (
          <div className="flex justify-center my-12">
            <button
              onClick={loadMoreManga}
              disabled={loadingMore}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري التحميل...
                </span>
              ) : (
                `تحميل المزيد (${totalCount - allManga.length} متبقية)`
              )}
            </button>
          </div>
        )}

        {/* Footer Footer */}
        <Footer />
      </div>
      <Footer />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">جاري تحميل المانجا...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}