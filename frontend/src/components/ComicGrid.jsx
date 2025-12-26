'use client';
import Link from 'next/link';
import { FaStar, FaPlay, FaClock, FaEye, FaLayerGroup } from 'react-icons/fa';
import { ProxyImage } from '@/components/ProxyImage';

export function ComicGrid({ mangaList, onLoadMore, hasMore, limit, showHeader = true }) {

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const displayManga = limit ? mangaList.slice(0, limit) : mangaList;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {showHeader && (
          <div className="flex items-end justify-between mb-8 border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                مكتبة المانجا
              </h2>
              <p className="text-gray-500 mt-1 text-sm">اكتشف عوالم جديدة ومغامرات لا تنتهي</p>
            </div>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
              {displayManga.length} عمل
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {displayManga.map(manga => (
            <Link
              key={manga.id}
              href={`/manga/${manga.id}`}
              className="group relative block w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 ring-1 ring-black/5 dark:ring-white/10"
            >
              {/* 1. طبقة الصورة */}
              <div className="absolute inset-0 bg-gray-800">
                <ProxyImage
                  src={manga.imageUrl}
                  alt={manga.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* تدرج لوني علوي (لإظهار الأرقام) */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent opacity-60" />

                {/* تدرج لوني سفلي أقوى (لإظهار العنوان) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90" />
              </div>

              {/* 2. الزاوية العلوية اليسرى: الحالة */}
              <div className="absolute top-3 left-3 z-20">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md ${manga.status === 'ongoing' ? 'bg-green-500/80' : 'bg-blue-500/80'
                  }`}>
                  {manga.status === 'ongoing' ? 'مستمر' : 'مكتمل'}
                </span>
              </div>

              {/* 3. الزاوية العلوية اليمنى: التقييم + الفصول (تم النقل هنا للوضوح) */}
              <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5">
                {/* التقييم */}
                <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-white text-xs font-bold border border-white/10">
                  <FaStar className="text-yellow-400 text-[10px]" /> {manga.avgRating}
                </span>
                {/* عدد الفصول */}
                <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-white text-[10px] border border-white/10">
                  <FaLayerGroup className="text-blue-400" /> {manga.chapterCount}
                </span>
              </div>

              {/* 4. المحتوى السفلي: العنوان والتفاصيل */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-20">

                {/* العنوان (يظهر دائماً بوضوح) */}
                <h3 className="text-white font-bold text-base leading-snug line-clamp-2 mb-1 drop-shadow-md group-hover:text-blue-400 transition-colors">
                  {manga.title}
                </h3>

                {/* التفاصيل الإضافية (تظهر فقط عند التحويم) */}
                <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300 ease-in-out">
                  <div className="overflow-hidden">
                    <div className="pt-2 mt-2 border-t border-white/20">
                      <div className="flex justify-between text-xs text-gray-300 mb-2">
                        <span className="flex items-center gap-1"><FaEye /> {formatNumber(manga.views)}</span>
                        <span className="flex items-center gap-1"><FaClock /> {new Date(manga.lastUpdated).toLocaleDateString('ar-EG')}</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {manga.genres.slice(0, 2).map(g => (
                          <span key={g} className="text-[9px] px-1.5 py-0.5 bg-white/10 text-white rounded border border-white/10">
                            {g}
                          </span>
                        ))}
                      </div>

                      <button className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors">
                        <FaPlay className="text-xs" /> اقرأ الآن
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </Link>
          ))}
        </div>

        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={onLoadMore}
              className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-full font-bold hover:shadow-lg hover:border-blue-500 transition-all"
            >
              عرض المزيد
            </button>
          </div>
        )}
      </div>
    </section>
  );
}