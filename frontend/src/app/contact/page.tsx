'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { FaEnvelope, FaInstagram, FaClock, FaHeadset } from 'react-icons/fa';

export default function ContactPage() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-6 shadow-lg">
            <FaHeadset className="text-white text-2xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            {ar ? 'تواصل معنا' : 'Contact Us'}
          </h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto">
            {ar
              ? 'نحن هنا لمساعدتك. لا تتردد في التواصل معنا بأي وقت.'
              : "We're here to help. Don't hesitate to reach out at any time."}
          </p>
        </div>
      </section>

      {/* Cards */}
      <main className="container mx-auto px-4 py-16 flex-1">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Email Card */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-6 shadow-md group-hover:scale-105 transition-transform duration-300">
              <FaEnvelope className="text-white text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {ar ? 'البريد الإلكتروني' : 'Email'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
              {ar
                ? 'أرسل لنا رسالة مباشرة وسنرد عليك في أقرب وقت ممكن.'
                : 'Send us a message directly and we will get back to you as soon as possible.'}
            </p>
            <a
              href="mailto:tkmanga9@gmail.com"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 text-sm shadow-md shadow-blue-500/20"
            >
              <FaEnvelope className="text-xs" />
              tkmanga9@gmail.com
            </a>
          </div>

          {/* Instagram Card */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center mb-6 shadow-md group-hover:scale-105 transition-transform duration-300">
              <FaInstagram className="text-white text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Instagram
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
              {ar
                ? 'تابعنا على إنستغرام للبقاء على اطلاع بآخر التحديثات والأخبار.'
                : 'Follow us on Instagram to stay updated with the latest news and updates.'}
            </p>
            <a
              href="https://instagram.com/mangatk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 text-sm shadow-md shadow-pink-500/20"
            >
              <FaInstagram className="text-xs" />
              @mangatk
            </a>
          </div>

          {/* Response time banner */}
          <div className="md:col-span-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/30 p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
              <FaClock className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                {ar ? 'وقت الاستجابة' : 'Response Time'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {ar
                  ? 'نحرص على الرد على جميع الرسائل في أسرع وقت ممكن. قد يمتد وقت الرد أحياناً بسبب الطاقة الاستيعابية.'
                  : 'We strive to respond to all messages as quickly as possible. Response times may vary depending on our capacity.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
