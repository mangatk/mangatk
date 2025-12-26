'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FaSun, FaMoon, FaSignOutAlt } from 'react-icons/fa';
import { SearchBar } from './SearchBar';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementToast } from './AchievementToast';

export function Header() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // 🟢 تعريف روابط القائمة هنا
  const navItems = [
    { name: 'الرئيسية', path: '/' },
    { name: 'قائمة المانجا', path: '/browse' }, // ✅ تم الربط هنا
    { name: 'الأحدث', path: '/browse' },        // يمكن توجيهها للفلترة مستقبلاً
    { name: 'التصنيفات', path: '/browse' }      // يمكن توجيهها لصفحة التصنيفات
  ];

  return (
    <>
      <AchievementToast achievement={newUnlock} onClose={closeNotification} />

      <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-colors duration-300">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-4">

          {/* الشعار والقوائم */}
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="/" className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MangaTK
            </Link>
            <nav className="hidden md:block">
              <ul className="flex space-x-6 space-x-reverse font-medium">
                {/* 🟢 استخدام navItems للرسم */}
                {navItems.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      href={item.path}
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* البحث */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <SearchBar />
          </div>

          {/* أدوات المستخدم */}
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
              {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all relative z-50"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block max-w-[100px] truncate">
                    {user.name}
                  </span>
                </button>

                {menuOpen && (
                  <div className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} />
                )}

                {menuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400">مسجل باسم</p>
                      <p className="font-bold text-gray-900 dark:text-white truncate text-sm">{user.email}</p>
                    </div>

                    {/* زر لوحة التحكم للمديرين */}
                    {(user.is_staff || user.is_superuser) && (
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-bold transition-colors border-b border-gray-100 dark:border-gray-700"
                      >
                        🎛️ لوحة التحكم
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
                    >
                      الملف الشخصي
                    </Link>

                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="w-full text-right px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-sm transition-colors"
                    >
                      <FaSignOutAlt /> تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 font-medium text-sm hidden sm:block">
                  دخول
                </Link>
                <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
                  تسجيل
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}