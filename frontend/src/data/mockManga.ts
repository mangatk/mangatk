// data/mockManga.ts

import { Manga } from '@/types/manga';

export const category = {
  'best-webtoon': {
    title: 'Best Webtoon',
    description: 'أفضل المانغا والويبتون حسب التقييمات'
  },
  'golden-week': {
    title: 'Golden Week',
    description: 'مانغا الأسبوع الذهبي الأكثر شهرة'
  },
  'new-releases': {
    title: 'New Releases',
    description: 'أحدث الإصدارات والمانغا الجديدة'
  },
  'action-fantasy': {
    title: 'Action & Fantasy',
    description: 'أقوى مانغا الأكشن والخيال'
  },
  'romance-drama': {
    title: 'Romance & Drama',
    description: 'أجمل قصص الرومانسية والدراما'
  }
};

// قائمة التصنيفات للفلتر
export const categories = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Martial Arts', 'Supernatural', 'Isekai', 'Historical'
];


export const mockManga: Manga[] = [
  {
    id: '1',
    title: 'One Piece',
    description: 'Adventure manga about pirates',
    imageUrl: '/images/one-pice.jpg', // تصحيح اسم الملف
    chapterCount: 1100,
    avgRating: 4.8,
    genres: ['Action', 'Adventure', 'Comedy'],
    status: 'ongoing',
    lastUpdated: '2024-01-01',
    author: 'Eiichiro Oda',
    views: 5000000,
    category: 'best-webtoon' // تصحيح التصنيف
  },
  {
    id: '2',
    title: 'Naruto',
    description: 'Ninja adventure story',
    imageUrl: '/images/naroto1.webp', // تصحيح اسم الملف
    chapterCount: 700, // تصحيح العدد
    avgRating: 4.7,
    genres: ['Action', 'Adventure', 'Fantasy'],
    status: 'completed',
    lastUpdated: '2023-12-01',
    author: 'Masashi Kishimoto',
    views: 4500000,
    category: 'best-webtoon'
  },
  {
    id: '3',
    title: 'Childhood Friend of the Zenith',
    description: 'Humanity fights giant humanoid creatures',
    imageUrl: '/images/ch.jpg',
    chapterCount: 139,
    avgRating: 3.9,
    genres: ['Action', 'Drama', 'Fantasy'],
    status: 'completed',
    lastUpdated: '2023-11-01',
    author: 'Hajime Isayama',
    views: 4000000,
    category: 'golden-week'
  },
  {
    id: '4',
    title: 'الخطايا السبع',
    description: 'Adventure manga about 7 deadly sins',
    imageUrl: '/images/mal.jpg',
    chapterCount: 400,
    avgRating: 4.5,
    genres: ['Action', 'Adventure', 'Comedy'],
    status: 'ongoing',
    lastUpdated: '2024-01-01',
    author: 'Eiichiro Oda',
    views: 5033,
    category: 'golden-week'
  },
  {
    id: '5',
    title: 'How to Get My Husband on My Side',
    description: 'Romance manhwa about lord of north',
    imageUrl: '/images/69.webp',
    chapterCount: 120,
    avgRating: 5,
    genres: ['Romance', 'Slice of Life', 'Comedy'],
    status: 'ongoing',
    lastUpdated: '2024-01-01',
    author: 'Eiichiro Oda',
    views: 5033,
    category: 'golden-week'
  },
  {
    id: '6',
    title: 'Naruto Shippuden',
    description: 'A young orphan ninja who seeks recognition from his peers and dreams of becoming the Hokage',
    imageUrl: '/images/naroto.jpg', // تصحيح اسم الملف
    chapterCount: 700,
    avgRating: 4.8,
    genres: ['Adventure', 'Action', 'Comedy', 'Fantasy'],
    status: 'ongoing',
    lastUpdated: '2024-01-01',
    author: 'Masashi Kishimoto',
    views: 9539, // إضافة فاصلة
    category: 'golden-week'
  },
  // {
  //   id: '7', // تغيير ID لتجنب التكرار
  //   title: 'Attack on Titan',
  //   description: 'معركة البشر ضد العمالقة العملاقة',
  //   imageUrl: '/images/aot.jpg',
  //   chapterCount: 139,
  //   avgRating: 4.9,
  //   genres: ['Action', 'Drama', 'Fantasy'],
  //   status: 'completed',
  //   lastUpdated: '2023-11-01',
  //   author: 'Hajime Isayama',
  //   views: 4000000,
  //   category: 'golden-week'
  // },
  // {
  //   id: '8',
  //   title: 'Demon Slayer',
  //   description: 'قصة الصبي الذي يصبح صائد شياطين لينقذ أخته',
  //   imageUrl: '/images/demon-slayer.jpg',
  //   chapterCount: 205,
  //   avgRating: 4.8,
  //   genres: ['Action', 'Supernatural', 'Fantasy'],
  //   status: 'completed',
  //   lastUpdated: '2024-01-10',
  //   author: 'Koyoharu Gotouge',
  //   views: 3500000,
  //   category: 'golden-week'
  // },
  // {
  //   id: '9',
  //   title: 'My Hero Academia',
  //   description: 'في عالم الأبطال الخارقين، شاب بلا قدرات يحلم بأن يصبح بطلاً',
  //   imageUrl: '/images/my-hero.jpg',
  //   chapterCount: 410,
  //   avgRating: 4.6,
  //   genres: ['Action', 'Superhero', 'School'],
  //   status: 'ongoing',
  //   lastUpdated: '2024-01-12',
  //   author: 'Kohei Horikoshi',
  //   views: 3000000,
  //   category: 'new-releases'
  // },
  // {
  //   id: '10',
  //   title: 'Jujutsu Kaisen',
  //   description: 'معركة ضد اللعنات باستخدام تقنيات الجوجوتسو',
  //   imageUrl: '/images/jujutsu.jpg',
  //   chapterCount: 250,
  //   avgRating: 4.7,
  //   genres: ['Action', 'Supernatural', 'Horror'],
  //   status: 'ongoing',
  //   lastUpdated: '2024-01-14',
  //   author: 'Gege Akutami',
  //   views: 3200000,
  //   category: 'new-releases',
  // },
  {
    id: '11',
    title: 'Escort Warrior',
    description: 'محارب مرافق يحمي الضعفاء في عالم مليء بالمخاطر والأعداء الأقوياء',
    imageUrl: '/images/Escort Warrior.jpg',
    chapterCount: 78,
    avgRating: 4.3,
    genres: ['Action', 'Adventure', 'Martial Arts'],
    status: 'ongoing',
    lastUpdated: '2024-01-15',
    author: 'Lee Hwa',
    views: 1850000,
    category: 'action-fantasy',
  },
  {
    id: '12',
    title: 'Heavenly Inquisition Sword',
    description: 'سيف التحقيق السماوي الذي يبحث عن الحقيقة وينصف المظلومين',
    imageUrl: '/images/Heavenly Inquisition Sword.jpg',
    chapterCount: 120,
    avgRating: 4.6,
    genres: ['Action', 'Fantasy', 'Supernatural'],
    status: 'ongoing',
    lastUpdated: '2024-01-14',
    author: 'Zhang Wei',
    views: 2450000,
    category: 'action-fantasy',
  },
  {
    id: '13',
    title: 'Heavenly Demon Cultivation Simulation',
    description: 'محاكاة لطريق الشيطان السماوي في عالم cultivation الفريد',
    imageUrl: '/images/Heavenly Demon Cultivation Simulation.jpg',
    chapterCount: 95,
    avgRating: 4.4,
    genres: ['Fantasy', 'Action', 'Supernatural'],
    status: 'ongoing',
    lastUpdated: '2024-01-13',
    author: 'Ming Yu',
    views: 2100000,
    category: 'action-fantasy',
  },
  {
    id: '14',
    title: 'Infinite Level up in Murim',
    description: 'صعود لا نهائي في عالم المريام مع نظام leveling فريد',
    imageUrl: '/images/Infinite Level up in Murim.jpg',
    chapterCount: 150,
    avgRating: 4.8,
    genres: ['Action', 'Martial Arts', 'Fantasy'],
    status: 'ongoing',
    lastUpdated: '2024-01-16',
    author: 'Jin Yong',
    views: 3200000,
    category: 'best-webtoon',
  },
  {
    id: '15',
    title: 'I Will Seduce The Northern Duke',
    description: 'قصة فتاة عازمة على إغواء دوق الشمال البارد والغامض',
    imageUrl: '/images/I Will Seduce The Northern Duke.jpg',
    chapterCount: 65,
    avgRating: 4.2,
    genres: ['Romance', 'Drama', 'Fantasy'],
    status: 'ongoing',
    lastUpdated: '2024-01-12',
    author: 'Luna Rose',
    views: 1680000,
    category: 'romance-drama',
  },
  {
    id: '16',
    title: 'Reincarnation of the Suicidal Battle God',
    description: 'إعادة تجسد إله المعركة الانتحاري في عالم جديد',
    imageUrl: '/images/Reincarnation of the Suicidal Battle God.jpg',
    chapterCount: 85,
    avgRating: 4.7,
    genres: ['Action', 'Fantasy', 'Supernatural'],
    status: 'ongoing',
    lastUpdated: '2024-01-15',
    author: 'Thor Odinson',
    views: 2780000,
    category: 'golden-week',
  },
  {
    id: '17',
    title: 'The Beginning After The End',
    description: 'البداية بعد النهاية، رحلة ملك في عالم جديد',
    imageUrl: '/images/The Beginning After The End.jpg',
    chapterCount: 180,
    avgRating: 4.9,
    genres: ['Fantasy', 'Action', 'Adventure'],
    status: 'ongoing',
    lastUpdated: '2024-01-17',
    author: 'TurtleMe',
    views: 4500000,
    category: 'best-webtoon',
  },
  {
    id: '18',
    title: 'Terminally-Ill Genius Dark Knight',
    description: 'فارس الظلام العبقري المصاب بمرض عضال في رحلته الأخيرة',
    imageUrl: '/images/Terminally-Ill Genius Dark Knight.jpg',
    chapterCount: 72,
    avgRating: 4.5,
    genres: ['Action', 'Drama', 'Fantasy'],
    status: 'ongoing',
    lastUpdated: '2024-01-11',
    author: 'Arthur Black',
    views: 1950000,
    category: 'action-fantasy',
  },
  {
    id: '19',
    title: 'Weak Teacher',
    description: 'معلم ضعيف يحاول إثبات نفسه في عالم قاسي من الأقوياء',
    imageUrl: '/images/Weak Teacher.jpg',
    chapterCount: 58,
    avgRating: 4.1,
    genres: ['Comedy', 'Drama', 'Slice of Life'],
    status: 'ongoing',
    lastUpdated: '2024-01-10',
    author: 'Park Min Ho',
    views: 1420000,
    category: 'new-releases',
  },
  {
    id: '20',
    title: 'Warrior Grandpa and Supreme Granddaughter',
    description: 'جندي عجوز وحفيدته المتفوقة في مغامرات مثيرة',
    imageUrl: '/images/Warrior Grandpa and Supreme Granddaughter.jpg',
    chapterCount: 45,
    avgRating: 4.0,
    genres: ['Comedy', 'Action', 'Slice of Life'],
    status: 'ongoing',
    lastUpdated: '2024-01-09',
    author: 'Kim Ji Hoon',
    views: 1280000,
    category: 'new-releases',
  },
  {
    id: '21',
    title: 'Under the Oak Tree',
    description: 'قصة حب تحت شجرة البلوط، رومانسية مؤثرة ودرامية',
    imageUrl: '/images/Under the Oak Tree.jpg',
    chapterCount: 110,
    avgRating: 4.6,
    genres: ['Romance', 'Drama', 'Historical'],
    status: 'ongoing',
    lastUpdated: '2024-01-14',
    author: 'Kim Suji',
    views: 2650000,
    category: 'romance-drama',
  },
  {
    id: '22',
    title: 'The Extra\'s Academy Survival Guide',
    description: 'دليل البقاء للأشخاص الإضافيين في أكاديمية مليئة بالمخاطر',
    imageUrl: '/images/The Extra’s Academy Survival Guide.jpg',
    chapterCount: 88,
    avgRating: 4.4,
    genres: ['Comedy', 'Fantasy', 'Adventure'],
    status: 'ongoing',
    lastUpdated: '2024-01-13',
    author: 'Extra Writer',
    views: 1980000,
    category: 'new-releases',
  }
];
export const getMangaByCategory = (category: string): Manga[] => {
  return mockManga.filter(manga => manga.category === category);
};

export const getMangaByGenre = (genre: string): Manga[] => {
  return mockManga.filter(manga => manga.genres.includes(genre));
};

export const searchManga = (query: string): Manga[] => {
  const lowerQuery = query.toLowerCase();
  return mockManga.filter(manga => 
    manga.title.toLowerCase().includes(lowerQuery) ||
    manga.author.toLowerCase().includes(lowerQuery) ||
    manga.genres.some(genre => genre.toLowerCase().includes(lowerQuery)) ||
    manga.description.toLowerCase().includes(lowerQuery)
  );
};

export const getFeaturedManga = (): Manga[] => {
  return mockManga.filter(manga => manga.avgRating >= 4.5).slice(0, 5);
};