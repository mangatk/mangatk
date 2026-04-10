import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_DOMAIN = 'https://mangatk.fun'; 
const API_BASE_URL = `${BASE_DOMAIN}/api`;

function extractResults(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

async function fetchAPI(endpoint, options) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // إصلاح مشكلة الـ JSON Parse: نتحقق من نوع المحتوى قبل تحويله
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // طباعة الخطأ في الكونسول للمساعدة في التشخيص
      const textError = await response.text();
      console.error("Server Error Response:", textError.slice(0, 200));
      throw new Error(`السيرفر لم يرسل JSON. الحالة: ${response.status}`);
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || `خطأ سيرفر: ${response.status}`);
    return data;
  } catch (error) {
    console.error(`❌ API Error ${endpoint}:`, error);
    throw error;
  }
}

function mapMangaData(item) {
  if (!item) return null;
  let coverUrl = item.cover_image_url || item.cover_image;
  
  if (coverUrl && typeof coverUrl === 'string' && !coverUrl.startsWith('http')) {
    coverUrl = coverUrl.startsWith('/') ? `${BASE_DOMAIN}${coverUrl}` : `${BASE_DOMAIN}/media/${coverUrl}`;
  }

  const genres = item.genres 
    ? item.genres.map((g) => typeof g === 'string' ? g : g.name) 
    : [];

  return {
    id: item.id,
    title: item.title || 'بدون عنوان',
    description: item.description || '',
    imageUrl: coverUrl || 'https://via.placeholder.com/150',
    status: item.status || 'مستمر',
    author: item.author || 'غير معروف',
    chapters: Array.isArray(item.chapters) ? item.chapters : [],
    genres: genres, 
  };
}

export async function getMangaList(page = 1, category = '', sort = '') {
  let endpoint = `/manga/?page=${page}`;
  if (category) endpoint += `&genre=${category}`; 
  if (sort) endpoint += `&ordering=${sort}`;

  const data = await fetchAPI(endpoint);
  return extractResults(data).map(mapMangaData);
}

export async function getGenres() {
  try {
    const data = await fetchAPI('/genres/'); 
    // التأكد من استخراج النتائج لأن الـ Router يعيدها غالباً داخل results
    return extractResults(data); 
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
}

export async function getMangaDetails(id) {
  try {
    const data = await fetchAPI(`/manga/${id}/`); 
    return mapMangaData(data);
  } catch (error) {
    const data = await fetchAPI(`/manga/${id}`);
    return mapMangaData(data);
  }
}

export async function getChapterDetails(chapterId) {
  const data = await fetchAPI(`/chapters/${chapterId}/`);
  const pagesData = data.pages || data.images || [];
  const formattedPages = pagesData.map((page) => {
    let url = page.image_url || page.image || page;
    if (typeof url === 'string' && !url.startsWith('http')) {
      url = url.startsWith('/') ? `${BASE_DOMAIN}${url}` : `${BASE_DOMAIN}/media/${url}`;
    }
    return url;
  });
  return { id: data.id, chapterNumber: data.chapter_number, pages: formattedPages };
}

export async function getUserAchievements() {
  try {
    const token = await AsyncStorage.getItem('user_token');
    // المسار في الـ Router الخاص بك هو /achievements/
    const response = await fetch(`${BASE_DOMAIN}/api/achievements/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // استخدام Bearer أو Token حسب إعدادات JWT في Django
        'Authorization': token ? `Bearer ${token}` : '', 
      },
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        return [{ id: 1, is_unlocked: true, earned_at: new Date(), achievement: { name: 'بداية المشوار', description: 'سجلت حسابك الأول في MangaTK' } }];
    }

    const data = await response.json();
    if (!response.ok) throw new Error("فشل جلب الإنجازات");
    return extractResults(data);

  } catch (error) {
    console.error("❌ API Error Achievements:", error);
    return [
      { id: 1, is_unlocked: true, earned_at: new Date(), achievement: { name: 'بداية المشوار', description: 'سجلت حسابك الأول في MangaTK' } }
    ];
  }
}

export async function searchManga(query) {
  if (!query || query.trim() === "") return [];
  try {
    const data = await fetchAPI(`/manga/?search=${encodeURIComponent(query)}`);
    return extractResults(data).map(mapMangaData).filter(i => i !== null);
  } catch (error) {
    return [];
  }
}

// دالة تسجيل الدخول الحقيقية - تعديل المسار ليتوافق مع urls.py (auth/login/)
export async function loginUser(email, password) {
  try {
    const response = await fetch(`${BASE_DOMAIN}/api/auth/login/`, {
      method: 'POST',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ email, password }),
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("خطأ في الاتصال بالسيرفر (المسار غير صحيح أو السيرفر متوقف)");
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'فشل تسجيل الدخول');
    return data;
  } catch (error) {
    throw error;
  }
}

// دالة إنشاء حساب حقيقية - تعديل المسار ليتوافق مع urls.py (auth/register/)
export async function registerUser(name, email, password) {
  try {
    const response = await fetch(`${BASE_DOMAIN}/api/auth/register/`, {
      method: 'POST',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json' 
      },
      // في Django العادي الحقل يكون username، تأكد من مطابقة الحقول في auth_views.py
      body: JSON.stringify({ name, email, password }), 
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("خطأ في الاتصال بالسيرفر (المسار غير صحيح)");
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'فشل إنشاء الحساب');
    return data;
  } catch (error) {
    throw error;
  }
}

// دالة جلب آخر الفصول المرفوعة فعلياً
export async function getLatestUpdates() {
  try {
    // نفترض أن هذا الرابط يعيد آخر الفصول المرفوعة في موقعك
    const response = await fetch(`${BASE_DOMAIN}/api/chapters/latest/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const data = await response.json();
    return data; // يجب أن يعيد قائمة تحتوي على اسم المانجا ورقم الفصل
  } catch (error) {
    console.error("Error fetching updates:", error);
    return [];
  }
}