'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { FaShieldAlt } from 'react-icons/fa';

export default function PrivacyPolicyPage() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header />

      <section className="relative bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-6 shadow-lg">
            <FaShieldAlt className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
            {ar ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto">
            {ar
              ? 'نهتم بخصوصيتك ونحرص على حماية بياناتك.'
              : 'We care about your privacy and are committed to protecting your data.'}
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 prose dark:prose-invert prose-blue">
          {ar ? (
            <div dir="rtl">
              <p>تاريخ سريان المفعول: [تاريخ اليوم]</p>
              
              <h2>1. المعلومات التي نجمعها</h2>
              <p>
                نحن في MangaTK لا نقوم بتتبع نشاطك خارج الموقع ولا نستخدم أدوات تحليل تابعة لطرف ثالث مثل Google Analytics. 
                المعلومات التي نجمعها تقتصر فقط على ما تقدمه أنت عند إنشاء الحساب (مثل اسم المستخدم والبريد الإلكتروني)، 
                وهي ضرورية لتوفير ميزات مخصصة لك مثل قائمة المفضلة وقدرتك على استخدام أدوات الترجمة.
              </p>

              <h2>2. كيف نستخدم معلوماتك</h2>
              <p>
                يتم استخدام بياناتك فقط لضمان عمل حسابك بشكل صحيح وتقديم الخدمات التي طلبتها (مثل حفظ مفضلتك أو السماح لك بالترجمة).
              </p>

              <h2>3. مشاركة المعلومات</h2>
              <p>
                نحن لا نشارك، أو نبيع، أو نؤجر معلوماتك الشخصية مع أي أطراف ثالثة لأغراض تسويقية أو غيرها. بياناتك محفوظة بأمان وللغرض المذكور فقط.
              </p>

              <h2>4. العمر المسموح به</h2>
              <p>
                يجب ألا يقل عمر المستخدم لإنشاء حساب في موقعنا عن 13 عاماً. إذا اكتشفنا أن مستخدماً يقل عمره عن 13 عاماً قد قام بإنشاء حساب، فسنقوم باتخاذ الإجراءات اللازمة لحذف الحساب.
              </p>

              <h2>5. حذف الحساب والبيانات</h2>
              <p>
                يمكنك تسجيل الخروج من خيارات حسابك في أي وقت. ومع ذلك، إذا كنت ترغب في حذف حسابك بشكل كامل ومسح جميع بياناتك المرتبطة به من خوادمنا، يرجى التواصل معنا عبر البريد الإلكتروني <a href="mailto:tkmanga9@gmail.com">tkmanga9@gmail.com</a> والتطرق لطلب الحذف.
              </p>

              <h2>6. التعديلات على سياسة الخصوصية</h2>
              <p>
                قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. يُنصح بمراجعتها بشكل دوري لأي تغييرات.
              </p>
            </div>
          ) : (
            <div dir="ltr">
              <p>Effective Date: [Today's Date]</p>
              
              <h2>1. Information We Collect</h2>
              <p>
                At MangaTK, we do not track your activity across other sites or use third-party analytics tools like Google Analytics. 
                The information we collect is limited to what you provide when creating an account (such as username and email), 
                which is necessary to offer personalized features like your favorites list and the ability to use translation tools.
              </p>

              <h2>2. How We Use Your Information</h2>
              <p>
                Your data is used solely to ensure your account functions correctly and to provide the services you have requested (such as saving your favorites or allowing you to translate).
              </p>

              <h2>3. Information Sharing</h2>
              <p>
                We do not share, sell, or rent your personal information to any third parties for marketing or any other purposes. Your data is kept secure and is used only for the stated purposes.
              </p>

              <h2>4. Age Requirement</h2>
              <p>
                You must be at least 13 years old to create an account on our site. If we discover that a user under the age of 13 has created an account, we will take appropriate action to delete the account.
              </p>

              <h2>5. Account and Data Deletion</h2>
              <p>
                You can log out from your account options at any time. However, if you wish to completely delete your account and remove all associated data from our servers, please contact us via email at <a href="mailto:tkmanga9@gmail.com">tkmanga9@gmail.com</a> to request account deletion.
              </p>

              <h2>6. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. You are advised to review it periodically for any changes.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
