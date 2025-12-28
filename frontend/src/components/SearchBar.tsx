'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getMangaList } from '@/services/api';
import { Manga } from '@/types/manga';
import { ProxyImage } from '@/components/ProxyImage';

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Manga[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // تأخير البحث لتجنب الضغط على السيرفر
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 2) {
        setLoading(true);
        try {
          // جلب النتائج من السيرفر
          const data = await getMangaList({ query: query });
          setResults(data.slice(0, 5)); // عرض أول 5 نتائج فقط
          setIsOpen(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500); // انتظار 500ms بعد التوقف عن الكتابة

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (onSearch) onSearch(val);
  };

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="ابحث عن مانجا..."
          value={query}
          onChange={handleSearchChange}
          className="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
        />
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
          {results.length > 0 ? (
            <ul className="py-2">
              {results.map((manga) => (
                <li key={manga.id}>
                  <Link
                    href={`/manga/${manga.id}`}
                    className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors gap-3"
                    onClick={() => setIsOpen(false)}
                  >
                    <ProxyImage
                      src={manga.imageUrl || '/placeholder.jpg'}
                      alt={manga.title}
                      className="w-10 h-14 object-cover rounded shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 dark:text-white text-sm truncate">{manga.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{manga.author}</div>
                      <div className="text-xs text-blue-500 mt-0.5">⭐ {manga.avgRating}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            !loading && <div className="px-4 py-6 text-center text-gray-500 text-sm">لا توجد نتائج</div>
          )}
        </div>
      )}
    </div>
  );
}
