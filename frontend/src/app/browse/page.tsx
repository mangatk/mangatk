// 'use client';
// import { useState, useEffect, useMemo } from 'react';
// import Link from 'next/link';
// import { Header } from '@/components/Header';
// import { ComicGrid } from '@/components/ComicGrid';
// import { FilterSection } from '@/components/FilterSection';
// import { Footer } from '@/components/Footer';
// import { mockManga, categories } from '@/data/mockManga';
// import { FaFire, FaFilter, FaSearch, FaRandom, FaLayerGroup } from 'react-icons/fa';

// interface Filters {
//   query?: string;
//   status?: string;
//   categories?: string[];
// }

// export default function BrowsePage() {
//   const [filteredManga, setFilteredManga] = useState(mockManga);
//   const [sortBy, setSortBy] = useState('Name');
//   const [currentFilters, setCurrentFilters] = useState<Filters>({});
//   const [displayCount, setDisplayCount] = useState(12);
//   const [isFilterVisible, setIsFilterVisible] = useState(true);

//   // تصنيفات سريعة (Quick Tags)
//   const popularTags = ['Action', 'Romance', 'Fantasy', 'Isekai', 'Comedy'];

//   // منطق التصفية والترتيب
//   useEffect(() => {
//     let filtered = [...mockManga];

//     if (currentFilters.query) {
//       const q = currentFilters.query.toLowerCase();
//       filtered = filtered.filter(manga => 
//         manga.title.toLowerCase().includes(q) ||
//         manga.description.toLowerCase().includes(q)
//       );
//     }

//     if (currentFilters.status && currentFilters.status !== 'All') {
//       filtered = filtered.filter(manga => 
//         (currentFilters.status === 'Completed' && manga.status === 'completed') ||
//         (currentFilters.status === 'Ongoing' && manga.status === 'ongoing')
//       );
//     }

//     if (currentFilters.categories && currentFilters.categories.length > 0) {
//       filtered = filtered.filter(manga =>
//         manga.genres.some(genre => currentFilters.categories?.includes(genre))
//       );
//     }

//     switch (sortBy) {
//       case 'Name': filtered.sort((a, b) => a.title.localeCompare(b.title)); break;
//       case 'Latest Chapter': filtered.sort((a, b) => b.chapterCount - a.chapterCount); break;
//       case 'Most Popular': filtered.sort((a, b) => b.views - a.views); break;
//       case 'Rating': filtered.sort((a, b) => b.avgRating - a.avgRating); break;
//       default: break;
//     }

//     setFilteredManga(filtered);
//     setDisplayCount(12);
//   }, [currentFilters, sortBy]);

//   const handleFilter = (filters: Filters) => setCurrentFilters(prev => ({ ...prev, ...filters }));
//   const handleSort = (sortType: string) => setSortBy(sortType);

//   const handleQuickTag = (tag: string) => {
//     // تبديل التصنيف: إذا كان موجوداً نحذفه، وإلا نضيفه
//     const currentCats = currentFilters.categories || [];
//     const newCats = currentCats.includes(tag) 
//       ? currentCats.filter(c => c !== tag)
//       : [...currentCats, tag];

//     handleFilter({ categories: newCats });
//   };

//   const handleLoadMore = () => setDisplayCount(prev => prev + 12);
//   const displayedManga = filteredManga.slice(0, displayCount);
//   const hasMore = displayCount < filteredManga.length;

//   // اختيار مانجا عشوائية
//   const handleRandomPick = () => {
//     const random = mockManga[Math.floor(Math.random() * mockManga.length)];
//     window.location.href = `/manga/${random.id}`;
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
//       <Header />

//       <main>
//         {/* 1. قسم الرأس (Hero Section) بتصميم عصري */}
//         <section className="relative bg-gray-900 overflow-hidden py-16 sm:py-24">
//           {/* خلفية جمالية */}
//           <div className="absolute inset-0 overflow-hidden">
//              <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl"></div>
//              <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-purple-600/10 blur-3xl"></div>
//              <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10"></div>
//           </div>

//           <div className="container mx-auto px-4 relative z-10 text-center">
//             <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-lg">
//               استكشف <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">عالمك</span> المفضل
//             </h1>
//             <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
//               أكبر مكتبة للمانجا والويب تون مترجمة للعربية. تصفح آلاف الفصول، تابع أعمالك المفضلة، واكتشف جواهر مخفية.
//             </p>

//             {/* إحصائيات سريعة */}
//             <div className="flex justify-center gap-6 md:gap-12 text-white/80">
//                <div className="text-center">
//                   <span className="block text-2xl md:text-3xl font-bold text-white">{mockManga.length}</span>
//                   <span className="text-xs md:text-sm">عمل متاح</span>
//                </div>
//                <div className="text-center">
//                   <span className="block text-2xl md:text-3xl font-bold text-white">
//                     {mockManga.reduce((acc, curr) => acc + curr.chapterCount, 0)}
//                   </span>
//                   <span className="text-xs md:text-sm">فصل مترجم</span>
//                </div>
//                <div className="text-center">
//                   <span className="block text-2xl md:text-3xl font-bold text-white">+50</span>
//                   <span className="text-xs md:text-sm">تصنيف</span>
//                </div>
//             </div>
//           </div>
//         </section>

//         {/* 2. شريط التحكم (Sticky Control Bar) */}
//         <div className="sticky top-16 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm transition-all">
//            <div className="container mx-auto px-4 py-4">
//               <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

