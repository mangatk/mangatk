import os
import requests

ONESIGNAL_API_URL = "https://onesignal.com/api/v1/notifications"

def send_onesignal_to_segment(title: str, body: str, segment: str = "Subscribed Users"):
    app_id = os.getenv("ONESIGNAL_APP_ID")
    api_key = os.getenv("ONESIGNAL_REST_API_KEY")

    if not app_id or not api_key:
        raise RuntimeError("Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY")

    payload = {
        "app_id": app_id,
        "included_segments": [segment],
        "headings": {"en": title},
        "contents": {"en": body},
    }
    headers = {
        "Authorization": f"Basic {api_key}",
        "Content-Type": "application/json",
    }

    r = requests.post(ONESIGNAL_API_URL, json=payload, headers=headers, timeout=20)
    r.raise_for_status()
    return r.json()
