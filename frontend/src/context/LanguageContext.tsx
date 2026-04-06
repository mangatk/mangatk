'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Lang = 'ar' | 'en';

const translations = {
  ar: {
    home: 'الرئيسية',
    browse: 'قائمة المانجا',
    latest: 'الأحدث',
    popular: 'المشهورة',
    translate: 'ترجمة AI',
    subscriptions: 'الاشتراكات',
    profile: 'الملف الشخصي',
    dashboard: '🎛️ لوحة التحكم',
    logout: 'تسجيل الخروج',
    login: 'دخول',
    register: 'تسجيل',
    loggedAs: 'مسجل باسم',
    notifications: 'الإشعارات',
    noNotifs: 'لا توجد إشعارات حالياً',
    continueReading: 'اكمل القراءة - الفصل',
    startReading: 'ابدأ القراءة',
    addFav: 'أضف للمفضلة',
    removeFav: 'تمت الإضافة للمفضلة',
    chapters: 'الفصول',
    searchChapter: 'ابحث عن رقم...',
    story: 'القصة',
    all: 'الكل',
    completed: 'مكتملة',
    ongoing: 'مستمرة',
    manga: 'مانجا',
    manhwa: 'مانهوا',
    manhua: 'مانهوا (صيني)',
    comic: 'كوميك',
    sortName: 'الاسم',
    sortLatest: 'أحدث فصل',
    sortPopular: 'الأكثر شهرة',
    sortRating: 'التقييم',
    genres: 'الأنواع',
    loading: 'جاري التحميل...',
  },
  en: {
    home: 'Home',
    browse: 'Browse',
    latest: 'Latest',
    popular: 'Popular',
    translate: 'AI Translate',
    subscriptions: 'Subscriptions',
    profile: 'Profile',
    dashboard: '🎛️ Dashboard',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    loggedAs: 'Logged in as',
    notifications: 'Notifications',
    noNotifs: 'No notifications yet',
    continueReading: 'Continue Reading - Ch.',
    startReading: 'Start Reading',
    addFav: 'Add to Favorites',
    removeFav: 'Added to Favorites',
    chapters: 'Chapters',
    searchChapter: 'Search chapter...',
    story: 'Story',
    all: 'All',
    completed: 'Completed',
    ongoing: 'Ongoing',
    manga: 'Manga',
    manhwa: 'Manhwa',
    manhua: 'Manhua',
    comic: 'Comic',
    sortName: 'Name',
    sortLatest: 'Latest Chapter',
    sortPopular: 'Most Popular',
    sortRating: 'Rating',
    genres: 'Genres',
    loading: 'Loading...',
  },
};

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: keyof typeof translations['ar']) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  toggleLang: () => {},
  t: (key) => translations['ar'][key],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lang') as Lang | null;
      if (saved === 'ar' || saved === 'en') setLang(saved);
    }
  }, []);

  const toggleLang = () => {
    const newLang: Lang = lang === 'ar' ? 'en' : 'ar';
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', newLang);
      document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', newLang);
    }
  };

  const t = (key: keyof typeof translations['ar']): string => {
    return translations[lang][key] ?? translations['ar'][key];
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
