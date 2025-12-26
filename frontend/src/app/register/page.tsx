'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // التحقق من تطابق كلمة المرور
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    // التحقق من طول كلمة المرور
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      const result = await register(username, email, password);

      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'فشل إنشاء الحساب');
      }
    } catch (err) {
      setError('حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900 transition-colors duration-300">

      {/* 1. النصف الفني */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 scale-105"
          style={{ backgroundImage: "url('/images/naroto.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-transparent" />

        <div className="relative z-10 p-12 flex flex-col justify-between h-full text-white">
          <div>
            <h2 className="text-4xl font-bold mb-4">انضم لعائلة MangaTK</h2>
            <p className="text-lg text-gray-300 max-w-md">
              أنشئ حسابك المجاني اليوم واحصل على ميزات حصرية، تتبع قراءاتك، وتفاعل مع مجتمع المانجا.
            </p>
          </div>
          <div className="text-sm text-gray-400">
            © 2024 MangaTK. جميع الحقوق محفوظة.
          </div>
        </div>
      </div>

      {/* 2. نموذج التسجيل */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">إنشاء حساب جديد</h1>
            <p className="text-gray-500 dark:text-gray-400">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                تسجيل الدخول
              </Link>
            </p>
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">

            {/* الاسم */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                اسم المستخدم
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="OtakuKing"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* البريد */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* تأكيد كلمة المرور */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* الشروط */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="mr-2 block text-sm text-gray-500 dark:text-gray-400">
                أوافق على <Link href="/terms" className="text-blue-600 hover:underline">شروط الخدمة</Link> و <Link href="/privacy" className="text-blue-600 hover:underline">سياسة الخصوصية</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'إنشاء الحساب'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <FaArrowRight className="ml-2" /> العودة للصفحة الرئيسية
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
