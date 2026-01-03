#!/usr/bin/env python
"""
ImgBB Upload Diagnostic Script
================================
Tests if ImgBB upload is working correctly
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from manga.services.imgbb import ImgBBService
import requests
from io import BytesIO

def test_imgbb_configuration():
    """Test 1: Check if API key is configured"""
    print("=" * 50)
    print("TEST 1: Checking ImgBB Configuration")
    print("=" * 50)
    
    api_key = settings.IMGBB_API_KEY
    
    if not api_key:
        print("❌ FAILED: IMGBB_API_KEY is not set!")
        print("   Please add IMGBB_API_KEY to your .env file")
        return False
    
    print(f"✅ PASSED: API Key is set (length: {len(api_key)})")
    return True

def test_imgbb_api_reachable():
    """Test 2: Check if ImgBB API is reachable"""
    print("\n" + "=" * 50)
    print("TEST 2: Checking ImgBB API Connectivity")
    print("=" * 50)
    
    try:
        response = requests.get('https://api.imgbb.com/', timeout=10)
        print(f"✅ PASSED: ImgBB API is reachable (status: {response.status_code})")
        return True
    except Exception as e:
        print(f"❌ FAILED: Cannot reach ImgBB API")
        print(f"   Error: {e}")
        return False

def test_imgbb_upload():
    """Test 3: Try uploading a test image"""
    print("\n" + "=" * 50)
    print("TEST 3: Testing Image Upload")
    print("=" * 50)
    
    try:
        # Download a test image
        print("Downloading test image...")
        response = requests.get('https://via.placeholder.com/150/0000FF/FFFFFF?text=Test')
        
        if response.status_code != 200:
            print("❌ FAILED: Could not download test image")
            return False
        
        # Create BytesIO object
        img_file = BytesIO(response.content)
        img_file.name = 'test_diagnostic.png'
        
        # Try upload
        print("Uploading to ImgBB...")
        result = ImgBBService.upload_image(img_file, 'diagnostic_test')
        
        if result and result.get('url'):
            print("✅ PASSED: Upload successful!")
            print(f"   URL: {result['url']}")
            print(f"   Size: {result.get('size', 'unknown')} bytes")
            return True
        else:
            print("❌ FAILED: Upload returned no result")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Upload error")
        print(f"   Error: {e}")
        return False

def main():
    print("\n")
    print("╔" + "=" * 48 + "╗")
    print("║  ImgBB Upload Diagnostic Tool                 ║")
    print("╚" + "=" * 48 + "╝")
    print()
    
    results = []
    
    # Run tests
    results.append(("Configuration", test_imgbb_configuration()))
    results.append(("Connectivity", test_imgbb_api_reachable()))
    results.append(("Upload Test", test_imgbb_upload()))
    
    # Summary
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:20s}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! ImgBB is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")

if __name__ == '__main__':
    main()
