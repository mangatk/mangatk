# ==============================================
# خطوات تفعيل نظام الترجمة
# ==============================================

echo "=== تطبيق Migration على قاعدة البيانات ==="

cd backend

# تفعيل البيئة الافتراضية (إذا كانت موجودة)
# Uncomment the line below if you use virtual environment
# venv\Scripts\activate

# إنشاء migration
python manage.py makemigrations manga

# تطبيق التغييرات
python manage.py migrate

echo ""
echo "=== Migration مكتمل! ==="
echo ""
echo "الخطوات التالية:"
echo "1. افتح: backend/manga/services/custom_translator.py"
echo "2. نفذ نموذج الترجمة الخاص بك"
echo "3. شغل الخوادم:"
echo "   - Backend: python manage.py runserver"
echo "   - Frontend: npm run dev"
echo "4. افتح: http://localhost:3000/dashboard/translate"
