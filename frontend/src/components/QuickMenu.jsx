import Link from 'next/link';
import { FaStar, FaRocket, FaCalendarAlt, FaLock } from 'react-icons/fa';
import AOS from 'aos';

export function QuickMenu() {
  const items = [
    { icon: FaStar, label: 'New Features', desc: 'Discover latest updates', href: '#' },
    { icon: FaRocket, label: 'New Releases', desc: 'Fresh manga drops', href: '/category/new-releases' },
    { icon: FaCalendarAlt, label: 'Events', desc: 'Join community events', href: '#' },
    { icon: FaLock, label: 'Exclusive', desc: 'Premium content only', href: '#' },
  ];

  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-800" data-aos="fade-up">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {items.map((item, idx) => (
            <Link 
              key={idx} 
              href={item.href}
              className="group text-center py-4 px-2 sm:p-6 rounded-2xl bg-white dark:bg-gray-700 shadow-sm sm:shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-600/50" 
              data-aos="zoom-in" 
              data-aos-delay={idx * 100}
            >
              <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <item.icon className="text-xl sm:text-3xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xs sm:text-xl font-bold mb-1 sm:mb-2 text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate w-full px-1">{item.label}</h3>
              <p className="text-xs sm:text-base text-gray-500 dark:text-gray-400 leading-tight hidden sm:block">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}