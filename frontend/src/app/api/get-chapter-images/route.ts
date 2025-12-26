import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chapterId = searchParams.get('chapterId');
  
  // ⚠️ تأكد أن هذا الاسم يطابق اسم المجلد في public/uploads بالحرف!
  const MANGA_FOLDER_NAME = "I Killed an Academy Player"; 

  if (!chapterId) {
    return NextResponse.json({ error: 'Chapter ID required' }, { status: 400 });
  }

  // تحديد المسار (مع التعامل الآمن مع المسارات)
  const directoryPath = path.join(process.cwd(), 'public', 'uploads', MANGA_FOLDER_NAME, chapterId);

  // طباعة المسار في التيرمينال لنعرف أين يبحث السيرفر (للتصحيح)
  console.log("🔍 Server looks here:", directoryPath);

  try {
    // التحقق هل المجلد موجود أصلاً؟
    if (!fs.existsSync(directoryPath)) {
      console.error("❌ Folder not found!");
      return NextResponse.json({ error: 'Folder not found', path: directoryPath }, { status: 404 });
    }

    // قراءة الملفات
    const files = fs.readdirSync(directoryPath);

    // فلترة الصور فقط
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|webp)$/i.test(file)
    );

    // ترتيب الصور (مهم جداً للترتيب الرقمي)
    imageFiles.sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    // إذا لم يجد صور
    if (imageFiles.length === 0) {
      return NextResponse.json({ error: 'No images found in folder' }, { status: 404 });
    }

    // إنشاء الروابط
    const images = imageFiles.map((file, index) => ({
      id: `img-${index}`,
      // نستخدم encodeURIComponent للتعامل مع المسافات في الروابط
      url: `/uploads/${encodeURIComponent(MANGA_FOLDER_NAME)}/${chapterId}/${file}`,
      width: 800,
      height: 1200
    }));

    return NextResponse.json({ 
      success: true,
      images: images,
      title: `Chapter ${chapterId}` 
    });

  } catch (error) {
    console.error('🔥 Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}