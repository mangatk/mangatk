// src/mocks/data/manga.ts
import { mockGenres } from './genres';
import { mockCategories } from './categories';

export const mockMangaList = [
    {
        id: 1,
        title: 'هجوم العمالقة',
        description: 'في عالم حيث تهاجم العمالقة البشرية، يجب على إرين وأصدقائه القتال من أجل البقاء',
        cover_image_url: 'https://i.ibb.co/placeholder1.jpg',
        banner_image_url: 'https://i.ibb.co/banner1.jpg',
        has_banner: true,
        chapter_count: 139,
        avg_rating: '4.8',
        views: 125000,
        author: 'هاجيمي إيساياما',
        status: 'completed',
        publish_date: '2009-09-09',
        last_updated: '2024-12-20T10:30:00Z',
        sub_titles: 'Attack on Titan; 進撃の巨人',
        is_featured: true,
        genres: [mockGenres[0], mockGenres[1], mockGenres[3]],
        category: mockCategories[0]
    },
    {
        id: 2,
        title: 'ون بيس',
        description: 'مغامرات مونكي دي لوفي وطاقمه في البحث عن الكنز الأسطوري',
        cover_image_url: 'https://i.ibb.co/placeholder2.jpg',
        banner_image_url: 'https://i.ibb.co/banner2.jpg',
        has_banner: true,
        chapter_count: 1100,
        avg_rating: '4.9',
        views: 250000,
        author: 'إيتشيرو أودا',
        status: 'ongoing',
        publish_date: '1997-07-22',
        last_updated: '2024-12-25T15:00:00Z',
        sub_titles: 'One Piece; ワンピース',
        is_featured: true,
        genres: [mockGenres[0], mockGenres[1], mockGenres[2]],
        category: mockCategories[0]
    },
    {
        id: 3,
        title: 'ناروتو',
        description: 'قصة ناروتو أوزوماكي الذي يحلم بأن يصبح هوكاجي القرية',
        cover_image_url: 'https://i.ibb.co/placeholder3.jpg',
        banner_image_url: null,
        has_banner: false,
        chapter_count: 700,
        avg_rating: '4.7',
        views: 180000,
        author: 'ماساشي كيشيموتو',
        status: 'completed',
        publish_date: '1999-09-21',
        last_updated: '2024-12-15T12:00:00Z',
        sub_titles: 'Naruto; NARUTO -ナルト-',
        is_featured: false,
        genres: [mockGenres[0], mockGenres[1], mockGenres[4]],
        category: mockCategories[0]
    },
    {
        id: 4,
        title: 'ذا بيننق أفتر ذا اند',
        description: 'بعد نهاية العالم، تبدأ حياة جديدة',
        cover_image_url: 'https://i.ibb.co/placeholder4.jpg',
        banner_image_url: 'https://i.ibb.co/banner4.jpg',
        has_banner: true,
        chapter_count: 85,
        avg_rating: '4.5',
        views: 45000,
        author: 'كيم كانغ',
        status: 'ongoing',
        publish_date: '2020-03-15',
        last_updated: '2024-12-24T09:00:00Z',
        sub_titles: 'The Beginning After The End',
        is_featured: true,
        genres: [mockGenres[0], mockGenres[4], mockGenres[7]],
        category: mockCategories[1]
    },
    {
        id: 5,
        title: 'سولو ليفلينغ',
        description: 'صياد الوحوش الضعيف يصبح أقوى صياد في العالم',
        cover_image_url: 'https://i.ibb.co/placeholder5.jpg',
        banner_image_url: 'https://i.ibb.co/banner5.jpg',
        has_banner: true,
        chapter_count: 179,
        avg_rating: '4.9',
        views: 300000,
        author: 'تشوجونج',
        status: 'completed',
        publish_date: '2018-03-04',
        last_updated: '2024-12-18T14:30:00Z',
        sub_titles: 'Solo Leveling; 나 혼자만 레벨업',
        is_featured: true,
        genres: [mockGenres[0], mockGenres[4], mockGenres[9]],
        category: mockCategories[1]
    },
    {
        id: 6,
        title: 'تاور أوف جود',
        description: 'صعود البرج للوصول إلى القمة',
        cover_image_url: 'https://i.ibb.co/placeholder6.jpg',
        banner_image_url: null,
        has_banner: false,
        chapter_count: 560,
        avg_rating: '4.6',
        views: 95000,
        author: 'SIU',
        status: 'ongoing',
        publish_date: '2010-06-30',
        last_updated: '2024-12-22T11:00:00Z',
        sub_titles: 'Tower of God; 신의 탑',
        is_featured: false,
        genres: [mockGenres[1], mockGenres[4], mockGenres[8]],
        category: mockCategories[3]
    },
    {
        id: 7,
        title: 'الكيميائي المعدني الكامل',
        description: 'رحلة الأخوين إلريك لاستعادة أجسادهم',
        cover_image_url: 'https://i.ibb.co/placeholder7.jpg',
        banner_image_url: 'https://i.ibb.co/banner7.jpg',
        has_banner: true,
        chapter_count: 108,
        avg_rating: '4.9',
        views: 142000,
        author: 'هيروموأراكاوا',
        status: 'completed',
        publish_date: '2001-07-12',
        last_updated: '2024-12-10T16:45:00Z',
        sub_titles: 'Fullmetal Alchemist; 鋼の錬金術師',
        is_featured: false,
        genres: [mockGenres[0], mockGenres[1], mockGenres[3], mockGenres[4]],
        category: mockCategories[0]
    },
    {
        id: 8,
        title: 'تشيت مان',
        description: 'في عالم ملئ بالقوى الخارقة، بطل بدون قوة',
        cover_image_url: 'https://i.ibb.co/placeholder8.jpg',
        banner_image_url: null,
        has_banner: false,
        chapter_count: 45,
        avg_rating: '4.3',
        views: 28000,
        author: 'لي وانغ',
        status: 'ongoing',
        publish_date: '2022-01-10',
        last_updated: '2024-12-26T08:00:00Z',
        sub_titles: 'Cheat Man; 치트맨',
        is_featured: false,
        genres: [mockGenres[0], mockGenres[2], mockGenres[7]],
        category: mockCategories[2]
    }
];

// Helper to create paginated response
export function createPaginatedMangaResponse(page = 1, pageSize = 20, filter?: any) {
    let filtered = [...mockMangaList];

    // Apply filters
    if (filter?.status && filter.status !== 'All') {
        filtered = filtered.filter(m => m.status === filter.status.toLowerCase());
    }

    if (filter?.category) {
        filtered = filtered.filter(m =>
            typeof m.category === 'object' ? m.category.slug === filter.category : m.category === filter.category
        );
    }

    if (filter?.search) {
        const search = filter.search.toLowerCase();
        filtered = filtered.filter(m =>
            m.title.toLowerCase().includes(search) ||
            m.description.toLowerCase().includes(search)
        );
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const results = filtered.slice(start, end);

    return {
        count: filtered.length,
        next: end < filtered.length ? `?page=${page + 1}` : null,
        previous: page > 1 ? `?page=${page - 1}` : null,
        results
    };
}

// Get featured manga
export function getFeaturedManga() {
    return mockMangaList.filter(m => m.is_featured);
}

// Get manga by ID
export function getMangaById(id: number) {
    const manga = mockMangaList.find(m => m.id === id);
    if (!manga) return null;

    // Add chapters to the response
    return {
        ...manga,
        chapters: [] // Will be populated from chapters.ts
    };
}
