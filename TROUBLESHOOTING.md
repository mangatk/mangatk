# دليل حل مشكلة "فشل الاتصال بالخادم"

## المشكلة
عند محاولة استخدام صفحات الترجمة، يظهر الخطأ:
```
فشل الاتصال بالخادم
```

---

## الحل السريع

### الخطوة 1: تشغيل Backend

**Terminal 1:**
```bash
cd d:\gndhn\mangatk
start_backend.bat
```

أو يدوياً:
```bash
cd d:\gndhn\mangatk\backend
python manage.py runserver
```

**يجب أن ترى**:
```
Starting development server at http://127.0.0.1:8000/
```

---

### الخطوة 2: تشغيل Frontend

**Terminal 2:**
```bash
cd d:\gndhn\mangatk
start_frontend.bat
```

أو يدوياً:
```bash
cd d:\gndhn\mangatk\frontend
npm run dev
```

**يجب أن ترى**:
```
- Local: http://localhost:3000
```

---

### الخطوة 3: التحقق

1. **افتح المتصفح**: `http://localhost:3000`
2. **تحقق من Backend**: افتح `http://localhost:8000/api/` في تبويب آخر
   - يجب أن ترى صفحة Django REST API

---

## إذا استمرت المشكلة

### 1. تحقق من المنافذ

تأكد من أن المنافذ غير مستخدمة:
```bash
# في Windows
netstat -ano | findstr :8000
netstat -ano | findstr :3000
```

### 2. تطبيق Migrations

```bash
cd d:\gndhn\mangatk\backend
python manage.py makemigrations
python manage.py migrate
```

### 3. تحقق من CORS

افتح `backend/config/settings.py` وتأكد من:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### 4. تحقق من API_URL في Frontend

افتح `frontend/.env.local` أو تحقق من:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## اختبار الاتصال

### Test Backend مباشرة:

```bash
curl http://localhost:8000/api/
```

يجب أن يرجع JSON response.

### Test Translation Endpoint:

```bash
# للمستخدمين
curl http://localhost:8000/api/translate/

# للمدراء
curl http://localhost:8000/api/translation/
```

---

## الترتيب الصحيح للتشغيل

1. ✅ تشغيل **Backend** أولاً
2. ✅ تشغيل **Frontend** ثانياً
3. ✅ فتح المتصفح `http://localhost:3000`

---

## معلومات إضافية

**Endpoints مهمة**:
- Backend API: `http://localhost:8000/api/`
- Frontend: `http://localhost:3000/`
- صفحة الترجمة للمستخدمين: `/translate`
- صفحة الترجمة للمدراء: `/dashboard/translate`

**Logs مفيدة**:
- شاهد terminal Backend لرؤية الطلبات
- شاهد terminal Frontend لرؤية الأخطاء
- افتح Developer Tools في المتصفح (F12) → Console
