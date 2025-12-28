# حل خطأ: Unknown column 'original_images_paths'

## الخطأ
```
django.db.utils.OperationalError: (1054, "Unknown column 'original_images_paths' in 'INSERT INTO'")
```

## السبب
لم يتم تطبيق migrations على قاعدة البيانات. العمود `original_images_paths` الذي أضفناه لنموذج `TranslationJob` غير موجود.

## الحل

### الخطوة 1: إيقاف الخادم
اضغط `Ctrl+C` في terminal الـ Backend

### الخطوة 2: تطبيق Migrations

```bash
cd d:\gndhn\mangatk\backend

# إنشاء migration
python manage.py makemigrations manga

# تطبيق migrations
python manage.py migrate
```

### الخطوة 3: إعادة تشغيل الخادم

```bash
python manage.py runserver
```

---

## التحقق من النجاح

يجب أن ترى رسالة مثل:
```
Applying manga.XXXX_add_original_images_paths... OK
```

بعدها يمكنك استخدام صفحة الترجمة بدون مشاكل!

---

## ملاحظة مهمة

**كل مرة تُعدّل فيها Models**:
1. `python manage.py makemigrations`
2. `python manage.py migrate`
3. أعد تشغيل الخادم
