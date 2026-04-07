'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { FaFileContract } from 'react-icons/fa';

export default function TermsOfServicePage() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header />

      <section className="relative bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-6 shadow-lg">
            <FaFileContract className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
            {ar ? 'شروط الخدمة' : 'Terms of Service'}
          </h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto">
            {ar
              ? 'يرجى قراءة هذه الشروط بعناية قبل استخدام موقعنا.'
              : 'Please read these terms carefully before using our website.'}
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 prose dark:prose-invert prose-blue">
          {ar ? (
            <div dir="rtl">
              <p>تاريخ سريان المفعول: [تاريخ اليوم]</p>
              
              <h2>1. قبول الشروط</h2>
              <p>
                بوصولك للموقع واستخدامه، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على أي جزء من الشروط، فلا يحق لك الوصول إلى الخدمة.
              </p>

              <h2>2. الخدمات والاشتراكات</h2>
              <p>
                حاليًا، توفر MangaTK خدماتها ومحتوياتها مجانًا للمستخدمين. في المستقبل، سيتم تنفيذ نظام اشتراكات لتوفير ميزات متقدمة مثل الترجمة. نحتفظ بالحق في تعديل أو تعليق أو إيقاف أي جزء من الخدمة في أي وقت.
              </p>

              <h2>3. المحتوى وحقوق النشر</h2>
              <p>
                المحتوى (المانجا/الكوميكس) المرفوع على الموقع ليس بترخيص تجاري رسمي كمعظم المواقع، بل يتم رفعه مجاناً وبموافقة من المخرج أو المبدع الأصلي أو بناءً على نشرهم له بشكل مجاني وعام. نحن لا ندعي ملكية هذا المحتوى.
              </p>

              <h2>4. مسؤوليات المستخدم</h2>
              <p>
                - المحتوى مرفوع بواسطة الإدارة فقط، ولا تتوفر ميزة رفع المحتوى للمستخدمين العاديين.<br />
                - يُحظر استخدام الموقع لأي غرض غير قانوني أو غير مصرح به.<br />
                - أنت مسؤول عن الحفاظ على أمان حسابك وكلمة المرور الخاصة بك.
              </p>

              <h2>5. إنهاء الخدمة والحظر</h2>
              <p>
                نمتلك الحق في تعليق أو حظر وإنهاء وصولك إلى حسابك فوراً، دون إشعار مسبق أو مسؤولية، إذا قمت بانتهاك قواعد وشروط الخدمة.
              </p>

              <h2>6. إخلاء المسؤولية</h2>
              <p>
                يتم تقديم الخدمة "كما هي" دون أي ضمانات من أي نوع. التصفح واستخدام محتوى الموقع يكون على مسؤوليتك الخاصة.
              </p>

              <h2>7. التعديل على الشروط</h2>
              <p>
                يحتفظ الموقع بالحق في تعديل هذه الشروط في أي وقت. ستسري الشروط المعدلة بمجرد نشرها على هذه الصفحة.
              </p>
            </div>
          ) : (
            <div dir="ltr">
              <p>Effective Date: [Today's Date]</p>
              
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using this site, you agree to be bound by these Terms of Service. If you disagree with any part of the terms then you may not access the Service.
              </p>

              <h2>2. Services and Subscriptions</h2>
              <p>
                Currently, MangaTK provides its content and services for free. In the future, subscription plans will be introduced for advanced features such as translation services. We reserve the right to modify, suspend, or discontinue any part of the service at any time.
              </p>

              <h2>3. Content and Copyright</h2>
              <p>
                The content (manga/comics) hosted on this site is not officially commercially licensed in the traditional sense, but is rather uploaded for free either directly by the original creator/director or based on their free public distribution. We do not claim ownership of this content.
              </p>

              <h2>4. User Responsibilities</h2>
              <p>
                - Content upload is restricted to the administration only; users do not have the ability to upload content.<br />
                - You may not use the Service for any illegal or unauthorized purpose.<br />
                - You are responsible for safeguarding the password that you use to access your account.
              </p>

              <h2>5. Termination and Bans</h2>
              <p>
                We may terminate, ban, or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms of Service.
              </p>

              <h2>6. Disclaimer</h2>
              <p>
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. Your use of the Service is at your sole risk.
              </p>

              <h2>7. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. The updated terms will be effective as soon as they are posted on this page.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
