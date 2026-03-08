import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-16 bg-blue-600 text-white" data-aos="fade-up">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Join Our Manga Community</h2>
        <p className="text-xl mb-8 opacity-90">
          Discover thousands of manga titles, track your reading progress, and connect with fellow fans
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => login()} className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg shadow-black/10">
            ابدأ القراءة الآن
          </button>
          <button onClick={() => login()} className="text-blue-100 hover:text-white transition-colors">
            لديك حساب بالفعل؟ <span className="underline hover:no-underline font-bold">تسجيل الدخول</span>
          </button>
        </div>
      </div>
    </section>
  );
}