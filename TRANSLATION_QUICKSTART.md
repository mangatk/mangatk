# دليل سريع - نظام الترجمة المتكامل

## المتطلبات قبل الاستخدام

### 1. تنفيذ نموذج الترجمة الخاص بك

**الملف**: `backend/manga/services/custom_translator.py`

افتح الملف وابحث عن:
```python
def translate_chapter(cls, input_zip_path: str, output_dir: str) -> List[str]:
```

استبدل الكود الموجود بنموذج الترجمة الخاص بك.

**المدخلات**:
- `input_zip_path`: مسار ملف ZIP/CBZ الأصلي
- `output_dir`: المجلد لحفظ الصور المترجمة

**المخرجات**:
- قائمة بمسارات الصور المترجمة (مرتبة حسب رقم الصفحة)

---

### 2. تطبيق Migration

```bash
cd d:\gndhn\mangatk\backend

# إذا كنت تستخدم بيئة افتراضية، فعّلها أولاً
# venv\Scripts\activate

# إنشاء migration
python manage.py makemigrations manga

# تطبيق التغييرات
python manage.py migrate
```

---

## كيفية الاستخدام

### تشغيل الخوادم

**Terminal 1 - Backend**:
```bash
cd d:\gndhn\mangatk\backend
python manage.py runserver
```

**Terminal 2 - Frontend**:
```bash
cd d:\gndhn\mangatk\frontend
npm run dev
```

---

### استخدام واجهة الترجمة

1. افتح المتصفح: `http://localhost:3000/dashboard/translate`

2. **حدد المانجا** من القائمة المنسدلة

3. **أدخل رقم الفصل** (مثل: 1 أو 1.5)

4. **ارفع ملف ZIP/CBZ** الذي يحتوي على صور الفصل

5. **اضغط "رفع وترجمة"** وانتظر اكتمال الترجمة

6. **عاين النتائج**:
   - اضغط "الأصلي" لرؤية الصور الأصلية
   - اضغط "المترجم" لرؤية الصور المترجمة
   - اضغط "جنباً إلى جنب" للمقارنة المباشرة

7. **احفظ الفصل**:
   - اضغط "حفظ الفصل المترجم"
   - سيتم رفع الصور إلى imgbb ونشر الفصل
   - ستتم إعادة التوجيه لصفحة المانجا

---

## الملفات الرئيسية

### Backend
- `backend/manga/services/custom_translator.py` - **نموذج الترجمة (يجب تنفيذه)**
- `backend/manga/translate_dashboard_views.py` - Endpoints الترجمة
- `backend/manga/models.py` - نموذج TranslationJob
- `backend/manga/urls.py` - Routes

### Frontend
- `frontend/src/app/dashboard/translate/page.tsx` - صفحة الترجمة
- `frontend/src/components/ChapterPreview.tsx` - مكون المعاينة

---

## ملاحظات مهمة

⚠️ **نموذج الترجمة**:
- الكود الحالي في `custom_translator.py` للاختبار فقط
- يجب استبداله بنموذج الترجمة الفعلي

⚠️ **Migration**:
- يجب تطبيق migration قبل الاستخدام
- عدم تطبيقه سيؤدي لأخطاء في قاعدة البيانات

✅ **الصفحة متصلة**:
- الرابط موجود في Dashboard Sidebar
- يمكن الوصول إليها من `/dashboard/translate`

---

## المساعدة

للحصول على تفاصيل أكثر، راجع:
- `implementation_plan.md` - خطة التنفيذ الكاملة
- `walkthrough.md` - دليل شامل مع أمثلة
