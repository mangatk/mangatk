import { FaStar, FaRocket, FaCalendarAlt, FaLock } from 'react-icons/fa';
import AOS from 'aos';

export function QuickMenu() {
  const items = [
    { icon: FaStar, label: 'New Features', desc: 'Discover latest updates' },
    { icon: FaRocket, label: 'New Releases', desc: 'Fresh manga drops' },
    { icon: FaCalendarAlt, label: 'Events', desc: 'Join community events' },
    { icon: FaLock, label: 'Exclusive', desc: 'Premium content only' },
  ];

  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-800" data-aos="fade-up">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <div key={idx} className="text-center p-6 rounded-lg bg-white dark:bg-gray-700 shadow-md" data-aos="zoom-in" data-aos-delay={idx * 100}>
              <item.icon className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">{item.label}</h3>
              <p className="text-gray-600 dark:text-gray-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}