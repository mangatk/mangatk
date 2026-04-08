'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FilterSection } from '@/components/FilterSection';
import { ComicGrid } from '@/components/ComicGrid';
import { getMangaList } from '@/services/api';
import { Manga, FilterState } from '@/types/manga';
import { FaLayerGroup, FaSearch, FaRandom, FaFilter } from 'react-icons/fa'; // Added FaRandom, FaFilter

function BrowseContent() {
   const searchParams = useSearchParams();
   const initialGenre = searchParams.get('genre');
   const initialCategory = searchParams.get('category');
   const initialAuthor = searchParams.get('author') || undefined;
   const initialArtist = searchParams.get('artist') || undefined;

   const getSortText = (q: string | null) => {
      if (q === 'views') return 'Most Popular';
      if (q === 'latest') return 'Latest Chapter';
      return 'Latest Chapter'; // default
   };

   const [manga, setManga] = useState<Manga[]>([]);
   const [loading, setLoading] = useState(true);
   const [loadingMore, setLoadingMore] = useState(false);
   const [filters, setFilters] = useState<FilterState>({
      query: '',
      status: 'All',
      categories: initialCategory ? [initialCategory] : [],
      genres: initialGenre ? [initialGenre] : [],
      sortBy: getSortText(searchParams.get('sort')),
      author: initialAuthor,
      artist: initialArtist
   });

   // Sync filters when searchParams change (e.g. from Header links)
   useEffect(() => {
      setFilters(prev => ({
         ...prev,
         sortBy: getSortText(searchParams.get('sort'))
      }));
   }, [searchParams]);

   // Pagination state
   const [currentPage, setCurrentPage] = useState(1);
   const [hasMore, setHasMore] = useState(true);
   const [totalCount, setTotalCount] = useState(0);
   const [isFilterVisible, setIsFilterVisible] = useState(false); // Added for filter visibility

   useEffect(() => {
      loadManga(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [filters]);

   const loadManga = async (reset: boolean = false) => {
      try {
         if (reset) {
            setLoading(true);
            setCurrentPage(1);
         } else {
            setLoadingMore(true);
         }

         const page = reset ? 1 : currentPage + 1;
         const response = await getMangaList(page, 20, filters); // Assuming getMangaList now accepts page, limit, and filters

         if (reset) {
            setManga(response.results);
            setCurrentPage(1);
         } else {
            setManga(prev => [...prev, ...response.results]);
            setCurrentPage(page);
         }

         setTotalCount(response.count);
         setHasMore(response.next !== null);
      } catch (error) {
         console.error('Error loading manga:', error);
      } finally {
         setLoading(false);
         setLoadingMore(false);
      }
   };

   // 5. وهنا أيضاً
   const handleFilter = (newFilters: FilterState) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
   };

   const handleSort = (sortType: string) => {
      setFilters(prev => ({ ...prev, sortBy: sortType }));
   };

   return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
         <Header />

         <main>
            {/* Hero Section */}
            <section className="relative bg-gray-900 overflow-hidden py-16">
               <div className="container mx-auto px-4 relative z-10 text-center">
                  <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
                     استكشف <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">المكتبة</span>
                  </h1>
               </div>
            </section>

            {/* Filter Bar */}
            <div className="sticky top-16 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
               <div className="container mx-auto px-4">
                  <FilterSection onFilter={handleFilter} onSort={handleSort} initialGenres={filters.genres} initialSort={filters.sortBy} />
               </div>
            </div>

            {/* Results Grid */}
            <section className="py-8 min-h-[600px]">
               <div className="container mx-auto px-4">
                  <div className="flex items-center justify-between mb-6">
                     <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FaLayerGroup className="text-blue-500" />
                        {filters.query ? `نتائج البحث: "${filters.query}"` : 'جميع الأعمال'}
                        <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full ml-2">
                           {totalCount}
                        </span>
                     </h2>
                  </div>

                  {loading && manga.length === 0 ? (
                     <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                     </div>
                  ) : manga.length > 0 ? (
                     <>
                        <ComicGrid
                           mangaList={manga}
                           onLoadMore={() => { }}
                           hasMore={false}
                           showHeader={false}
                           limit={undefined}
                        />

                        {/* Load More Button */}
                        {hasMore && (
                           <div className="flex justify-center mt-12">
                              <button
                                 onClick={() => loadManga(false)}
                                 disabled={loadingMore}
                                 className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    `عرض المزيد (${totalCount - manga.length} متبقية)`
                                 )}
                              </button>
                           </div>
                        )}
                     </>
                  ) : (
                     <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                           <FaSearch className="text-4xl text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لم يتم العثور على نتائج</h3>
                        <button
                           onClick={() => setFilters({ status: 'All', sortBy: 'Name', query: '', categories: [] })}
                           className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                           إعادة تعيين الكل
                        </button>
                     </div>
                  )}
               </div>
            </section>
         </main>
         <Footer />
      </div>
   );
}

export default function BrowsePage() {
   return (
      <Suspense fallback={
         <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
         </div>
      }>
         <BrowseContent />
      </Suspense>
   );
}
