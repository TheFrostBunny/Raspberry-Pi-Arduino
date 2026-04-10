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

def find_arduino_port():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if "Arduino" in port.description or (port.vid == 0x2341 and port.pid == 0x0043):
            print(f"Fant Arduino på port: {port.device}")
            return port.device
    print("Fant ingen Arduino. Sjekk tilkoblingen.")
    return None

def send_arduino_command(command):
    global arduino_serial
    with serial_lock:
        if arduino_serial and arduino_serial.is_open:
            try:
                print(f"Sender kommando: {command}")
                arduino_serial.write(command.encode('utf-8'))
                response = arduino_serial.readline().decode('utf-8').strip()
                print(f"Arduino svarte: {response}")
                return response
            except serial.SerialException as e:
                print(f"Feil ved seriekommunikasjon: {e}")
                return "Serial Error"
        else:
            print("Serieport er ikke åpen.")
            return "Not Connected"

def take_photo():
    print("Starter bilde-sekvens...")
    send_arduino_command("on")
    time.sleep(1)
    try:
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
        if ret:
            timestamp = time.strftime("%Y-%m-%d_%H-%M-%S")
            filename = f"photo_{timestamp}.jpg"
            cv2.imwrite(filename, frame)
            print(f"Bilde lagret som {filename}")
            cap.release()
            return f"📸 Bilde lagret: {filename}"
        else:
            cap.release()
            return "❌ Kunne ikke ta bilde"
    except Exception as e:
        print(f"Webcam-feil: {e}")
        return f"❌ Webcam-feil: {e}"
    finally:
        time.sleep(0.5)
        send_arduino_command("off")

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
