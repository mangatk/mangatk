import json, os
import firebase_admin
from firebase_admin import credentials, messaging

def init_firebase():
    if firebase_admin._apps:
        return
    sa = json.loads(os.environ["FIREBASE_SERVICE_ACCOUNT_JSON"])
    cred = credentials.Certificate(sa)
    firebase_admin.initialize_app(cred)

def send_to_token(token: str, title: str, body: str, link: str):
    init_firebase()
    msg = messaging.Message(
        token=token,
        notification=messaging.Notification(title=title, body=body),
        webpush=messaging.WebpushConfig(
            fcm_options=messaging.WebpushFCMOptions(link=link)
        ),
    )
    return messaging.send(msg)

from rest_framework.permissions import IsAdminUser
from .models import FcmToken
from .fcm import send_to_token
from rest_framework.decorators import api_view, permission_classes

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def push_test(request):
    token_obj = FcmToken.objects.filter(user=request.user).order_by("-last_seen").first()
    if not token_obj:
        return Response({"detail": "no token"}, status=400)

    msg_id = send_to_token(
        token_obj.token,
        title="اختبار إشعار",
        body="إذا وصلتك هذه الرسالة فكل شيء شغال ✅",
        link="https://mangatk-nu.vercel.app",
    )
    return Response({"message_id": msg_id})

