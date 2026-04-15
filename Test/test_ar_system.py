#!/usr/bin/env python3
"""
AR Photo System Test Script

This script tests all AR photo functionality to ensure everything is working correctly.
Run this before using the web interface to verify hardware and software integration.

Usage:
    python test_ar_system.py

Requirements:
    - Camera connected and working
    - Arduino connected (optional, but recommended)
    - All dependencies installed (pip install -r ./Python/requirements.txt)
"""

import sys
import os
import time
import cv2
import numpy as np

# Add the Python directory to the path to import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from Python.core_logic import (
        find_arduino_port, send_arduino_command, take_photo, take_ar_photo,
        apply_filter, detect_faces_for_ar, add_ar_elements_to_faces,
        get_ar_photo_list, get_latest_ar_photo, init_camera
    )
    print("✅ Successfully imported AR photo modules")
except ImportError as e:
    print(f"❌ Failed to import modules: {e}")
    print("Make sure you're running this from the project root directory")
    sys.exit(1)

def test_camera():
    """Test if camera is working"""
    print("\n📹 Testing Camera Connection...")
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        # Try other camera indices
        for i in range(1, 4):
            cap = cv2.VideoCapture(i)
            if cap.isOpened():
                print(f"✅ Found camera on index {i}")
                break
        else:
            print("❌ No camera found!")
            return False
    else:
        print("✅ Camera found on index 0")
    
    # Test capture
    ret, frame = cap.read()
    if ret:
        height, width = frame.shape[:2]
        print(f"✅ Camera capture successful - Resolution: {width}x{height}")
        cap.release()
        return True
    else:
        print("❌ Failed to capture from camera")
        cap.release()
        return False

def test_arduino():
    """Test Arduino connection and LED control"""
    print("\n🔌 Testing Arduino Connection...")
    
    port = find_arduino_port()
    if port:
        print(f"✅ Arduino found on port: {port}")
        
        # Test basic LED commands
        print("Testing LED commands...")
        
        test_commands = [
            ("on", "LED ON"),
            ("off", "LED OFF"),
            ("blink", "Normal blink"),
            ("blink_fast", "Fast blink")
        ]
        
        for cmd, desc in test_commands:
            print(f"  Sending: {cmd} ({desc})")
            response = send_arduino_command(cmd)
            print(f"  Response: {response}")
            time.sleep(1)
        
        return True
    else:
        print("⚠️  Arduino not found - LED features will not work")
        return False

def test_face_detection():
    """Test face detection functionality"""
    print("\n👤 Testing Face Detection...")
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Camera not available for face detection test")
        return False
    
    print("📸 Capturing image for face detection test...")
    
    # Capture multiple frames to let camera adjust
    for i in range(5):
        ret, frame = cap.read()
        time.sleep(0.2)
    
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        print("❌ Failed to capture test image")
        return False
    
    # Detect faces
    faces = detect_faces_for_ar(frame)
    
    if len(faces) > 0:
        print(f"✅ Face detection working - Found {len(faces)} face(s)")
        
        # Test AR face effects
        ar_frame = add_ar_elements_to_faces(frame.copy(), faces, 'glasses')
        print("✅ AR face effects applied successfully")
        
        return True
    else:
        print("⚠️  No faces detected (try positioning face in front of camera)")
        return False

def test_image_filters():
    """Test image filter functionality"""
    print("\n🎨 Testing Image Filters...")
    
    # Create test image
    test_image = np.ones((480, 640, 3), dtype=np.uint8) * 128
    cv2.rectangle(test_image, (100, 100), (540, 380), (255, 100, 100), -1)
    cv2.circle(test_image, (320, 240), 50, (100, 255, 100), -1)
    
    filters = ['grayscale', 'blur', 'sepia', 'vintage', 'cool']
    
    for filter_name in filters:
        try:
            filtered = apply_filter(test_image.copy(), filter_name)
            print(f"✅ {filter_name} filter applied successfully")
        except Exception as e:
            print(f"❌ {filter_name} filter failed: {e}")
            return False
    
    print("✅ All image filters working correctly")
    return True

