// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { useAuth } from '@/context/AuthContext';
// import { FaSun, FaMoon, FaSignOutAlt, FaBell, FaBars, FaTimes, FaSearch } from 'react-icons/fa';
// import { SearchBar } from './SearchBar';
// import { useNotifications } from '@/context/NotificationContext';
// import { useAchievements } from '@/hooks/useAchievements';
// import { AchievementToast } from './AchievementToast';
// import { ProxyImage } from './ProxyImage';
// import { useLanguage } from '@/context/LanguageContext';

// export function Header() {
//   const { user, login, register, logout } = useAuth();
//   const { lang, toggleLang, t } = useLanguage();
//   const [darkMode, setDarkMode] = useState(false);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [notifMenuOpen, setNotifMenuOpen] = useState(false);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [searchOpen, setSearchOpen] = useState(false);
//   const { notifications, unreadCount, markAllAsRead } = useNotifications();

//   const { newUnlock, closeNotification } = useAchievements();

//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const saved = localStorage.getItem('darkMode') === 'true';
//       setDarkMode(saved);
//       document.documentElement.classList.toggle('dark', saved);
//     }
//   }, []);

//   const toggleDarkMode = () => {
//     const newMode = !darkMode;
//     setDarkMode(newMode);
//     localStorage.setItem('darkMode', String(newMode));
//     document.documentElement.classList.toggle('dark', newMode);
//   };

//   const navItems = [
//     { name: t('home'), path: '/' },
//     { name: t('browse'), path: '/browse' },
//     { name: t('latest'), path: '/browse?sort=latest' },
//     { name: t('popular'), path: '/browse?sort=views' },
//     { name: t('translate'), path: '/translate' },
//     { name: t('subscriptions'), path: '/subscriptions' }
//   ];

//   return (
//     <>
//       <AchievementToast achievement={newUnlock} onClose={closeNotification} />

//       <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-colors duration-300">
//         <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-4 relative">

//           {/* الشعار والقوائم */}
//           <div className="flex items-center gap-4 md:gap-8 flex-1">
//             <button 
//               className="lg:hidden text-gray-600 dark:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
//               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//               aria-label="Toggle Mobile Menu"
//             >
//               {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
//             </button>
//             <Link href="/" className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//               MangaTK
//             </Link>
//             <nav className="hidden lg:block">
//               <ul className="flex space-x-6 space-x-reverse font-medium">
//                 {/* 🟢 استخدام navItems للرسم */}
//                 {navItems.map((item, idx) => (
//                   <li key={idx}>
//                     <Link
//                       href={item.path}
//                       className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
//                     >
//                       {item.name}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </nav>
//           </div>

//           {/* البحث */}
//           <div className="flex-1 flex justify-end lg:justify-center mx-2 lg:mx-4">
//             {/* عرض شريط البحث دائماً في الشاشات الكبيرة */}
//             <div className="w-full max-w-md hidden lg:block">
//               <SearchBar />
//             </div>

//             {/* الأيقونة فقط للشاشات الأصغر */}
//             <button 
//               onClick={() => setSearchOpen(!searchOpen)}
//               className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0 ml-auto"
//               aria-label="Search"
//             >
//               {searchOpen ? <FaTimes className="text-xl" /> : <FaSearch className="text-xl" />}
//             </button>
//           </div>

//           {/* أدوات المستخدم */}
//           <div className="flex items-center gap-3 md:gap-4 ml-2">
//             <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
//               {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon />}
//             </button>

//             {/* زر تبديل اللغة */}
//             <button
//               onClick={toggleLang}
//               className="px-3 py-1.5 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all tracking-wider"
//               title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
//             >
//               {lang === 'ar' ? 'EN' : 'ع'}
//             </button>

//             {user && (
//               <div className="relative">
//                 <button 
//                   onClick={() => {
//                     setNotifMenuOpen(!notifMenuOpen);
//                     if (!notifMenuOpen && unreadCount > 0) markAllAsRead();
//                   }} 
//                   className="p-2 rounded-full relative hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
//                 >
//                   <FaBell className="text-xl" />
//                   {unreadCount > 0 && (
//                     <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/4 bg-red-600 rounded-full">
//                       {unreadCount}
//                     </span>
//                   )}
//                 </button>

//                 {notifMenuOpen && (
//                   <>
//                     <div className="fixed inset-0 z-40 cursor-default" onClick={() => setNotifMenuOpen(false)} />
//                     <div className="absolute top-full -left-24 sm:-left-32 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
//                       <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 font-bold text-gray-800 dark:text-gray-200 flex justify-between items-center">
//                         <span>{t('notifications')}</span>
//                       </div>
//                       <div className="max-h-[60vh] overflow-y-auto">
//                         {notifications.length > 0 ? (
//                           notifications.slice(0, 15).map((n) => (
//                             <Link 
//                               key={n.id} 
//                               href={n.link || '#'} 
//                               onClick={() => setNotifMenuOpen(false)}
//                               className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
//                             >
//                               <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{n.title}</div>
//                               <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{n.message}</div>
//                             </Link>
//                           ))
//                         ) : (
//                           <div className="px-6 py-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
//                             <FaBell className="text-gray-300 dark:text-gray-600 text-4xl mb-2" />
//                             {t('noNotifs')}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </>
//                 )}
//               </div>
//             )}

