'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'ar' | 'en';

// ============================================================
// TRANSLATIONS DICTIONARY
// ============================================================
export const translations = {

  // Header & Navigation
  home:              { ar: 'الرئيسية',          en: 'Home' },
  browse:            { ar: 'قائمة المانجا',     en: 'Browse' },
  latest:            { ar: 'الأحدث',            en: 'Latest' },
  popular:           { ar: 'المشهورة',          en: 'Popular' },
  translate:         { ar: 'ترجمة AI',          en: 'AI Translate' },
  subscriptions:     { ar: 'الاشتراكات',        en: 'Subscriptions' },
  profile:           { ar: 'الملف الشخصي',      en: 'Profile' },
  dashboard:         { ar: 'لوحة التحكم',       en: 'Dashboard' },
  logout:            { ar: 'تسجيل الخروج',      en: 'Logout' },
  login:             { ar: 'دخول',              en: 'Login' },
  register:          { ar: 'تسجيل',             en: 'Register' },
  loggedAs:          { ar: 'مسجل باسم',         en: 'Logged in as' },
  notifications:     { ar: 'الإشعارات',         en: 'Notifications' },
  noNotifs:          { ar: 'لا توجد إشعارات حالياً', en: 'No notifications yet' },

  // Loading / Error States
  loading:           { ar: 'جاري التحميل...',   en: 'Loading...' },
  loadingManga:      { ar: 'جاري تحميل المانجا...', en: 'Loading manga...' },
  loadingDetails:    { ar: 'جاري تحميل التفاصيل...', en: 'Loading details...' },
  loadingChapters:   { ar: 'جاري تحميل الفصول...', en: 'Loading chapters...' },
  loadingCats:       { ar: 'جاري تحميل التصنيفات...', en: 'Loading categories...' },
  loadingMore:       { ar: 'جاري التحميل...',   en: 'Loading...' },
  filtering:         { ar: 'جاري التصفية...',   en: 'Filtering...' },
  noResults:         { ar: 'لا توجد نتائج',     en: 'No results found' },

  // Manga Status
  ongoing:           { ar: 'مستمرة',            en: 'Ongoing' },
  completed:         { ar: 'مكتملة',            en: 'Completed' },
  ongoingShort:      { ar: 'مستمر',             en: 'Ongoing' },
  completedShort:    { ar: 'مكتمل',             en: 'Completed' },

  // Manga Card & Grid
  readNow:           { ar: 'اقرأ الآن',         en: 'Read Now' },
  showMore:          { ar: 'عرض المزيد',         en: 'Load More' },
  mangaLibrary:      { ar: 'مكتبة المانجا',     en: 'Manga Library' },
  mangaLibraryDesc:  { ar: 'اكتشف عوالم جديدة ومغامرات لا تنتهي', en: 'Discover new worlds and endless adventures' },
  works:             { ar: 'عمل',               en: 'works' },
  chapters:          { ar: 'فصل',               en: 'Ch.' },

  // Home Page
  recentReading:     { ar: 'قراءاتك الأخيرة',  en: 'Recently Read' },
  continueReading:   { ar: 'تابع القراءة',      en: 'Continue' },
  topRated:          { ar: 'الأعلى تقييماً',   en: 'Top Rated' },
  topRatedDesc:      { ar: 'بناءً على تقييمات القراء', en: 'Based on reader ratings' },
  allManga:          { ar: 'جميع المانجا',      en: 'All Manga' },
  allMangaDesc:      { ar: 'استكشف مكتبتنا الكاملة', en: 'Explore our full library' },
  viewAllManga:      { ar: 'عرض قائمة المانجا الكاملة', en: 'View Full Manga List' },
  searchResults:     { ar: 'نتائج البحث',       en: 'Search Results' },
  searchResultsDesc: { ar: 'المانجا التي تطابق معايير البحث الخاصة بك', en: 'Manga matching your search criteria' },
  clearFilters:      { ar: 'إلغاء الفلتر والعودة', en: 'Clear Filters' },

  // Quick Menu
  newFeatures:       { ar: 'ميزات جديدة',       en: 'New Features' },
  newFeaturesDesc:   { ar: 'اكتشف أحدث الميزات', en: 'Discover latest features' },
  latestDownloads:   { ar: 'أحدث التنزيلات',    en: 'Latest Releases' },
  latestDownloadsDesc:{ ar: 'أحدث فصول المانجا', en: 'Newest manga chapters' },
  events:            { ar: 'الفعاليات',          en: 'Events' },
  eventsDesc:        { ar: 'انضم لفعاليات المجتمع', en: 'Join community events' },
  exclusive:         { ar: 'حصري',              en: 'Exclusive' },
  exclusiveDesc:     { ar: 'محتوى المانجا المميز', en: 'Premium manga content' },

  // Category Section Titles
  catBestWebtoon:    { ar: 'أفضل ويبتون',       en: 'Best Webtoon' },
  catBestWebtoonDesc:{ ar: 'أفضل المانغا والويبتون حسب التقييمات', en: 'Best manga & webtoons by rating' },
  catGoldenWeek:     { ar: 'الأسبوع الذهبي',   en: 'Golden Week' },
  catGoldenWeekDesc: { ar: 'مانغا الأسبوع الذهبي الأكثر شهرة', en: 'Most popular golden week manga' },
  catNewReleases:    { ar: 'إصدارات جديدة',     en: 'New Releases' },
  catNewReleasesDesc:{ ar: 'أحدث الإصدارات والمانغا الجديدة', en: 'Latest releases and new manga' },
  catActionFantasy:  { ar: 'أكشن وخيال',        en: 'Action & Fantasy' },
  catActionFantasyDesc:{ ar: 'أقوى مانغا الأكشن والخيال', en: 'Best action and fantasy manga' },
  catRomanceDrama:   { ar: 'رومانسية ودراما',   en: 'Romance & Drama' },
  catRomanceDramaDesc:{ ar: 'أجمل قصص الرومانسية والدراما', en: 'Beautiful romance and drama stories' },

  // Filter Section
  genres:            { ar: 'الأنواع',           en: 'Genres' },
  genresBtn:         { ar: 'الأنواع',           en: 'Genres' },
  genresLoading:     { ar: 'جاري تحميل الأنواع...', en: 'Loading genres...' },
  all:               { ar: 'الكل',              en: 'All' },
  manga:             { ar: 'مانجا',             en: 'Manga' },
  manhwa:            { ar: 'مانهوا',            en: 'Manhwa' },
  manhua:            { ar: 'مانهوا (صيني)',     en: 'Manhua' },
  comic:             { ar: 'كوميك',             en: 'Comic' },
  sortName:          { ar: 'الاسم',             en: 'Name' },
  sortLatest:        { ar: 'أحدث فصل',          en: 'Latest Chapter' },
  sortPopular:       { ar: 'الأكثر شهرة',       en: 'Most Popular' },
  sortRating:        { ar: 'التقييم',           en: 'Rating' },

  // Manga Detail Page
  story:             { ar: 'القصة',             en: 'Story' },
  chaptersSection:   { ar: 'الفصول',            en: 'Chapters' },
  searchChapter:     { ar: 'ابحث عن رقم...',   en: 'Search chapter...' },
  startReading:      { ar: 'ابدأ القراءة',       en: 'Start Reading' },
  continueReadingCh: { ar: 'اكمل القراءة - الفصل', en: 'Continue Reading - Ch.' },
  addFav:            { ar: 'أضف للمفضلة',       en: 'Add to Favorites' },
  removeFav:         { ar: 'تمت الإضافة للمفضلة', en: 'Added to Favorites' },
  noChaptersFound:   { ar: 'لا توجد فصول تطابق بحثك', en: 'No chapters match your search' },
  chapter:           { ar: 'الفصل',             en: 'Chapter' },

  // Read Page
  previousChapter:   { ar: 'الفصل السابق',      en: 'Previous Chapter' },
  nextChapter:       { ar: 'الفصل التالي',       en: 'Next Chapter' },
  backToManga:       { ar: 'العودة للمانجا',     en: 'Back to Manga' },
  pageOf:            { ar: 'من',                en: 'of' },

  // Chapter Rating
  rateChapter:       { ar: 'قيّم هذا الفصل',   en: 'Rate this Chapter' },
  submitRating:      { ar: 'أرسل التقييم',       en: 'Submit Rating' },
  savingRating:      { ar: 'جاري الحفظ...',     en: 'Saving...' },
  editRating:        { ar: 'تعديل التقييم',      en: 'Edit Rating' },
  ratingRequired:    { ar: 'يجب تسجيل الدخول للتقييم', en: 'Login required to rate' },

  // Comments
  comments:          { ar: 'التعليقات',         en: 'Comments' },
  writeComment:      { ar: 'اكتب تعليقاً...',  en: 'Write a comment...' },
  postComment:       { ar: 'نشر',               en: 'Post' },
  loginToComment:    { ar: 'سجل دخولك للتعليق', en: 'Login to comment' },
  noComments:        { ar: 'لا توجد تعليقات بعد. كن أول من يعلّق!', en: 'No comments yet. Be the first!' },
  reply:             { ar: 'رد',                en: 'Reply' },
  like:              { ar: 'إعجاب',             en: 'Like' },
  deleteComment:     { ar: 'حذف',              en: 'Delete' },

  // Profile Page
  myProfile:         { ar: 'ملفي الشخصي',      en: 'My Profile' },
  favorites:         { ar: 'المفضلة',           en: 'Favorites' },
  readingHistory:    { ar: 'سجل القراءة',       en: 'Reading History' },
  achievements:      { ar: 'الإنجازات',         en: 'Achievements' },
  points:            { ar: 'نقاط',              en: 'Points' },
  level:             { ar: 'المستوى',           en: 'Level' },
  noFavorites:       { ar: 'لا توجد مفضلة حتى الآن', en: 'No favorites yet' },
  noHistory:         { ar: 'لم تقرأ أي مانجا بعد', en: 'No reading history yet' },

  // Profile Page Extra
  smartPoints:       { ar: 'رصيد النقاط الذكية',  en: 'Smart Points Balance' },
  totalReadingTime:  { ar: 'إجمالي وقت الاستمتاع', en: 'Total Reading Time' },
  epicFavorites:     { ar: 'المفضلة الأسطورية', en: 'Epic Favorites' },
  chaptersRead:      { ar: 'الفصول المقروءة',   en: 'Chapters Read' },
  downloads:         { ar: 'تنزيلات محمولة',    en: 'Mobile Downloads' },
  chaptersAvailable: { ar: 'فصول متاحة لك',    en: 'Chapters Available' },
  achievementsHall:  { ar: 'قاعة الإنجازات',    en: 'Achievements Hall' },
  achievementCompleted: { ar: 'مكتمل',          en: 'Completed' },
  equipped:          { ar: 'مُستخدم',           en: 'Equipped' },
  tapToEquip:        { ar: 'اضغط واستخدمه',    en: 'Tap to Equip' },
  secretAch:         { ar: '؟؟؟ (إنجاز سري)',  en: '??? (Secret Achievement)' },
  inbox:             { ar: 'صندوق الوارد',       en: 'Inbox' },
  inboxEmpty:        { ar: 'صندوق الوارد فارغ',  en: 'Inbox is empty' },
  newBadge:          { ar: 'جديد',               en: 'new' },
  yourPrevComment:   { ar: 'تعليقك السابق:',    en: 'Your previous comment:' },
  chapterPrefix:     { ar: 'فصل',               en: 'Ch.' },
  writeReply:        { ar: 'اكتب ردك السريع...', en: 'Write your quick reply...' },
  sendReply:         { ar: 'إرسال الرد',         en: 'Send Reply' },
  quickReply:        { ar: 'رد سريع',            en: 'Quick Reply' },
  badgeColor:        { ar: 'اختر لون شارتك',    en: 'Choose Badge Color' },
  customColor:       { ar: 'لون مخصص بالكامل',  en: 'Fully Custom Color' },
  resetGradient:     { ar: 'إعادة للتدرج الافتراضي', en: 'Reset to Default Gradient' },
  welcomeUser:       { ar: 'أهلاً،',             en: 'Hello,' },
  commandCenter:     { ar: 'مرحباً بك في مركز القيادة الخاص بك', en: 'Welcome to your command center' },
  pointsPerChap:     { ar: 'نقطة لكل فصل',      en: 'point per chapter' },
  day:               { ar: 'يوم',               en: 'day' },
  hour:              { ar: 'ساعة',              en: 'hr' },
  minute:            { ar: 'دقيقة',             en: 'min' },

  // Browse Page
  searchPlaceholder: { ar: 'ابحث عن مانجا...', en: 'Search manga...' },
  searchNoResults:   { ar: 'لا توجد نتائج',     en: 'No results found' },
  viewAll:           { ar: 'عرض الكل',           en: 'View All' },
  allWorks:          { ar: 'جميع الأعمال',       en: 'All Works' },
  exploreLibrary:    { ar: 'استكشف المكتبة',    en: 'Explore Library' },
  searchResultsFor:  { ar: 'نتائج البحث:',       en: 'Search results:' },
  resetAll:          { ar: 'إعادة تعيين الكل',   en: 'Reset All' },
  remaining:         { ar: 'متبقية',             en: 'remaining' },
  notFoundMsg:       { ar: 'لم يتم العثور على نتائج', en: 'No results found' },

  // Login / Register
  welcomeBack:       { ar: 'مرحباً بعودتك',    en: 'Welcome back' },
  createAccount:     { ar: 'إنشاء حساب',        en: 'Create Account' },
  email:             { ar: 'البريد الإلكتروني', en: 'Email' },
  password:          { ar: 'كلمة المرور',       en: 'Password' },
  confirmPassword:   { ar: 'تأكيد كلمة المرور', en: 'Confirm Password' },
  forgotPassword:    { ar: 'نسيت كلمة المرور؟', en: 'Forgot password?' },
  haveAccount:       { ar: 'لديك حساب؟',        en: 'Have an account?' },
  noAccount:         { ar: 'ليس لديك حساب؟',   en: 'No account?' },

  // Footer
  footerBrowse:      { ar: 'تصفح المانجا',      en: 'Browse Manga' },
  footerBrowseList:  { ar: 'قائمة المانجا',     en: 'Manga List' },
  footerLatest:      { ar: 'أحدث الإضافات',     en: 'Latest Additions' },
  footerPopular:     { ar: 'الأكثر شهرة',       en: 'Most Popular' },
  footerSupport:     { ar: 'الدعم والمساعدة',   en: 'Support & Help' },
  footerContact:     { ar: 'تواصل معنا',         en: 'Contact Us' },
  footerPrivacy:     { ar: 'سياسة الخصوصية',   en: 'Privacy Policy' },
  footerTerms:       { ar: 'شروط الخدمة',       en: 'Terms of Service' },
  footerSlogan:      { ar: 'مرحبا بكم الى موقعنا نتمنى لكم تجربة مشاهدة وترجمة ممتعتين.', en: 'Welcome to our site. We hope you enjoy reading and translating manga!' },
  footerRights:      { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },

  // Translate Page
  translateTitle:    { ar: 'ترجمة الفصل بالذكاء الاصطناعي', en: 'AI Chapter Translation' },
  translateH1a:      { ar: 'ترجمة المانجا',       en: 'Manga Translation' },
  translateH1b:      { ar: 'بالذكاء الاصطناعي',  en: 'with AI' },
  translateDesc:     { ar: 'ارفع فصل من المانجا وسنترجمه تلقائياً إلى العربية باستخدام أحدث تقنيات الذكاء الاصطناعي', en: 'Upload a manga chapter and we will translate it automatically to Arabic using the latest AI technology' },
  pointsUnit:        { ar: 'نقطة',               en: 'pts' },
  cost:              { ar: 'التكلفة:',             en: 'Cost:' },
  selectSourceLang:  { ar: 'اختيار لغة المصدر',  en: 'Select Source Language' },
  required:          { ar: 'ضروري',              en: 'Required' },
  selectSourceDesc:  { ar: 'اختر اللغة الأصلية للمانجا للحصول على أفضل نتائج', en: 'Choose the original language of the manga for best results' },
  fromLang:          { ar: 'من (لغة المصدر)',     en: 'From (source language)' },
  toLang:            { ar: 'إلى (لغة الهدف)',     en: 'To (target language)' },
  fixed:             { ar: 'ثابت',                en: 'Fixed' },
  arabic:            { ar: 'عربي',                en: 'Arabic' },
  selectLangOption:  { ar: 'اختر لغة المصدر',    en: 'Choose source language' },
  dragFile:          { ar: 'اسحب الملف هنا',      en: 'Drag file here' },
  orClick:           { ar: 'أو انقر للاختيار',    en: 'or click to select' },
  supports:          { ar: 'يدعم:',               en: 'Supports:' },
  uploadAndTranslate:{ ar: 'رفع وترجمة',          en: 'Upload & Translate' },
  progress:          { ar: 'التقدم',               en: 'Progress' },
  translationDone:   { ar: 'اكتملت الترجمة!',    en: 'Translation Completed!' },
  pagesTranslatedOk: { ar: 'صفحة تم ترجمتها بنجاح', en: 'pages translated successfully' },
  downloadCBZ:       { ar: 'تنزيل ملف CBZ',       en: 'Download CBZ File' },
  translateNew:      { ar: 'ترجمة فصل جديد',     en: 'Translate New Chapter' },
  errorOccurred:     { ar: 'حدث خطأ',              en: 'An Error Occurred' },
  unexpectedError:   { ar: 'حدث خطأ غير متوقع',   en: 'An unexpected error occurred' },
  retry:             { ar: 'إعادة المحاولة',      en: 'Try Again' },
  errFileType:       { ar: 'يرجى اختيار ملف ZIP أو CBZ فقط', en: 'Please select a ZIP or CBZ file only' },
  errLoginRequired:  { ar: 'يجب تسجيل الدخول لاستخدام المترجم', en: 'You must be logged in to use the translator' },
  errSelectFile:     { ar: 'يرجى اختيار ملف',     en: 'Please select a file' },
  errSelectLang:     { ar: 'يرجى اختيار لغة المصدر قبل الترجمة', en: 'Please select source language before translating' },
  errUpload:         { ar: 'حدث خطأ أثناء رفع الملف', en: 'An error occurred while uploading the file' },
  errConnect:        { ar: 'فشل الاتصال بالخادم',  en: 'Failed to connect to server' },
  statusUploading:   { ar: 'جاري الرفع...',        en: 'Uploading...' },
  statusExtracting:  { ar: 'جاري فك الضغط...',    en: 'Extracting...' },
  statusTranslating: { ar: 'جاري الترجمة...',     en: 'Translating...' },
  statusCreating:    { ar: 'جاري إنشاء الملف...',  en: 'Creating file...' },
  statusCompleted:   { ar: 'اكتمل!',               en: 'Done!' },
  statusFailed:      { ar: 'فشل',                  en: 'Failed' },
  uploadImages:      { ar: 'رفع الصور',            en: 'Upload Images' },
  translateBtn:      { ar: 'ترجمة',                en: 'Translate' },
  translating:       { ar: 'جاري الترجمة...',      en: 'Translating...' },
  sourceLanguage:    { ar: 'اللغة المصدر',         en: 'Source Language' },
  targetLanguage:    { ar: 'اللغة الهدف (عربي)',   en: 'Target Language (Arabic)' },
  japanese:          { ar: 'ياباني',               en: 'Japanese' },
  chinese:           { ar: 'صيني',                 en: 'Chinese' },
  korean:            { ar: 'كوري',                 en: 'Korean' },
  english:           { ar: 'إنجليزي',              en: 'English' },

  // Subscriptions
  choosePlan:        { ar: 'اختر خطة الاشتراك', en: 'Choose a Plan' },
  monthly:           { ar: 'شهري',              en: 'Monthly' },
  yearly:            { ar: 'سنوي',              en: 'Yearly' },
  lifetime:          { ar: 'لا محدود',          en: 'Lifetime' },
  subscribe:         { ar: 'اشترك الآن',         en: 'Subscribe Now' },
  currentPlan:       { ar: 'خطتك الحالية',      en: 'Your Current Plan' },

  // Misc
  search:            { ar: 'بحث',              en: 'Search' },
  cancel:            { ar: 'إلغاء',            en: 'Cancel' },
  confirm:           { ar: 'تأكيد',            en: 'Confirm' },
  save:              { ar: 'حفظ',              en: 'Save' },
  edit:              { ar: 'تعديل',            en: 'Edit' },
  delete:            { ar: 'حذف',              en: 'Delete' },
  close:             { ar: 'إغلاق',            en: 'Close' },
  back:              { ar: 'رجوع',             en: 'Back' },
  next:              { ar: 'التالي',           en: 'Next' },
  previous:          { ar: 'السابق',           en: 'Previous' },
  views:             { ar: 'مشاهدة',           en: 'views' },
  rating:            { ar: 'تقييم',            en: 'Rating' },
  author:            { ar: 'المؤلف',           en: 'Author' },
  artist:            { ar: 'الرسام',           en: 'Artist' },
  releaseDate:       { ar: 'تاريخ الإصدار',   en: 'Release Date' },
  type:              { ar: 'النوع',            en: 'Type' },
  status:            { ar: 'الحالة',           en: 'Status' },

  // Greetings
  greetingMorning:   { ar: 'صباح الخير',       en: 'Good morning' },
  greetingAfternoon: { ar: 'طاب مساؤك',        en: 'Good afternoon' },
  greetingEvening:   { ar: 'سهرة ممتعة',       en: 'Good evening' },

} as const;

export type TranslationKey = keyof typeof translations;

// ============================================================
// Context
// ============================================================

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
  tDynamic: (nameEn: string, nameAr?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  toggleLang: () => {},
  t: (key) => translations[key].ar,
  tDynamic: (nameEn, nameAr) => nameAr || nameEn,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lang') as Lang | null;
      if (saved === 'ar' || saved === 'en') {
        setLang(saved);
      }
    }
  }, []);

  const toggleLang = () => {
    const newLang: Lang = lang === 'ar' ? 'en' : 'ar';
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', newLang);
    }
  };

  const t = (key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] ?? entry.ar;
  };

  const tDynamic = (nameEn: string, nameAr?: string): string => {
    if (lang === 'ar' && nameAr && nameAr.trim() !== '') return nameAr;
    return nameEn;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, tDynamic }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
