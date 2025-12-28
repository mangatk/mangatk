// src/mocks/data/chapters.ts
export const mockChapters = [
    // Attack on Titan chapters (manga_id: 1)
    {
        id: 1,
        manga_id: 1,
        manga_title: 'هجوم العمالقة',
        title: 'إلى أنت، بعد ألفي عام',
        number: '1',
        release_date: '2009-09-09',
        views: 15000,
        images: [
            { id: 1, image_url: 'https://i.ibb.co/ch1-p1.jpg', page_number: 1, width: 800, height: 1200 },
            { id: 2, image_url: 'https://i.ibb.co/ch1-p2.jpg', page_number: 2, width: 800, height: 1200 },
            { id: 3, image_url: 'https://i.ibb.co/ch1-p3.jpg', page_number: 3, width: 800, height: 1200 },
            { id: 4, image_url: 'https://i.ibb.co/ch1-p4.jpg', page_number: 4, width: 800, height: 1200 },
            { id: 5, image_url: 'https://i.ibb.co/ch1-p5.jpg', page_number: 5, width: 800, height: 1200 }
        ],
        prev_chapter_id: null,
        next_chapter_id: 2
    },
    {
        id: 2,
        manga_id: 1,
        manga_title: 'هجوم العمالقة',
        title: 'ذلك اليوم',
        number: '2',
        release_date: '2009-09-23',
        views: 14500,
        images: [
            { id: 6, image_url: 'https://i.ibb.co/ch2-p1.jpg', page_number: 1, width: 800, height: 1200 },
            { id: 7, image_url: 'https://i.ibb.co/ch2-p2.jpg', page_number: 2, width: 800, height: 1200 },
            { id: 8, image_url: 'https://i.ibb.co/ch2-p3.jpg', page_number: 3, width: 800, height: 1200 },
            { id: 9, image_url: 'https://i.ibb.co/ch2-p4.jpg', page_number: 4, width: 800, height: 1200 }
        ],
        prev_chapter_id: 1,
        next_chapter_id: 3
    },
    {
        id: 3,
        manga_id: 1,
        manga_title: 'هجوم العمالقة',
        title: 'ضوء الليل',
        number: '3',
        release_date: '2009-10-07',
        views: 14000,
        images: [
            { id: 10, image_url: 'https://i.ibb.co/ch3-p1.jpg', page_number: 1, width: 800, height: 1200 },
            { id: 11, image_url: 'https://i.ibb.co/ch3-p2.jpg', page_number: 2, width: 800, height: 1200 },
            { id: 12, image_url: 'https://i.ibb.co/ch3-p3.jpg', page_number: 3, width: 800, height: 1200 }
        ],
        prev_chapter_id: 2,
        next_chapter_id: null
    },
    // One Piece chapters (manga_id: 2)
    {
        id: 4,
        manga_id: 2,
        manga_title: 'ون بيس',
        title: 'رومانس داون',
        number: '1',
        release_date: '1997-07-22',
        views: 25000,
        images: [
            { id: 13, image_url: 'https://i.ibb.co/op-ch1-p1.jpg', page_number: 1, width: 800, height: 1200 },
            { id: 14, image_url: 'https://i.ibb.co/op-ch1-p2.jpg', page_number: 2, width: 800, height: 1200 },
            { id: 15, image_url: 'https://i.ibb.co/op-ch1-p3.jpg', page_number: 3, width: 800, height: 1200 },
            { id: 16, image_url: 'https://i.ibb.co/op-ch1-p4.jpg', page_number: 4, width: 800, height: 1200 },
            { id: 17, image_url: 'https://i.ibb.co/op-ch1-p5.jpg', page_number: 5, width: 800, height: 1200 },
            { id: 18, image_url: 'https://i.ibb.co/op-ch1-p6.jpg', page_number: 6, width: 800, height: 1200 }
        ],
        prev_chapter_id: null,
        next_chapter_id: 5
    },
    {
        id: 5,
        manga_id: 2,
        manga_title: 'ون بيس',
        title: 'ذلك الرجل "سوبنتاب"',
        number: '2',
        release_date: '1997-08-04',
        views: 24500,
        images: [
            { id: 19, image_url: 'https://i.ibb.co/op-ch2-p1.jpg', page_number: 1, width: 800, height: 1200 },
            { id: 20, image_url: 'https://i.ibb.co/op-ch2-p2.jpg', page_number: 2, width: 800, height: 1200 },
            { id: 21, image_url: 'https://i.ibb.co/op-ch2-p3.jpg', page_number: 3, width: 800, height: 1200 }
        ],
        prev_chapter_id: 4,
        next_chapter_id: null
    },
    // Solo Leveling chapters (manga_id: 5)
    {
        id: 6,
        manga_id: 5,
        manga_title: 'سولو ليفلينغ',
        title: 'أنا وحدي أرتقي',
        number: '1',
        release_date: '2018-03-04',
        views: 35000,
        images: [
            { id: 22, image_url: 'https://i.ibb.co/sl-ch1-p1.jpg', page_number: 1, width: 800, height: 1200 },
            { id: 23, image_url: 'https://i.ibb.co/sl-ch1-p2.jpg', page_number: 2, width: 800, height: 1200 },
            { id: 24, image_url: 'https://i.ibb.co/sl-ch1-p3.jpg', page_number: 3, width: 800, height: 1200 },
            { id: 25, image_url: 'https://i.ibb.co/sl-ch1-p4.jpg', page_number: 4, width: 800, height: 1200 }
        ],
        prev_chapter_id: null,
        next_chapter_id: 7
    },
    {
        id: 7,
        manga_id: 5,
        manga_title: 'سولو ليفلينغ',
        title: 'البداية',
        number: '2',
        release_date: '2018-03-11',
        views: 34000,
        images: [
            { id: 26, image_url: 'https://i.ibb.co/sl-ch2-p1.jpg', page_number: 1, width: 800, height: 1200 },
            { id: 27, image_url: 'https://i.ibb.co/sl-ch2-p2.jpg', page_number: 2, width: 800, height: 1200 }
        ],
        prev_chapter_id: 6,
        next_chapter_id: null
    }
];

// Get chapters by manga ID
export function getChaptersByMangaId(mangaId: number) {
    return mockChapters.filter(ch => ch.manga_id === mangaId).map(ch => ({
        id: ch.id,
        title: ch.title,
        number: ch.number,
        release_date: ch.release_date
    }));
}

// Get chapter by ID
export function getChapterById(id: number) {
    return mockChapters.find(ch => ch.id === id);
}

// Get total chapter count for a manga
export function getChapterCount(mangaId: number) {
    return mockChapters.filter(ch => ch.manga_id === mangaId).length;
}