//             {user ? (
//               <div className="relative">
//                 <button
//                   onClick={() => setMenuOpen(!menuOpen)}
//                   className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all relative z-50"
//                 >
//                   <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold relative overflow-hidden">
//                     {user.equipped_achievement_icon ? (
//                       <img
//                         src={user.equipped_achievement_icon}
//                         alt="Achievement"
//                         className="absolute inset-0 w-full h-full object-cover"
//                         onError={(e) => { e.target.style.display = 'none'; }}
//                       />
//                     ) : null}
//                     <span className="relative z-0">{user.name ? user.name[0].toUpperCase() : 'U'}</span>
//                   </div>
//                   <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block max-w-[100px] truncate">
//                     {user.name}
//                   </span>
//                 </button>

//                 {menuOpen && (
//                   <div className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} />
//                 )}

//                 {menuOpen && (
//                   <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
//                     <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
//                       <p className="text-xs text-gray-500 dark:text-gray-400">{t('loggedAs')}</p>
//                       <p className="font-bold text-gray-900 dark:text-white truncate text-sm">{user.name}</p>
//                     </div>

//                     {/* زر لوحة التحكم للمديرين */}
//                     {(user.is_staff || user.is_superuser) && (
//                       <Link
//                         href="/dashboard"
//                         onClick={() => setMenuOpen(false)}
//                         className="block px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-bold transition-colors border-b border-gray-100 dark:border-gray-700"
//                       >
//                         {t('dashboard')}
//                       </Link>
//                     )}

//                     <Link
//                       href="/profile"
//                       onClick={() => setMenuOpen(false)}
//                       className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
//                     >
//                       {t('profile')}
//                     </Link>

//                     <button
//                       onClick={() => { logout(); setMenuOpen(false); }}
//                       className="w-full text-right px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-sm transition-colors"
//                     >
//                       <FaSignOutAlt /> {t('logout')}
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="flex items-center gap-2">
//                 <button onClick={() => login()} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 font-medium text-sm hidden sm:block">
//                   {t('login')}
//                 </button>
//                 <button onClick={() => register()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
//                   {t('register')}
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* --- القائمة المنزلقة للبحث للجوال (Mobile Search Slide-Down) --- */}
//         {searchOpen && (
//           <div className="lg:hidden px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-300 w-full shadow-inner">
//             <SearchBar autoFocus />
//           </div>
//         )}

//         {/* --- القائمة المنزلقة للجوال (Mobile Nav Slide-Down) --- */}
//         {mobileMenuOpen && (
//           <div
//             className="md:hidden fixed inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-2xl py-6 px-4 flex flex-col gap-6 z-[49] animate-in slide-in-from-top-2 duration-300 overflow-y-auto"
//             style={{ top: '56px', maxHeight: 'calc(100vh - 56px)' }}
//           >
//             <nav className="flex flex-col gap-3">
//               {navItems.map((item, idx) => (
//                 <Link
//                   key={idx}
//                   href={item.path}
//                   onClick={() => setMobileMenuOpen(false)}
//                   className="block px-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors font-bold text-lg border border-gray-100 dark:border-gray-800/50"
//                 >
//                   {item.name}
//                 </Link>
//               ))}
//             </nav>

//             {/* Quick user actions on mobile */}
//             {user ? (
//               <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-col gap-2">
//                 <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-base transition-colors">
//                   👤 الملف الشخصي
//                 </Link>
//                 <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full text-right px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 font-bold text-base transition-colors">
//                   تسجيل الخروج
//                 </button>
//               </div>
//             ) : (
//               <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex gap-3">
//                 <button onClick={() => { login(); setMobileMenuOpen(false); }} className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-base">دخول</button>
//                 <button onClick={() => { register(); setMobileMenuOpen(false); }} className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-base shadow-lg">تسجيل</button>
//               </div>
//             )}
//           </div>
//         )}
//       </header>
//     </>
//   );
// }

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FaSun, FaMoon, FaSignOutAlt, FaBell, FaBars, FaTimes, FaSearch } from 'react-icons/fa';
import { SearchBar } from './SearchBar';
import { useNotifications } from '@/context/NotificationContext';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementToast } from './AchievementToast';
import { useLanguage } from '@/context/LanguageContext';

