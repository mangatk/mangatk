'use client';
import { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaStar, FaLayerGroup } from 'react-icons/fa';
import Link from 'next/link';
import { ProxyImage } from '@/components/ProxyImage';
import { Manga } from '@/types/manga';

interface CarouselProps {
  mangaList?: Manga[];
}

export function Carousel({ mangaList = [] }: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const featured = mangaList.slice(0, 5);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % (featured.length || 1));
  const prevSlide = () => setCurrent((prev) => (prev - 1 + (featured.length || 1)) % (featured.length || 1));

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [current]);

  return (
    <section
      className="relative bg-gray-900 overflow-hidden mx-auto w-full max-w-[1080px] h-[400px] rounded-2xl shadow-2xl mt-6 group"
      dir="ltr"
    >
      <div
        className="absolute inset-0 flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {featured.map((manga) => (
          <div key={manga.id} className="w-full h-full flex-shrink-0 relative">
            <Link href={`/manga/${manga.id}`} className="block w-full h-full relative">

              <ProxyImage
                src={(manga as any).banner_image_url || manga.imageUrl}
                alt={manga.title}
                className="w-full h-full object-cover"
              />

              {/* التراكب (Overlay) للنصوص */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 flex flex-col justify-end p-8 text-right" dir="rtl">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-lg line-clamp-1">
                  {manga.title}
                </h2>
                <p className="text-gray-200 text-sm md:text-base mb-4 line-clamp-2 max-w-2xl drop-shadow-md">
                  {manga.description}
                </p>

                <div className="flex items-center gap-3 text-sm font-bold text-white">
                  <span className="flex items-center gap-1 bg-yellow-500 text-black px-2 py-1 rounded">
                    <FaStar /> {manga.avgRating}
                  </span>
                  <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
                    <FaLayerGroup /> {manga.chapterCount} فصل
                  </span>
                  <span className={`px-2 py-1 rounded text-xs uppercase ${manga.status === 'ongoing' ? 'bg-green-600' : 'bg-blue-600'}`}>
                    {manga.status === 'ongoing' ? 'مستمر' : 'مكتمل'}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* أزرار التنقل */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-blue-600 text-white p-3 rounded-full transition-all duration-200 z-10 backdrop-blur-sm opacity-0 group-hover:opacity-100"
      >
        <FaChevronLeft size={20} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-blue-600 text-white p-3 rounded-full transition-all duration-200 z-10 backdrop-blur-sm opacity-0 group-hover:opacity-100"
      >
        <FaChevronRight size={20} />
      </button>

      {/* المؤشرات السفلية (Dots) */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {featured.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`transition-all duration-300 rounded-full ${current === idx ? 'bg-blue-500 w-8 h-2' : 'bg-white/50 w-2 h-2 hover:bg-white'
              }`}
          />
        ))}
      </div>
    </section>
  );
}