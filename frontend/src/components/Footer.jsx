import Link from 'next/link';
import { FaInstagram } from 'react-icons/fa'; // Assuming react-icons is installed, fallback if not

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  // Simplified Arabic structure with correct routing links
  const footerSections = [
    {
      title: 'تصفح المانجا',
      links: [
        { label: 'قائمة المانجا', href: '/browse' },
        { label: 'أحدث الإضافات', href: '/latest' },
        { label: 'الأكثر شهرة', href: '/popular' }
      ]
    },
    {
      title: 'الدعم والمساعدة',
      links: [
        { label: 'تواصل معنا', href: '/contact' },
        { label: 'سياسة الخصوصية', href: '/privacy' },
        { label: 'شروط الخدمة', href: '/terms' }
      ]
    }
  ];

  return (
    <footer className="bg-gray-900 text-white py-6" data-aos="fade-up" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-12 md:gap-32 mb-8 text-center">
          {footerSections.map((section, index) => (
            <div key={section.title} data-aos="fade-up" data-aos-delay={index * 100}>
              <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2 inline-block shadow-sm px-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link 
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors block px-4 py-1 rounded-md hover:bg-gray-800"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-indigo-500 to-purple-500">
                MangaTK
              </h2>
              <p className="text-gray-400 mt-2 max-w-sm mx-auto">
                مرحبا بكم الى موقعنا نتمنى لكم تجربة مشاهدة وترجمة ممتعتين.
              </p>
            </div>
            
            <div className="flex items-center justify-center">
              <a 
                href="https://instagram.com/athadkun" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-pink-500 transition-colors flex items-center justify-center p-3 rounded-full hover:bg-gray-800 bg-gray-900 shadow border border-gray-800" 
                aria-label="Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span className="sr-only">Instagram @athadkun</span>
              </a>
            </div>
          </div>

          <div className="mt-6 text-gray-500 text-sm">
            <p>جميع الحقوق محفوظة &copy; {currentYear} MangaTK.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}