export function Header() {
  const { user, login, register, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  const { newUnlock, closeNotification } = useAchievements();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode') === 'true';
      setDarkMode(saved);
      document.documentElement.classList.toggle('dark', saved);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    document.documentElement.classList.toggle('dark', newMode);
  };

  const navItems = [
    { name: t('home'),          path: '/' },
    { name: t('browse'),        path: '/browse' },
    { name: t('latest'),        path: '/browse?sort=latest' },
    { name: t('popular'),       path: '/browse?sort=views' },
    { name: t('translate'),     path: '/translate' },
    { name: t('subscriptions'), path: '/subscriptions' },
  ];

  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path.split('?')[0]) && path !== '/';
  };

  return (
    <>
      <AchievementToast achievement={newUnlock} onClose={closeNotification} />

      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm border-b border-gray-100 dark:border-gray-800/50 sticky top-0 z-50 transition-colors duration-300">
        <div className="container mx-auto px-4 py-2.5 flex justify-between items-center gap-4 relative">

          {/* Logo + Nav */}
          <div className="flex items-center gap-3 flex-1">
            <button
              className="lg:hidden text-gray-600 dark:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>

            <Link href="/" className="text-xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent shrink-0 tracking-tight">
              MangaTK
            </Link>

            <nav className="hidden lg:flex items-center">
              <ul className="flex items-center gap-6">
                {navItems.map((item, idx) => {
                  const active = isActive(item.path);
                  return (
                    <li key={idx}>
                      <Link
                        href={item.path}
                        className={`text-sm font-medium transition-colors duration-200 relative pb-0.5 ${
                          active
                            ? 'text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-500 after:rounded-full'
                            : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* البحث */}
          <div className="flex-1 flex justify-end lg:justify-center mx-2 lg:mx-4">
            <div className="w-full max-w-md hidden lg:block">
              <SearchBar />
            </div>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0 ml-auto"
              aria-label="Search"
            >
              {searchOpen ? <FaTimes className="text-xl" /> : <FaSearch className="text-xl" />}
            </button>
          </div>

          {/* أدوات المستخدم */}
          <div className="flex items-center gap-3 md:gap-4 ml-2">
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
              {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon />}
            </button>

            {/* زر تبديل اللغة */}
            <button
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all tracking-wider"
              title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            >
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>

            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifMenuOpen(!notifMenuOpen);
                    if (!notifMenuOpen && unreadCount > 0) markAllAsRead();
                  }}
                  className="p-2 rounded-full relative hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <FaBell className="text-xl" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/4 bg-red-600 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setNotifMenuOpen(false)} />
                    <div className="absolute top-full -left-24 sm:-left-32 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 font-bold text-gray-800 dark:text-gray-200 flex justify-between items-center">
                        <span>{t('notifications')}</span>
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 15).map((n) => (
                            <Link
                              key={n.id}
                              href={n.link || '#'}
                              onClick={() => setNotifMenuOpen(false)}
                              className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                            >
                              <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{n.title}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{n.message}</div>
                            </Link>
                          ))
                        ) : (
                          <div className="px-6 py-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                            <FaBell className="text-gray-300 dark:text-gray-600 text-4xl mb-2" />
                            {t('noNotifs')}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all relative z-50"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold relative overflow-hidden">
                    {user.equipped_achievement_icon ? (
                      <img
                        src={user.equipped_achievement_icon}
                        alt="Achievement"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : null}
                    <span className="relative z-0">{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                  </div>

                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block max-w-[100px] truncate">
                    {user.name}
                  </span>
                </button>

                {menuOpen && (
                  <div className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} />
                )}

                {menuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('loggedAs')}</p>
                      <p className="font-bold text-gray-900 dark:text-white truncate text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{user.email}</p>
                    </div>

                    {(user.is_staff || user.is_superuser) && (
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-bold transition-colors border-b border-gray-100 dark:border-gray-700"
                      >
                        {t('dashboard')}
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
                    >
                      {t('profile')}
                    </Link>

                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="w-full text-right px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-sm transition-colors"
                    >
                      <FaSignOutAlt /> {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => login()} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 font-medium text-sm hidden sm:block">
                  {t('login')}
                </button>
                <button onClick={() => register()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
                  {t('register')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        {searchOpen && (
          <div className="lg:hidden px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-300 w-full shadow-inner">
            <SearchBar autoFocus />
          </div>
        )}

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-2xl py-6 px-4 flex flex-col gap-6 z-[49] animate-in slide-in-from-top-2 duration-300 overflow-y-auto"
            style={{ top: '56px', maxHeight: 'calc(100vh - 56px)' }}
          >
            <nav className="flex flex-col gap-3">
              {navItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors font-bold text-lg border border-gray-100 dark:border-gray-800/50"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {user ? (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-col gap-2">
                <div className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('loggedAs')}</p>
                  <p className="font-bold text-gray-900 dark:text-white mt-1 truncate">{user.name}</p>
                </div>

                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-base transition-colors">
                  👤 {t('profile')}
                </Link>

                {(user.is_staff || user.is_superuser) && (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-bold text-base transition-colors">
                    📊 {t('dashboard')}
                  </Link>
                )}

                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full text-right px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 font-bold text-base transition-colors">
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex gap-3">
                <button onClick={() => { login(); setMobileMenuOpen(false); }} className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-base">
                  {t('login')}
                </button>
                <button onClick={() => { register(); setMobileMenuOpen(false); }} className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-base shadow-lg">
                  {t('register')}
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}