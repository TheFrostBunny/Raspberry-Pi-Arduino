# core_logic.py
import time
import serial
import serial.tools.list_ports
import socket
import os
import glob
import cv2
import numpy as np
from threading import Lock
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import json

# --- Globale variabler ---
arduino_serial = None
serial_lock = Lock()
camera_lock = Lock()
camera = None
camera_active = False
led_status = False
start_time = time.time()
commands_sent = 0
photos_taken = 0

# --- Konfigurasjon fra config.json ---
CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.json')
try:
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        config = json.load(f)
except Exception:
    config = {
        "enable_arduino": True,
        "enable_web": True,
        "enable_ar": True,
        "enable_filters": True,
        "enable_face_detection": True,
        "enable_led_on_photo": True
    }

def find_arduino_port():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if "Arduino" in port.description or (port.vid == 0x2341 and port.pid == 0x0043):
            print(f"Fant Arduino på port: {port.device}")
            return port.device
    print("Fant ingen Arduino. Sjekk tilkoblingen.")
    return None

def send_arduino_command(command):
    if not config.get("enable_arduino", True):
        print(f"[config] Arduino er deaktivert, ignorerer kommando: {command}")
        return "Arduino disabled by config"
    global arduino_serial
    with serial_lock:
        # Åpne porten automatisk hvis ikke åpen
        if not (arduino_serial and arduino_serial.is_open):
            port = find_arduino_port()
            if port:
                try:
                    arduino_serial = serial.Serial(port, 9600, timeout=2)
                    time.sleep(2)  # Gi Arduino tid til å resette
                    print(f"Koblet til Arduino på {port}")
                except Exception as e:
                    print(f"Kunne ikke åpne Arduino-port: {e}")
                    return "Serial Not Available"
            else:
                print("Fant ingen Arduino-port.")
                return "Not Connected"
        try:
            print(f"Sender kommando: {command}")
            arduino_serial.write(command.encode('utf-8'))
            response = arduino_serial.readline().decode('utf-8').strip()
            print(f"Arduino svarte: {response}")
            return response
        except serial.SerialException as e:
            print(f"Feil ved seriekommunikasjon: {e}")
            return "Serial Error"

def take_photo():
    print("Starter bilde-sekvens...")
    if config.get("enable_led_on_photo", True):
        send_arduino_command("on")
        time.sleep(1)
    try:
        global camera, camera_active, camera_lock
        use_global_camera = camera_active and camera is not None
        if use_global_camera:
            with camera_lock:
                # Bruk kamera fra livestream
                for i in range(10):
                    ret, frame = camera.read()
                    time.sleep(0.1)
                ret, frame = camera.read()
        else:
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                for i in range(1, 4):
                    cap = cv2.VideoCapture(i)
                    if cap.isOpened():
                        print(f"Fant webcam på indeks {i}")
                        break
                else:
                    return "❌ Ingen webcam funnet"
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            for i in range(10):
                ret, frame = cap.read()
                time.sleep(0.1)
            ret, frame = cap.read()
            cap.release()
        if ret:
            timestamp = time.strftime("%Y-%m-%d_%H-%M-%S")
            filename = f"photo_{timestamp}.jpg"
            cv2.imwrite(filename, frame)
            print(f"Bilde lagret som {filename}")
            return f"📸 Bilde lagret: {filename}"
        else:
            return "❌ Kunne ikke ta bilde"
    except Exception as e:
        print(f"Webcam-feil: {e}")
        return f"❌ Webcam-feil: {e}"
    finally:
        if config.get("enable_led_on_photo", True):
            time.sleep(0.5)
            send_arduino_command("off")
# Funksjon for å stoppe kameraet (frigjør ressursen)
def stop_camera():
    global camera, camera_active
    with camera_lock:
        if camera is not None:
            camera.release()
            camera = None
            camera_active = False
            print("Kamera stoppet og frigjort")

