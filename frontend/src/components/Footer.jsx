import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerSections = [
    {
      title: 'About',
      links: ['About Us', 'Team', 'Careers', 'Press']
    },
    {
      title: 'Browse',
      links: ['Manga List', 'Latest Updates', 'Popular', 'Categories']
    },
    {
      title: 'Community',
      links: ['Forums', 'Discord', 'Events', 'Blog']
    },
    {
      title: 'Support',
      links: ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service']
    }
  ];

  return (
    <footer className="bg-gray-900 text-white py-12" data-aos="fade-up">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section, index) => (
            <div key={section.title} data-aos="fade-up" data-aos-delay={index * 100}>
              <h3 className="text-lg font-bold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link}>
                    <Link 
                      href={`/${link.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-8 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold">MangaTK</h2>
              <p className="text-gray-400 mt-2">Your ultimate manga reading experience</p>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                Facebook
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                Twitter
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                Instagram
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Discord">
                Discord
              </a>
            </div>
          </div>

          <div className="mt-8 text-gray-400">
            <p>&copy; {currentYear} MangaTK. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}