'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      titleKey: 'footerBrowse',
      links: [
        { labelKey: 'footerBrowseList', href: '/browse' },
        { labelKey: 'footerLatest',     href: '/browse?sort=latest' },
        { labelKey: 'footerPopular',    href: '/browse?sort=views' },
      ]
    },
    {
      titleKey: 'footerSupport',
      links: [
        { labelKey: 'footerContact', href: '/contact' },
        { labelKey: 'footerPrivacy', href: '/privacy' },
        { labelKey: 'footerTerms',   href: '/terms' },
      ]
    }
  ];

  return (
    <footer className="bg-gray-900 text-white py-6" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-12 md:gap-32 mb-8 text-center">
          {footerSections.map((section) => (
            <div key={section.titleKey}>
              <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2 inline-block shadow-sm px-4">
                {t(section.titleKey)}
              </h3>
              <ul className="space-y-3">
                {section.links.map(link => (
                  <li key={link.labelKey}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors block px-4 py-1 rounded-md hover:bg-gray-800"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-indigo-500 to-purple-500">
                MangaTK
              </h2>
              <p className="text-gray-400 mt-2 max-w-sm mx-auto">{t('footerSlogan')}</p>
            </div>

            <div className="flex items-center justify-center">
              <a
                href="https://instagram.com/athadkun"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-500 transition-colors flex items-center justify-center p-3 rounded-full hover:bg-gray-800 bg-gray-900 shadow border border-gray-800"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span className="sr-only">Instagram @athadkun</span>
              </a>
            </div>
          </div>

          <div className="mt-6 text-gray-500 text-sm">
            <p>{t('footerRights')} &copy; {currentYear} MangaTK.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}