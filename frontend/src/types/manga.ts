// frontend/src/types/manga.ts

export interface Manga {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  chapterCount: number;
  avgRating: number;
  genres: string[];
  status: 'ongoing' | 'completed';
  lastUpdated: string;
  artist?: string;
  author: string;
  story_type: string;
  views: number;
  category: string;
  banner_image_url?: string; // Optional banner image for featured manga
}

export interface Chapter {
  id: string;
  mangaId: string;
  title: string;
  number: number;
  releaseDate?: string;
}

export interface FilterState {
  query?: string;
  status?: string;
  categories?: string[];
  type?: string;
  author?: string;
  artist?: string;
  // التعديل هنا: جعلناها string لتقبل القيم القادمة من القوائم المنسدلة مثل "Latest Chapter"
  sortBy?: string;
}

export interface ChapterImage {
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface ChapterData {
  id: string;
  mangaId: string;
  title: string;
  mangaTitle?: string;
  number: number;
  images: ChapterImage[];
  prevChapterId?: string | null;
  nextChapterId?: string | null;
}