# زيادة حد رفع الملفات - File Upload Size Limits

تم تحديث الإعدادات للسماح برفع ملفات كبيرة (حتى 500MB):

## Frontend (Next.js)

الملف: `frontend/next.config.mjs`

```javascript
api: {
  bodyParser: {
    sizeLimit: '500mb',
  },
  responseLimit: '500mb',
},
experimental: {
  serverActions: {
    bodySizeLimit: '500mb',
  },
},
```

## Backend (Django)

الملف: `backend/config/settings.py`

```python
# File Upload Settings
DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500 MB  
DATA_UPLOAD_MAX_NUMBER_FIELDS = 10000
```

## الآن يمكنك

✅ رفع فصول حتى **500MB**
✅ عدد صفحات غير محدود
✅ ملفات ZIP/CBZ كبيرة

## ملاحظات

- إذا احتجت لحجم أكبر من 500MB، غيّر القيم أعلاه
- 500MB كافية لفصل بـ 200+ صفحة عالية الجودة
- تأكد من **إعادة تشغيل** Backend و Frontend بعد التغييرات

## إعادة التشغيل

**Backend:**
```bash
# أوقف الخادم (Ctrl+C)
# ثم شغّله مرة أخرى
python manage.py runserver
```

**Frontend:**
```bash
# أوقف الخادم (Ctrl+C)
# ثم شغّله مرة أخرى
npm run dev
```