//                  {/* أزرار التصنيف السريع */}
//                  <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
//                     <span className="text-xs font-bold text-gray-500 whitespace-nowrap ml-2">سريع:</span>
//                     {popularTags.map(tag => (
//                        <button
//                           key={tag}
//                           onClick={() => handleQuickTag(tag)}
//                           className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
//                              currentFilters.categories?.includes(tag)
//                              ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
//                              : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:text-blue-500'
//                           }`}
//                        >
//                           {tag}
//                        </button>
//                     ))}
//                  </div>

//                  {/* أدوات إضافية */}
//                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
//                     <button 
//                        onClick={() => setIsFilterVisible(!isFilterVisible)}
//                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isFilterVisible ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
//                     >
//                        <FaFilter /> <span className="hidden sm:inline">تصفية</span>
//                     </button>

//                     <button 
//                        onClick={handleRandomPick}
//                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-sm font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
//                        title="اقتراح عشوائي"
//                     >
//                        <FaRandom /> <span className="hidden sm:inline">عشوائي</span>
//                     </button>
//                  </div>
//               </div>

//               {/* قسم الفلترة القابل للطي */}
//               <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isFilterVisible ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
//                  <FilterSection onFilter={handleFilter} onSort={handleSort} />
//               </div>
//            </div>
//         </div>

//         {/* 3. شبكة النتائج */}
//         <section className="py-8 min-h-[600px]">
//           <div className="container mx-auto px-4">

//             {/* عنوان النتائج */}
//             <div className="flex items-center justify-between mb-6">
//                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
//                   <FaLayerGroup className="text-blue-500" />
//                   {currentFilters.query ? `نتائج البحث: "${currentFilters.query}"` : 'جميع الأعمال'}
//                   <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full ml-2">
//                      {filteredManga.length}
//                   </span>
//                </h2>
//             </div>

//             {filteredManga.length > 0 ? (
//                <ComicGrid 
//                  mangaList={displayedManga}
//                  onLoadMore={handleLoadMore}
//                  hasMore={hasMore}
//                  showHeader={false} 
//                  limit={undefined}            
//                />
//             ) : (
//                // حالة عدم وجود نتائج
//                <div className="flex flex-col items-center justify-center py-20 text-center">
//                   <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
//                      <FaSearch className="text-4xl text-gray-400" />
//                   </div>
//                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لم يتم العثور على نتائج</h3>
//                   <p className="text-gray-500 mb-6 max-w-md">
//                      لم نجد أي مانجا تطابق بحثك. جرب كلمات مفتاحية مختلفة أو قم بإزالة بعض الفلاتر.
//                   </p>
//                   <button 
//                      onClick={() => {
//                         setCurrentFilters({});
//                         // إعادة تعيين البحث في SearchBar (يتطلب ربط أكثر تعقيداً، لكن هذا يكفي للنموذج)
//                         window.location.reload(); 
//                      }}
//                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                   >
//                      إعادة تعيين الكل
//                   </button>
//                </div>
//             )}
//           </div>
//         </section>
//       </main>

//       <Footer />
//     </div>
//   );
// }
'use client';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ComicGrid } from '@/components/ComicGrid';
import { FilterSection } from '@/components/FilterSection';
import { Footer } from '@/components/Footer';
import { getMangaList } from '@/services/api';
// 1. قم باستيراد FilterState هنا
import { Manga, FilterState } from '@/types/manga';
import { FaLayerGroup, FaSearch } from 'react-icons/fa';

// 2. احذف واجهة Filters المحلية بالكامل لأننا لم نعد بحاجة إليها
// interface Filters { ... }  <-- احذف هذا الجزء

export default function BrowsePage() {
   const [mangaList, setMangaList] = useState<Manga[]>([]);
   const [loading, setLoading] = useState(true);

   // 3. استخدم FilterState بدلاً من Filters
   const [currentFilters, setCurrentFilters] = useState<FilterState>({
      status: 'All',
      sortBy: 'Name'
   });

   // 4. عدّل نوع المعامل هنا أيضاً
   const fetchData = async (filters: FilterState) => {
      setLoading(true);
      try {
         const data = await getMangaList(filters);
         setMangaList(data);
      } catch (error) {
         console.error("Error fetching manga:", error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData(currentFilters);
   }, [currentFilters]);

   // 5. وهنا أيضاً
   const handleFilter = (newFilters: FilterState) => {
      setCurrentFilters(prev => ({ ...prev, ...newFilters }));
   };

   const handleSort = (sortType: string) => {
      setCurrentFilters(prev => ({ ...prev, sortBy: sortType }));
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
                  <FilterSection onFilter={handleFilter} onSort={handleSort} />
               </div>
            </div>

            {/* Results Grid */}
            <section className="py-8 min-h-[600px]">
               <div className="container mx-auto px-4">
                  <div className="flex items-center justify-between mb-6">
                     <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FaLayerGroup className="text-blue-500" />
                        {currentFilters.query ? `نتائج البحث: "${currentFilters.query}"` : 'جميع الأعمال'}
                        <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full ml-2">
                           {mangaList.length}
                        </span>
                     </h2>
                  </div>

                  {loading ? (
                     <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                     </div>
                  ) : mangaList.length > 0 ? (
                     <ComicGrid
                        mangaList={mangaList}
                        onLoadMore={() => { }}
                        hasMore={false} // يمكنك تفعيل الـ Pagination لاحقاً
                        showHeader={false}
                        limit={undefined}
                     />
                  ) : (
                     <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                           <FaSearch className="text-4xl text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لم يتم العثور على نتائج</h3>
                        <button
                           onClick={() => setCurrentFilters({ status: 'All', sortBy: 'Name' })}
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
