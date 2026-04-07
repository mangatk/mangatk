'use client';
import Link from 'next/link';
import { FaStar, FaRocket, FaCalendarAlt, FaLock } from 'react-icons/fa';
import { useLanguage } from '@/context/LanguageContext';

export function QuickMenu() {
  const { t } = useLanguage();

  const items = [
    { icon: FaStar,        labelKey: 'newFeatures',     descKey: 'newFeaturesDesc',      href: '#' },
    { icon: FaRocket,      labelKey: 'latestDownloads', descKey: 'latestDownloadsDesc',  href: '/browse?sort=latest' },
    { icon: FaCalendarAlt, labelKey: 'events',          descKey: 'eventsDesc',           href: '#' },
    { icon: FaLock,        labelKey: 'exclusive',       descKey: 'exclusiveDesc',        href: '#' },
  ];

  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {items.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="group text-center py-4 px-2 sm:p-6 rounded-2xl bg-white dark:bg-gray-700 shadow-sm sm:shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-600/50"
            >
              <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <item.icon className="text-xl sm:text-3xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xs sm:text-xl font-bold mb-1 sm:mb-2 text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate w-full px-1">
                {t(item.labelKey)}
              </h3>
              <p className="text-xs sm:text-base text-gray-500 dark:text-gray-400 leading-tight hidden sm:block">
                {t(item.descKey)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}