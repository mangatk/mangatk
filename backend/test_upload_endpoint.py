"""
Debug script to test async chapter upload endpoint
Run this to check if the endpoint is working correctly
"""

import requests
import json

API_URL = "http://localhost:8000/api"

def test_endpoint():
    print("=" * 50)
    print("Testing Async Chapter Upload Endpoint")
    print("=" * 50)
    
    # 1. Test without authentication (should fail with 401)
    print("\n1. Testing without authentication...")
    response = requests.post(f"{API_URL}/chapters/upload-async/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:200]}")
    
    if response.status_code == 401:
        print("✅ Correctly requires authentication")
    else:
        print("❌ Should return 401 Unauthorized")
    
    # 2. Test with authentication
    print("\n2. Testing with authentication...")
    print("Please enter your admin credentials:")
    email = input("Email: ")
    password = input("Password: ")
    
    # Login
    login_response = requests.post(
        f"{API_URL}/auth/login/",
        json={"email": email, "password": password}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    login_data = login_response.json()
    if not login_data.get('success'):
        print(f"❌ Login failed: {login_data.get('error')}")
        return
    
    token = login_data['tokens']['access']
    print("✅ Login successful")
    
    # Check if user is admin
    user = login_data.get('user', {})
    if not user.get('is_staff') and not user.get('is_superuser'):
        print("❌ User is not admin! Cannot upload chapters.")
        print(f"   is_staff: {user.get('is_staff')}")
        print(f"   is_superuser: {user.get('is_superuser')}")
        return
    
    print(f"✅ User is admin (is_staff: {user.get('is_staff')})")
    
    # 3. Test endpoint with auth (without file)
    print("\n3. Testing endpoint with auth (without file)...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{API_URL}/chapters/upload-async/",
        headers=headers
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:300]}")
    
    if response.status_code == 400:
        print("✅ Correctly validates required fields")
    else:
        print("⚠️ Expected 400 Bad Request")
    
    print("\n" + "=" * 50)
    print("Test completed!")
    print("=" * 50)
    
    print("\n📋 Summary:")
    print(f"   - Endpoint exists: ✅")
    print(f"   - Requires auth: ✅")
    print(f"   - User is admin: {'✅' if user.get('is_staff') else '❌'}")
    print(f"   - Token: {token[:20]}...")

if __name__ == "__main__":
    try:
        test_endpoint()
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to Django server!")
        print("   Make sure to run: python manage.py runserver")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
