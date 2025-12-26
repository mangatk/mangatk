import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-16 bg-blue-600 text-white" data-aos="fade-up">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Join Our Manga Community</h2>
        <p className="text-xl mb-8 opacity-90">
          Discover thousands of manga titles, track your reading progress, and connect with fellow fans
        </p>
        <Link 
          href="/register" 
          className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors duration-300 inline-block"
          aria-label="Register for MangaTK account"
        >
          Join Now - It's Free!
        </Link>
        <p className="mt-4 text-sm opacity-80">
          Already have an account?{' '}
          <Link href="/login" className="underline hover:no-underline">
            Sign in here
          </Link>
        </p>
      </div>
    </section>
  );
}