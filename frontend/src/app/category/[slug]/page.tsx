'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ComicGrid } from '@/components/ComicGrid';
import { FilterSection } from '@/components/FilterSection';
import { Footer } from '@/components/Footer';
import { getMangaByCategory } from '@/services/api';
import { Manga } from '@/types/manga';

interface Filters {
  query?: string;
  status?: string;
  categories?: string[];
}

// Category info (keeping for UI)
const categoryInfo: Record<string, { title: string; description: string }> = {
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

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [categoryManga, setCategoryManga] = useState<Manga[]>([]);
  const [filteredManga, setFilteredManga] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('Name');
  const [currentFilters, setCurrentFilters] = useState<Filters>({});

  const catInfo = categoryInfo[slug];

  useEffect(() => {
    if (!catInfo) {
      router.push('/');
      return;
    }

    async function fetchCategoryManga() {
      try {
        setLoading(true);
        const data = await getMangaByCategory(slug);
        setCategoryManga(data);
        setFilteredManga(data);
      } catch (error) {
        console.error('Error loading category manga:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryManga();
  }, [slug, catInfo, router]);

  useEffect(() => {
    let filtered = [...categoryManga];

    if (currentFilters.query) {
      filtered = filtered.filter(manga =>
        manga.title.toLowerCase().includes(currentFilters.query?.toLowerCase() || '') ||
        manga.description.toLowerCase().includes(currentFilters.query?.toLowerCase() || '')
      );
    }

    if (currentFilters.status && currentFilters.status !== 'All') {
      filtered = filtered.filter(manga => {
        if (currentFilters.status === 'Completed') return manga.status === 'completed';
        if (currentFilters.status === 'Ongoing') return manga.status === 'ongoing';
        return true;
      });
    }

    if (currentFilters.categories && currentFilters.categories.length > 0) {
      filtered = filtered.filter(manga =>
        manga.genres.some(genre => currentFilters.categories?.includes(genre))
      );
    }

    switch (sortBy) {
      case 'Name': filtered.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'Latest Chapter': filtered.sort((a, b) => b.chapterCount - a.chapterCount); break;
      case 'Most Popular': filtered.sort((a, b) => b.views - a.views); break;
      case 'Rating': filtered.sort((a, b) => b.avgRating - a.avgRating); break;
      default: break;
    }

    setFilteredManga(filtered);
  }, [currentFilters, sortBy, categoryManga]);

  const handleFilter = (filters: Filters) => {
    setCurrentFilters(filters);
  };

  const handleSort = (sortType: string) => {
    setSortBy(sortType);
  };

  if (!catInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-red-500 mb-2">التصنيف غير موجود</h2>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">جاري تحميل المانجا...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <Link
              href="/"
              className="inline-flex items-center text-blue-200 hover:text-white mb-4 transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              العودة للرئيسية
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{catInfo.title}</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">{catInfo.description}</p>
            <div className="mt-4 text-blue-200 font-mono text-sm">
              {categoryManga.length} مانجا متاحة
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="container mx-auto px-4 py-6">
            <FilterSection onFilter={handleFilter} onSort={handleSort} />
          </div>
        </section>

        {/* Manga Results */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <ComicGrid
              mangaList={filteredManga}
              onLoadMore={() => { }}
              hasMore={false}
              showHeader={false}
              limit={undefined}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}