def test_ar_photo_capture():
    """Test full AR photo capture"""
    print("\n📸 Testing AR Photo Capture...")
    
    try:
        # Test basic AR photo
        print("Taking test AR photo with basic effects...")
        result = take_ar_photo(
            filter_type='none',
            custom_text='AR Test Photo',
            frame_style='none',
            ar_face_effect='none',
            show_timestamp=True,
            trigger_led=False  # Don't trigger LED for test
        )
        
        if result['status'] == 'success':
            print(f"✅ Basic AR photo captured: {result['filename']}")
        else:
            print(f"❌ Basic AR photo failed: {result['message']}")
            return False
        
        # Test AR photo with effects
        print("Taking test AR photo with multiple effects...")
        result = take_ar_photo(
            filter_type='sepia',
            custom_text='AR Effects Test',
            frame_style='polaroid',
            ar_face_effect='glasses',
            show_timestamp=True,
            trigger_led=False
        )
        
        if result['status'] == 'success':
            print(f"✅ AR photo with effects captured: {result['filename']}")
            print(f"   Effects applied: {result['effects_applied']}")
        else:
            print(f"❌ AR photo with effects failed: {result['message']}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ AR photo capture failed with exception: {e}")
        return False

def test_photo_management():
    """Test photo management functions"""
    print("\n📁 Testing Photo Management...")
    
    try:
        # Test photo list
        ar_photos = get_ar_photo_list()
        print(f"✅ Found {len(ar_photos)} AR photos")
        
        # Test latest photo
        latest = get_latest_ar_photo()
        if latest:
            print(f"✅ Latest AR photo: {latest}")
        else:
            print("ℹ️  No AR photos found yet (this is normal for first run)")
        
        return True
        
    except Exception as e:
        print(f"❌ Photo management failed: {e}")
        return False

def test_web_interface_components():
    """Test web interface components can be imported and used"""
    print("\n🌐 Testing Web Interface Components...")
    
    try:
        from Python.Web.web_ui import app
        print("✅ Flask app imports successfully")
        
        # Test if we can create app context
        with app.app_context():
            print("✅ Flask app context works")
        
        return True
        
    except Exception as e:
        print(f"❌ Web interface components failed: {e}")
        return False

def run_comprehensive_test():
    """Run all tests and provide summary"""
    print("🚀 Starting AR Photo System Comprehensive Test")
    print("=" * 60)
    
    tests = [
        ("Camera Connection", test_camera),
        ("Arduino Connection", test_arduino),
        ("Face Detection", test_face_detection),
        ("Image Filters", test_image_filters),
        ("AR Photo Capture", test_ar_photo_capture),
        ("Photo Management", test_photo_management),
        ("Web Interface", test_web_interface_components)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        print("-" * 40)
        
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<25} {status}")
        if result:
            passed += 1
    
    print("-" * 40)
    print(f"Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Your AR Photo System is ready!")
        print("\nNext steps:")
        print("1. Run: python Python/Web/web_ui.py")
        print("2. Open browser to: http://localhost:5000")
        print("3. Start taking AR photos!")
    elif passed >= total * 0.7:  # 70% pass rate
        print("\n⚠️  Most tests passed - system should work with minor issues")
        print("Check failed tests above for details")
    else:
        print("\n❌ Multiple test failures - check configuration and dependencies")
        print("Refer to AR_README.md for troubleshooting")
    
    print("\n📝 For detailed setup instructions, see AR_README.md")
    
    return passed == total

if __name__ == "__main__":
    print("🎭 AR Photo System Test Suite")
    print(f"Python version: {sys.version}")
    print(f"OpenCV version: {cv2.__version__}")
    print(f"Working directory: {os.getcwd()}")
    
    success = run_comprehensive_test()
    
    if success:
        print("\n🚀 System ready for AR photo capture!")
    else:
        print("\n🔧 System needs attention before use")
    
    sys.exit(0 if success else 1)