def get_latest_photo():
    photo_files = glob.glob("photo_*.jpg")
    if photo_files:
        return max(photo_files, key=os.path.getctime)
    return None

def get_uptime():
    uptime_seconds = int(time.time() - start_time)
    hours = uptime_seconds // 3600
    minutes = (uptime_seconds % 3600) // 60
    seconds = uptime_seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

def init_camera():
    global camera, camera_active
    with camera_lock:
        if camera is None:
            try:
                camera = cv2.VideoCapture(0)
                if not camera.isOpened():
                    for i in range(1, 4):
                        camera = cv2.VideoCapture(i)
                        if camera.isOpened():
                            print(f"📹 Webcam funnet på indeks {i}")
                            break
                    else:
                        print("❌ Ingen webcam funnet")
                        return False
                camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                camera.set(cv2.CAP_PROP_FPS, 30)
                camera_active = True
                print("✅ Kamera initialisert for live streaming")
                return True
            except Exception as e:
                print(f"❌ Kamera-initialiseringsfeil: {e}")
                return False
        return camera_active

def generate_frames():
    global camera, led_status, camera_active
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    while True:
        if camera_active and camera is not None:
            with camera_lock:
                success, frame = camera.read()
                if success:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
                    for (x, y, w, h) in faces:
                        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
                        cv2.putText(frame, 'Ansikt', (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                    cv2.putText(frame, f"LED: {'ON' if led_status else 'OFF'}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0) if led_status else (0, 0, 255), 2)
                    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                    cv2.putText(frame, timestamp, (10, frame.shape[0]-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                    ret, buffer = cv2.imencode('.jpg', frame)
                    if ret:
                        frame_bytes = buffer.tobytes()
                        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        else:
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            frame[:] = (50, 50, 50)
            text = "Kamera ikke tilgjengelig"
            text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 1, 2)[0]
            text_x = (frame.shape[1] - text_size[0]) // 2
            text_y = (frame.shape[0] + text_size[1]) // 2
            cv2.putText(frame, text, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            cv2.putText(frame, "Koble til USB webcam", (text_x-50, text_y+40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 1)
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.03)


# ===== AR PHOTO FUNCTIONS =====

def apply_filter(frame, filter_type):
    """Apply different filters to the image"""
    if filter_type == 'grayscale':
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    
    elif filter_type == 'blur':
        return cv2.GaussianBlur(frame, (15, 15), 0)
    
    elif filter_type == 'sepia':
        kernel = np.array([[0.272, 0.534, 0.131],
                          [0.349, 0.686, 0.168],
                          [0.393, 0.769, 0.189]])
        return cv2.transform(frame, kernel)
    
    elif filter_type == 'vintage':
        # Apply a warm color cast
        frame = cv2.add(frame, np.array([10, 20, 30]))
        return np.clip(frame, 0, 255).astype(np.uint8)
    
    elif filter_type == 'cool':
        # Apply a cool color cast
        frame = cv2.add(frame, np.array([30, 20, 10]))
        return np.clip(frame, 0, 255).astype(np.uint8)
    
    return frame

def add_text_overlay(frame, custom_text=None, show_timestamp=True):
    """Add text overlays to the image"""
    height, width = frame.shape[:2]
    
    # Add timestamp
    if show_timestamp:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, timestamp, (10, height - 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, timestamp, (10, height - 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
    
    # Add custom text
    if custom_text:
        text_size = cv2.getTextSize(custom_text, cv2.FONT_HERSHEY_SIMPLEX, 1.2, 2)[0]
        text_x = (width - text_size[0]) // 2
        text_y = height - 60
        
        # Add shadow effect
        cv2.putText(frame, custom_text, (text_x + 2, text_y + 2), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 0), 3)
        cv2.putText(frame, custom_text, (text_x, text_y), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 0), 2)
    
    return frame

def add_frame_overlay(frame, frame_type='polaroid'):
    """Add decorative frames to the image"""
    height, width = frame.shape[:2]
    overlay = frame.copy()
    
    if frame_type == 'polaroid':
        # Create a polaroid-style frame
        border_size = 20
        bottom_border = 60
        
        # White border
        cv2.rectangle(overlay, (0, 0), (width, height), (255, 255, 255), border_size)
        cv2.rectangle(overlay, (0, height - bottom_border), (width, height), 
                     (255, 255, 255), -1)
        
        # Add "POLAROID" text at bottom
        text = "📸 RASPBERRY PI CAMERA"
        text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
        text_x = (width - text_size[0]) // 2
        cv2.putText(overlay, text, (text_x, height - 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 100, 100), 1)
    
    elif frame_type == 'vintage':
        # Create vintage corner decorations
        corner_size = 30
        cv2.ellipse(overlay, (corner_size, corner_size), (corner_size, corner_size), 
                   180, 0, 90, (139, 69, 19), 3)
        cv2.ellipse(overlay, (width - corner_size, corner_size), (corner_size, corner_size), 
                   270, 0, 90, (139, 69, 19), 3)
        cv2.ellipse(overlay, (corner_size, height - corner_size), (corner_size, corner_size), 
                   90, 0, 90, (139, 69, 19), 3)
        cv2.ellipse(overlay, (width - corner_size, height - corner_size), (corner_size, corner_size), 
                   0, 0, 90, (139, 69, 19), 3)
    
    return overlay

def detect_faces_for_ar(frame):
    """Detect faces and return coordinates for AR placement"""
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    return faces

def add_ar_elements_to_faces(frame, faces, ar_type='glasses'):
    """Add AR elements to detected faces"""
    for (x, y, w, h) in faces:
        if ar_type == 'glasses':
            # Simple glasses effect
            glasses_width = int(w * 0.8)
            glasses_height = int(h * 0.3)
            glasses_x = x + (w - glasses_width) // 2
            glasses_y = y + int(h * 0.35)
            
            # Draw glasses frames
            cv2.rectangle(frame, (glasses_x, glasses_y), 
                         (glasses_x + glasses_width // 2 - 5, glasses_y + glasses_height), 
                         (0, 0, 0), 3)
            cv2.rectangle(frame, (glasses_x + glasses_width // 2 + 5, glasses_y), 
                         (glasses_x + glasses_width, glasses_y + glasses_height), 
                         (0, 0, 0), 3)
            # Bridge
            cv2.line(frame, (glasses_x + glasses_width // 2 - 5, glasses_y + 10), 
                    (glasses_x + glasses_width // 2 + 5, glasses_y + 10), (0, 0, 0), 3)
        
        elif ar_type == 'hat':
            # Simple hat effect
            hat_width = int(w * 1.2)
            hat_height = int(h * 0.4)
            hat_x = x - (hat_width - w) // 2
            hat_y = y - hat_height + 10
            
            # Draw hat
            cv2.rectangle(frame, (hat_x, hat_y), 
                         (hat_x + hat_width, hat_y + hat_height), 
                         (0, 100, 200), -1)
            cv2.rectangle(frame, (hat_x - 10, hat_y + hat_height - 10), 
                         (hat_x + hat_width + 10, hat_y + hat_height + 5), 
                         (0, 80, 160), -1)
        
        elif ar_type == 'mustache':
            # Simple mustache effect
            mustache_width = int(w * 0.4)
            mustache_height = int(h * 0.15)
            mustache_x = x + (w - mustache_width) // 2
            mustache_y = y + int(h * 0.65)
            
            # Draw mustache
            cv2.ellipse(frame, (mustache_x + mustache_width // 2, mustache_y), 
                       (mustache_width // 2, mustache_height // 2), 
                       0, 0, 180, (0, 0, 0), -1)
    
    return frame

def take_ar_photo(filter_type='none', custom_text=None, frame_style='none', 
                  ar_face_effect='none', show_timestamp=True, trigger_led=True):
    if not config.get("enable_ar", True):
        return {"status": "error", "message": "AR-funksjon er deaktivert i config.json"}
    global photos_taken
    print("📸 Starter AR bilde-sekvens...")
    # Trigger Arduino LED if requested og aktivert
    if trigger_led and config.get("enable_led_on_photo", True):
        send_arduino_command("blink")
        time.sleep(0.5)
    try:
        # Initialize camera
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            for i in range(1, 4):
                cap = cv2.VideoCapture(i)
                if cap.isOpened():
                    print(f"📹 Fant webcam på indeks {i}")
                    break
            else:
                return {"status": "error", "message": "❌ Ingen webcam funnet"}
        # Set camera properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        # Capture multiple frames to let camera adjust
        for i in range(10):
            ret, frame = cap.read()
            time.sleep(0.1)
        # Capture the final frame
        ret, frame = cap.read()
        cap.release()
        if not ret:
            return {"status": "error", "message": "❌ Kunne ikke ta bilde"}
        processed_frame = frame.copy()
        # 1. Apply filters hvis aktivert
        if filter_type != 'none' and config.get("enable_filters", True):
            processed_frame = apply_filter(processed_frame, filter_type)
        # 2. Detect faces and add AR elements hvis aktivert
        faces = []
        if ar_face_effect != 'none' and config.get("enable_face_detection", True):
            faces = detect_faces_for_ar(processed_frame)
            processed_frame = add_ar_elements_to_faces(processed_frame, faces, ar_face_effect)
        # 3. Add text overlays
        processed_frame = add_text_overlay(processed_frame, custom_text, show_timestamp)
        # 4. Add frame overlay
        if frame_style != 'none':
            processed_frame = add_frame_overlay(processed_frame, frame_style)
        # Save the processed image
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"ar_photo_{timestamp}.jpg"
        filepath = os.path.join(os.getcwd(), filename)
        cv2.imwrite(filepath, processed_frame)
        photos_taken += 1
        result = {
            "status": "success",
            "message": f"📸 AR bilde lagret: {filename}",
            "filename": filename,
            "filepath": filepath,
            "effects_applied": {
                "filter": filter_type,
                "custom_text": custom_text,
                "frame_style": frame_style,
                "ar_face_effect": ar_face_effect,
                "timestamp_shown": show_timestamp,
                "faces_detected": len(faces)
            },
            "timestamp": timestamp
        }
        print(f"✅ AR bilde lagret som {filename}")
        print(f"🎨 Effekter brukt: Filter={filter_type}, Ramme={frame_style}, AR={ar_face_effect}")
        if faces:
            print(f"👥 Fant {len(faces)} ansikt(er) i bildet")
        return result
    except Exception as e:
        print(f"❌ AR bilde-feil: {e}")
        return {"status": "error", "message": f"❌ AR bilde-feil: {e}"}
    finally:
        if trigger_led and config.get("enable_led_on_photo", True):
            time.sleep(0.5)
            send_arduino_command("off")

def get_ar_photo_list():
    """Get list of AR photos with metadata"""
    ar_photos = glob.glob("ar_photo_*.jpg")
    photo_list = []
    
    for photo in ar_photos:
        stat = os.stat(photo)
        photo_info = {
            "filename": photo,
            "size": stat.st_size,
            "created": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(stat.st_ctime)),
            "path": os.path.abspath(photo)
        }
        photo_list.append(photo_info)
    
    # Sort by creation time (newest first)
    photo_list.sort(key=lambda x: x['created'], reverse=True)
    return photo_list

def get_latest_ar_photo():
    """Get the most recent AR photo"""
    ar_photos = glob.glob("ar_photo_*.jpg")
    if ar_photos:
        return max(ar_photos, key=os.path.getctime)
    return None
