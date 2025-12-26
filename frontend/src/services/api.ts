import { Manga, Chapter, FilterState, ChapterData } from '@/types/manga';

// تحديد رابط الـ API (يأخذه من البيئة أو يستخدم الافتراضي)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * دالة مساعدة للتعامل مع ردود الباك-إند
 * Django REST Framework يرجِع البيانات أحياناً داخل كائن { count: ..., results: [...] }
 * هذه الدالة تستخرج المصفوفة سواء كانت مباشرة أو داخل results
 */
function extractResults(data: any): any[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      // محاولة قراءة رسالة الخطأ من السيرفر إن وجدت
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

// --- Helper Function for Mapping Data ---
// تحويل بيانات الباك-إند (Snake_case) إلى بيانات الفرونت-إند (CamelCase)
function mapMangaData(item: any): Manga {
  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    // استخدام صورة بديلة إذا لم يكن هناك رابط صورة
    imageUrl: item.cover_image_url || '/images/placeholder.jpg',
    chapterCount: item.chapter_count || 0,
    avgRating: parseFloat(item.avg_rating || '0'),
    // التعامل مع التصنيفات سواء كانت كائنات أو نصوص
    genres: item.genres ? (Array.isArray(item.genres) ? item.genres.map((g: any) => g.name || g) : []) : [],
    status: item.status,
    lastUpdated: item.last_updated,
    author: item.author || 'Unknown',
    views: item.views || 0,
    // التعامل مع الفئة (Category) سواء كانت كائن كامل أو مجرد Slug
    category: typeof item.category === 'object' && item.category !== null ? item.category.slug : item.category,
  };
}

// ==================== Manga Endpoints ====================

export async function getMangaList(filters?: FilterState): Promise<Manga[]> {
  let endpoint = '/manga/';
  const params = new URLSearchParams();

  if (filters?.query) params.append('search', filters.query);

  if (filters?.status && filters.status !== 'All') {
    params.append('status', filters.status.toLowerCase());
  }

  // دعم تصفية الأنواع (Genres)
  if (filters?.categories && filters.categories.length > 0) {
    // نفترض أن الباك-إند يستقبل مصفوفة أو قيم متعددة، هنا نرسل القيم بشكل متكرر
    filters.categories.forEach(cat => params.append('genre', cat));
  }

  if (filters?.sortBy) {
    const sortMap: Record<string, string> = {
      'Name': 'title',
      'Latest Chapter': '-last_updated',
      'Most Popular': '-views',
      'Rating': '-avg_rating',
    };
    params.append('ordering', sortMap[filters.sortBy] || '-last_updated');
  }

  const queryString = params.toString();
  if (queryString) endpoint += `?${queryString}`;

  const data = await fetchAPI<any>(endpoint);

  // استخدام الدالة المساعدة لاستخراج النتائج
  const results = extractResults(data);

  return results.map(mapMangaData);
}

export async function getMangaById(id: string): Promise<Manga & { chapters: Chapter[] }> {
  // جلب التفاصيل (عادة لا يكون هناك Pagination في تفاصيل عنصر واحد)
  const data = await fetchAPI<any>(`/manga/${id}/`);

  return {
    ...mapMangaData(data),
    chapters: data.chapters ? data.chapters.map((ch: any) => ({
      id: ch.id,
      mangaId: id,
      title: ch.title,
      number: ch.number,
      releaseDate: ch.release_date,
    })) : [],
  };
}

export async function getChapterDetails(id: string): Promise<ChapterData> {
  const data = await fetchAPI<any>(`/chapters/${id}/`);

  return {
    id: data.id,
    mangaId: data.manga_id,
    mangaTitle: data.manga_title,
    title: data.title,
    number: data.number,
    images: data.images ? data.images.map((img: any) => ({
      id: img.id,
      url: img.image_url,
      width: img.width,
      height: img.height,
    })) : [], // حماية في حال لم تكن الصور موجودة
    prevChapterId: data.prev_chapter_id,
    nextChapterId: data.next_chapter_id,
  };
}

// ==================== Helper Data Endpoints ====================

export async function getCategories(): Promise<string[]> {
  const data = await fetchAPI<any>('/categories/');
  const results = extractResults(data);
  // إرجاع الـ slug فقط
  return results.map((cat: any) => cat.slug);
}

export async function getGenres(): Promise<string[]> {
  const data = await fetchAPI<any>('/genres/');
  const results = extractResults(data);
  // إرجاع الاسم فقط
  return results.map((g: any) => g.name);
}

export async function getMangaByCategory(slug: string): Promise<Manga[]> {
  // نستخدم getMangaList مباشرة لكن نمرر معامل الفئة يدوياً في الرابط
  // ملاحظة: تأكد أن الباك-إند يدعم الفلترة بـ ?category=slug
  const endpoint = `/manga/?category=${slug}`;
  const data = await fetchAPI<any>(endpoint);
  const results = extractResults(data);
  return results.map(mapMangaData);
}
