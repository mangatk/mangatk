# ========================================
# تشغيل نظام الترجمة - خطوات سريعة
# ========================================

echo "=== تشغيل Backend ==="
echo ""

cd backend

# 1. تفعيل البيئة الافتراضية (إذا كانت موجودة)
# Uncomment if you have venv:
# venv\Scripts\activate

# 2. تطبيق Migrations (إذا لم تكن طبّقتها)
echo "تطبيق migrations..."
python manage.py makemigrations
python manage.py migrate

# 3. تشغيل الخادم
echo ""
echo "=== تشغيل Django Server على المنفذ 8000 ==="
echo ""
python manage.py runserver

# في terminal آخر، شغّل Frontend:
# cd frontend
# npm run dev
