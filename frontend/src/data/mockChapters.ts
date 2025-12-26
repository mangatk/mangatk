// src/data/mockChapters.ts

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
    number: number;
    images: ChapterImage[];
    prevChapterId?: string;
    nextChapterId?: string;
  }
  
  // دالة مساعدة لإضافة الأصفار (تحويل 1 إلى 001)
  const padNumber = (num: number) => num.toString().padStart(3, '0');
  
  export const getChapterImages = (chapterId: string): ChapterData => {
    // إعدادات خاصة للمانجا الخاصة بك
    // تأكد أن عدد الصفحات (pages) يطابق عدد الصور الموجودة لديك في المجلد
    const totalPages = 30; 
    
    // اسم المجلد كما هو موجود في جهازك داخل public/uploads
    const mangaFolderName = "I Killed an Academy Player";
    
    // رقم الفصل (المجلد 1)
    const chapterFolder = chapterId; 
  
    const images = Array.from({ length: totalPages }, (_, i) => {
      const pageNumber = i + 1;
      // هنا نقوم بتشكيل اسم الصورة: 001__001.jpg
      // الجزء الأول (001) يمثل رقم الفصل، والجزء الثاني (001) يمثل رقم الصفحة
      const chapterPrefix = padNumber(parseInt(chapterId)); // يحول 1 إلى 001
      const pageSuffix = padNumber(pageNumber); // يحول 1 إلى 001
      
      // اسم الملف النهائي: 001__001.jpg
      const fileName = `${chapterPrefix}__${pageSuffix}.jpg`;
  
      return {
        id: `img-${i}`,
        // الرابط النهائي: /uploads/I Killed an Academy Player/1/001__001.jpg
        url: `/uploads/${mangaFolderName}/${chapterFolder}/${fileName}`,
        width: 800,
        height: 1200,
      };
    });
  
    return {
      id: chapterId,
      mangaId: '1', // معرف المانجا
      title: `I Killed an Academy Player - الفصل ${chapterId}`,
      number: parseInt(chapterId) || 1,
      images: images,
      prevChapterId: parseInt(chapterId) > 1 ? (parseInt(chapterId) - 1).toString() : undefined,
      nextChapterId: (parseInt(chapterId) + 1).toString(),
    };
  };