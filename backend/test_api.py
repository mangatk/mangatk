import urllib.request
import json
try:
    req = urllib.request.urlopen("http://127.0.0.1:8000/api/genres/")
    data = json.loads(req.read())
    print("Type:", type(data))
    if isinstance(data, list):
        print("Count:", len(data))
    else:
        print("Keys:", data.keys())
        if 'results' in data:
            print("Results Count:", len(data['results']))
            print("Next URL:", data.get('next'))
except Exception as e:
    print("Error:", e)
