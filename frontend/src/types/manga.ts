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
  categories?: string[];  // category slugs (e.g. 'best-webtoon') - from CategoryNav
  genres?: string[];      // genre names (e.g. 'Action') - from FilterSection dropdown
  type?: string;
  author?: string;
  artist?: string;
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