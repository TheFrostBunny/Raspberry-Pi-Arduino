# 🎭 AR Photo Capture System

## Overview
This enhanced Raspberry Pi project now includes **Augmented Reality (AR) photo capture** functionality with OpenCV, face detection, and various digital effects.

## 🆕 New AR Features

### 📸 AR Photo Effects
- **Image Filters**: Grayscale, blur, sepia, vintage, cool tones
- **Text Overlays**: Custom messages + timestamps with shadow effects
- **Frame Styles**: Polaroid and vintage decorative frames
- **Face Detection AR**: Automatic glasses, hats, and mustache overlays

### 🎨 Available Effects

#### Image Filters
- `none` - No filter applied
- `grayscale` - Black and white effect
- `blur` - Gaussian blur effect
- `sepia` - Warm brown tones
- `vintage` - Retro color adjustment
- `cool` - Cool blue tones

#### Face AR Effects
- `none` - No face effects
- `glasses` - Virtual glasses overlay
- `hat` - Virtual hat placement
- `mustache` - Virtual mustache effect

#### Frame Styles
- `none` - No frame
- `polaroid` - Classic instant photo frame
- `vintage` - Decorative corner elements

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
cd Python
pip install -r requirements.txt
```

### 2. Run the Application
```bash
python Web/web_ui.py
```

### 3. Access Web Interface
Open your browser to: `http://your-raspberry-pi-ip:5000`

## 🎮 Usage Instructions

### Basic Usage
1. **Live Stream**: View real-time camera feed with face detection
2. **Regular Photos**: Click "Ta vanlig bilde" for standard photos
3. **AR Photos**: Configure effects and click "Ta AR Foto!"

### AR Photo Configuration
1. **Choose Filter**: Select image processing filter
2. **Pick Face Effect**: Choose AR overlay for detected faces
3. **Select Frame**: Add decorative frame to photo
4. **Add Text**: Enter custom message (optional)
5. **Options**: Toggle timestamp and LED flash

### Web Interface Features
- **Live Camera Stream**: Real-time preview with face detection
- **AR Photo Gallery**: View all captured AR photos
- **Arduino Integration**: LED controls and photo triggers
- **Responsive Design**: Works on desktop and mobile

## 📁 File Structure
```
Python/
├── core_logic.py          # Enhanced with AR functions
├── requirements.txt       # Updated dependencies
└── Web/
    └── web_ui.py         # Enhanced web interface
```

## 🔧 AR Functions Reference

### Core AR Functions
```python
# Take AR photo with effects
take_ar_photo(
    filter_type='sepia',
    custom_text='Hello World!',
    frame_style='polaroid',
    ar_face_effect='glasses',
    show_timestamp=True,
    trigger_led=True
)

# Get AR photo list
ar_photos = get_ar_photo_list()

# Apply individual effects
filtered_image = apply_filter(image, 'vintage')
faces = detect_faces_for_ar(image)
ar_image = add_ar_elements_to_faces(image, faces, 'hat')
```

## 🎯 Technical Details

### Face Detection
- Uses OpenCV's Haar Cascade classifier
- Detects frontal faces (minimum 60x60 pixels)
- Returns face coordinates for AR placement

### Image Processing
- Resolution: 1280x720 (configurable)
- Format: JPEG output
- Color space: BGR (OpenCV standard)

### AR Rendering
- Real-time face detection in live stream
- Static AR effects in captured photos
- Scalable effects based on face size

## 🔧 Arduino Integration

### LED Control
- `on` - Turn LED on
- `off` - Turn LED off
- `blink` - Standard blink pattern
- `blink_fast` - Fast blink (6x)
- `blink_slow` - Slow blink pattern
- `blink_sos` - SOS signal pattern

### Photo Triggers
- LED blinks automatically when AR photo is taken
- Configurable through web interface
- Arduino feedback via serial communication

## 🌐 API Endpoints

### Web Routes
- `/` - Main interface
- `/ar_photos` - AR photo gallery
- `/video_feed` - Live camera stream
- `/photo/<filename>` - Serve photo files
- `/status` - System status JSON

### Status API Response
```json
{
    "uptime": "01:23:45",
    "photos_taken": 15,
    "commands_sent": 42,
    "led_status": true,
    "camera_active": true,
    "ar_photos_count": 8,
    "latest_ar_photo": "ar_photo_2026-04-15_14-30-22.jpg"
}
```

## 🎨 Customization Ideas

### Enhanced AR Elements
- Add PNG overlay images for better graphics
- Implement face landmark detection for precise placement
- Create animated effects
- Add face recognition for personalized AR

### Additional Filters
```python
# Extend apply_filter function with:
# - Edge detection
# - Cartoon effect
# - HDR simulation
# - Color channel adjustments
```

### Advanced Features
- Motion detection triggers
- Multiple face AR support
- Face swap capabilities
- Real-time AR preview

## 🛠️ Troubleshooting

### Common Issues
1. **No Camera Detected**: Check USB connection and permissions
2. **Face Detection Slow**: Reduce image resolution or adjust parameters
3. **Arduino Not Responding**: Verify serial port and baud rate
4. **Web Interface Not Loading**: Check Flask server status and port 5000

### Performance Tips
- Use adequate lighting for face detection
- Position faces close to camera for better AR placement
- Close unnecessary applications to improve processing speed
- Use wired connection for stable streaming

## 📸 Example Usage

### Command Line Testing
```python
from Python.core_logic import take_ar_photo

# Simple AR photo with glasses
result = take_ar_photo(ar_face_effect='glasses')

# Complex AR photo with multiple effects
result = take_ar_photo(
    filter_type='vintage',
    custom_text='Raspberry Pi Rules!',
    frame_style='polaroid',
    ar_face_effect='hat',
    show_timestamp=True,
    trigger_led=True
)

print(result['message'])  # Success/error message
print(result['filename']) # Output filename
```

## 🔮 Future Enhancements
- [ ] Real-time AR effects in live stream
- [ ] Face recognition database
- [ ] Motion-triggered photo capture
- [ ] Social media integration
- [ ] Voice command support
- [ ] Mobile app companion

## 🆘 Support
For issues or questions:
1. Check camera and Arduino connections
2. Verify all dependencies are installed
3. Test basic photo capture before AR features
4. Monitor console output for error messages

---
**Built with**: Raspberry Pi + Arduino + OpenCV + Flask + HTML5
**Requirements**: Python 3.7+, USB Camera, Arduino with LED