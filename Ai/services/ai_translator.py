"""
AI Translator Service for sending images to AI models and receiving translations
"""
import requests
import base64
from typing import Dict, Any
from ..models import AITranslationModel

class AITranslator:
    """Service for translating manga images using AI models"""
    
    @staticmethod
    def translate_image(image_path: str, ai_model: AITranslationModel) -> str:
        """
        ترجمة صورة واحدة باستخدام نموذج AI
        
        Args:
            image_path: Path to image file
            ai_model: AITranslationModel instance
            
        Returns:
            str: Base64 encoded translated image
            
        Raises:
            requests.RequestException: If API call fails
            ValueError: If response format is invalid
        """
        # قراءة الصورة وتحويلها إلى base64
        with open(image_path, 'rb') as img_file:
            image_data = base64.b64encode(img_file.read()).decode('utf-8')
        
        # إعداد الطلب
        headers = {
            'Content-Type': 'application/json',
            **ai_model.extra_headers
        }
        
        if ai_model.api_key:
            headers['Authorization'] = f'Bearer {ai_model.api_key}'
        
        # استخدام قالب الطلب المحفوظ
        payload = ai_model.request_template.copy() if ai_model.request_template else {}
        payload['image'] = image_data
        
        # إرسال الطلب
        try:
            response = requests.post(
                ai_model.api_endpoint,
                json=payload,
                headers=headers,
                timeout=120  # 2 minutes timeout
            )
            response.raise_for_status()
            result = response.json()
            
            # استخراج الصورة المترجمة حسب response_path  
            # مثال: "data.image" -> result.get("data", {}).get("image")
            translated_image = AITranslator._extract_from_path(result, ai_model.response_path)
            
            if not translated_image:
                raise ValueError(f"Could not find translated image at path: {ai_model.response_path}")
            
            return translated_image
            
        except requests.RequestException as e:
            raise requests.RequestException(f"AI API request failed: {str(e)}")
    
    @staticmethod
    def _extract_from_path(data: Dict[Any, Any], path: str) -> Any:
        """
        استخراج قيمة من كائن JSON باستخدام مسار منقط
        مثال: "data.image" يستخرج data['image'] من الكائن
        
        Args:
            data: JSON object
            path: Dot-separated path (e.g., "data.image")
            
        Returns:
            Extracted value or None
        """
        keys = path.split('.')
        current = data
        
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return None
        
        return current
    
    @staticmethod
    def test_connection(ai_model: AITranslationModel) -> Dict[str, Any]:
        """
        اختبار الاتصال بنموذج AI
        
        Args:
            ai_model: AITranslationModel instance
            
        Returns:
            dict: {"success": bool, "message": str}
        """
        try:
            headers = {
                'Content-Type': 'application/json',
                **ai_model.extra_headers
            }
            
            if ai_model.api_key:
                headers['Authorization'] = f'Bearer {ai_model.api_key}'
            
            # إرسال طلب test بسيط (يمكن تخصيصه حسب API)
            response = requests.get(
                ai_model.api_endpoint,
                headers=headers,
                timeout=10
            )
            
            if response.status_code in [200, 201, 204]:
                return {"success": True, "message": "الاتصال ناجح"}
            else:
                return {"success": False, "message": f"API returned status {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "message": f"فشل الاتصال: {str(e)}"}
