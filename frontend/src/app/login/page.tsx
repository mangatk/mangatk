'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// 1. استيراد السياق (Context)
import { useAuth } from '@/context/AuthContext';
import { FaEnvelope, FaLock, FaGoogle, FaArrowRight } from 'react-icons/fa';

export default function LoginPage() {
  const router = useRouter();

  // 2. استخراج دالة login من السياق
  const { login } = useAuth();

  // حالات لتخزين ما يكتبه المستخدم
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);

      if (result.success) {
        // Check for redirect parameter
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/';
        router.push(redirect);
      } else {
        setError(result.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900 transition-colors duration-300">

      {/* القسم الفني (صورة المانجا) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 scale-105"
          // تأكد من تغيير مسار الصورة إذا لم تكن موجودة
          style={{ backgroundImage: "url('/images/one-pice.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-transparent" />

        <div className="relative z-10 p-12 flex flex-col justify-between h-full text-white">
          <div>
            <h2 className="text-4xl font-bold mb-4">مرحباً بعودتك!</h2>
            <p className="text-lg text-gray-300 max-w-md">
              استكمل رحلتك في عالم المانجا. فصول جديدة بانتظارك ومكتبتك الخاصة مشتاقة إليك.
            </p>
          </div>
          <div className="text-sm text-gray-400">
            © 2024 MangaTK. جميع الحقوق محفوظة.
          </div>
        </div>
      </div>

      {/* نموذج تسجيل الدخول */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">تسجيل الدخول</h1>
            <p className="text-gray-500 dark:text-gray-400">
              ليس لديك حساب؟{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                أنشئ حساباً مجاناً
              </Link>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">

            {/* حقل البريد الإلكتروني */}
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
                  value={email} // ربط القيمة بالـ state
                  onChange={(e) => setEmail(e.target.value)} // تحديث الـ state عند الكتابة
                  placeholder="name@example.com"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* حقل كلمة المرور */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  كلمة المرور
                </label>
                <Link href="#" className="text-sm text-blue-600 hover:text-blue-500">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password} // ربط القيمة بالـ state
                  onChange={(e) => setPassword(e.target.value)} // تحديث الـ state عند الكتابة
                  placeholder="••••••••"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-center">
                {error}
              </div>
            )}

            {/* زر الدخول */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'تسجيل الدخول'
              )}
            </button>

            {/* فاصل "أو" */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">أو المتابعة عبر</span>
              </div>
            </div>

            {/* زر جوجل (شكلي حالياً) */}
            <button
              type="button"
              className="w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-white font-medium py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <FaGoogle className="text-red-500" />
              <span>Google</span>
            </button>
          </form>

          {/* رابط العودة */}
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