import time
import serial
import serial.tools.list_ports
import socket
import os
import glob
import cv2
import numpy as np
from flask import Flask, render_template_string, request, send_file, Response
from threading import Lock, Thread
import threading


# --- Globale variabler ---
app = Flask(__name__)
arduino_serial = None
serial_lock = Lock()
camera_lock = Lock()
camera = None
camera_active = False

# --- HTML og CSS for web-grensesnittet ---
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔧 Pi-Arduino Live Kontrollpanel</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; padding: 15px; min-height: 100vh;
        }
        .container {
            background: white; padding: 30px; border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 1200px; margin: 0 auto;
        }
        h1 {
            color: #333; text-align: center; margin-bottom: 30px;
            font-size: 2.2em; font-weight: 300;
        }
        .main-grid {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 30px; align-items: start;
        }
        .camera-section {
            text-align: center;
        }
        .camera-feed {
            width: 100%; max-width: 480px; height: 320px;
            border: 3px solid #007bff; border-radius: 15px;
            background: #f8f9fa; object-fit: cover;
            box-shadow: 0 8px 25px rgba(0,123,255,0.3);
        }
        .controls-section {
            display: flex; flex-direction: column; gap: 20px;
        }
        .led-status {
            display: flex; align-items: center; justify-content: center;
            margin: 20px 0; font-size: 1.1em; padding: 15px;
            background: rgba(108, 117, 125, 0.1); border-radius: 10px;
        }
        .led-indicator {
            width: 20px; height: 20px; border-radius: 50%;
            background-color: #ccc; margin-right: 10px;
            border: 2px solid #999; transition: all 0.3s;
        }
        .led-indicator.on { 
            background-color: #4CAF50; border-color: #45a049; 
            box-shadow: 0 0 20px #4CAF50; 
        }
        .button-group, .blink-group, .camera-controls {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .section-title {
            text-align: center; color: #666; margin: 20px 0 15px 0;
            font-size: 1.1em; font-weight: 600;
        }
        button {
            background: linear-gradient(45deg, #007bff, #0056b3);
            color: white; border: none; padding: 15px 10px;
            border-radius: 12px; font-size: 14px; font-weight: 600;
            cursor: pointer; transition: all 0.3s;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,123,255,0.3);
        }
        button:active { transform: translateY(0); }
        .btn-on { background: linear-gradient(45deg, #28a745, #20c997); }
        .btn-off { background: linear-gradient(45deg, #dc3545, #c82333); }
        .btn-blink { background: linear-gradient(45deg, #ffc107, #e0a800); }
        .btn-blink-fast { background: linear-gradient(45deg, #ff6b35, #f7931e); }
        .btn-blink-slow { background: linear-gradient(45deg, #17a2b8, #138496); }
        .btn-blink-sos { background: linear-gradient(45deg, #dc3545, #c82333); }
        .btn-photo {
            grid-column: 1 / -1;
            background: linear-gradient(45deg, #6f42c1, #e83e8c);
            font-size: 16px; padding: 18px;
        }
        .btn-camera { background: linear-gradient(45deg, #fd7e14, #e55a00); }
        .status {
            background: rgba(108, 117, 125, 0.1);
            text-align: center; padding: 15px;
            margin: 20px 0; border-radius: 10px;
            font-weight: 600; color: #495057;
            border-left: 4px solid #007bff;
        }
        .stats {
            display: grid; grid-template-columns: 1fr 1fr 1fr;
            gap: 15px; margin: 20px 0;
        }
        .stat-card {
            background: rgba(108, 117, 125, 0.05);
            padding: 15px; border-radius: 10px; text-align: center;
            border: 1px solid rgba(0,123,255,0.2);
        }
        .stat-value {
            font-size: 1.5em; font-weight: bold; color: #007bff;
        }
        .stat-label {
            font-size: 0.9em; color: #666; margin-top: 5px;
        }
        .photo-gallery {
            grid-column: 1 / -1; margin-top: 30px; text-align: center;
        }
        .photo-gallery img {
            max-width: 100%; height: auto; max-height: 300px;
            border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            margin-top: 15px;
        }
        @media (max-width: 800px) {
            .main-grid { grid-template-columns: 1fr; }
            .button-group, .blink-group, .camera-controls { grid-template-columns: 1fr; }
            .btn-photo { grid-column: 1; }
            .stats { grid-template-columns: 1fr; }
        }
    </style>
    <script>
        // Auto-refresh kamera feed hver 100ms
        setInterval(function() {
            const img = document.getElementById('camera-feed');
            if (img) {
                const timestamp = new Date().getTime();
                img.src = '/video_feed?' + timestamp;
            }
        }, 100);
        
        // Real-time status opdatering
        function refreshStatus() {
            fetch('/status')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('uptime').textContent = data.uptime;
                    document.getElementById('photos-taken').textContent = data.photos_taken;
                    document.getElementById('commands-sent').textContent = data.commands_sent;
                })
                .catch(error => console.log('Status update failed:', error));
        }
        
        setInterval(refreshStatus, 5000);
        window.onload = refreshStatus;
    </script>
</head>
<body>
    <div class="container">
        <h1>🔧 Arduino Live Kontrollpanel</h1>
        
        <div class="main-grid">
            <div class="camera-section">
                <h3 class="section-title">📹 Live Kamera</h3>
                <img id="camera-feed" class="camera-feed" src="/video_feed" alt="Live Camera Feed">
                
                <div class="section-title">📊 Statistikk</div>
                <div class="stats">
                    <div class="stat-card">
                        <div id="uptime" class="stat-value">--</div>
                        <div class="stat-label">Oppetid</div>
                    </div>
                    <div class="stat-card">
                        <div id="photos-taken" class="stat-value">{{ photos_taken or 0 }}</div>
                        <div class="stat-label">Bilder tatt</div>
                    </div>
                    <div class="stat-card">
                        <div id="commands-sent" class="stat-value">{{ commands_sent or 0 }}</div>
                        <div class="stat-label">Kommandoer</div>
                    </div>
                </div>
            </div>
            
            <div class="controls-section">
                <div class="led-status">
                    <div class="led-indicator {{ 'on' if led_on else '' }}"></div>
                    <span>LED Status: {{ 'PÅ' if led_on else 'AV' }}</span>
                </div>
                
                <div class="status">{{ status }}</div>
                
                <form method="post" action="/">
                    <h3 class="section-title">💡 LED Kontroll</h3>
                    <div class="button-group">
                        <button class="btn-on" name="action" value="on">💡 LED På</button>
                        <button class="btn-off" name="action" value="off">⚫ LED Av</button>
                    </div>
                    
                    <h3 class="section-title">⚡ Blink-alternativer</h3>
                    <div class="blink-group">
                        <button class="btn-blink" name="action" value="blink">⚡ Normal</button>
                        <button class="btn-blink-fast" name="action" value="blink_fast">⚡⚡ Rask</button>
                        <button class="btn-blink-slow" name="action" value="blink_slow">🐌 Langsom</button>
                        <button class="btn-blink-sos" name="action" value="blink_sos">🆘 SOS</button>
                    </div>
                    
                    <h3 class="section-title">📸 Kamera</h3>
                    <div class="camera-controls">
                        <button class="btn-photo" name="action" value="photo">📸 Ta Bilde</button>
                    </div>
                </form>
            </div>
            
            {% if latest_photo %}
            <div class="photo-gallery">
                <h3>📷 Siste bilde:</h3>
                <img src="/photo/{{ latest_photo }}" alt="Siste bilde">
            </div>
            {% endif %}
        </div>
    </div>
</body>
</html>
"""

def find_arduino_port():
    """Finner serieporten Arduinoen er koblet til."""
    ports = serial.tools.list_ports.comports()
    for port in ports:
        # Arduino har ofte 'Arduino' i beskrivelsen eller en spesifikk VID/PID
        if "Arduino" in port.description or (port.vid == 0x2341 and port.pid == 0x0043):
            print(f"Fant Arduino på port: {port.device}")
            return port.device
    print("Fant ingen Arduino. Sjekk tilkoblingen.")
    return None

def send_arduino_command(command):
    """Sender en kommando til Arduino og venter på 'ok'."""
    with serial_lock:
        if arduino_serial and arduino_serial.is_open:
            try:
                print(f"Sender kommando: {command}")
                arduino_serial.write(command.encode('utf-8'))
                # Vent på en bekreftelse fra Arduino
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
    """Slår på lys, tar bilde med USB-webcam, og slår av lyset."""
    print("Starter bilde-sekvens...")
    send_arduino_command("on")
    time.sleep(1) # Gi lyset tid til å slå seg på

    try:
        
        # Åpne webcam (vanligvis /dev/video0 eller 0)
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            # Prøv andre kamera-indekser
            for i in range(1, 4):
                cap = cv2.VideoCapture(i)
                if cap.isOpened():
                    print(f"Fant webcam på indeks {i}")
                    break
            else:
                return "❌ Ingen webcam funnet"
        
        # Still inn oppløsning
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        # Gi kameraet tid til å fokusere
        for i in range(10):
            ret, frame = cap.read()
            time.sleep(0.1)
        
        # Ta det faktiske bildet
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
            
    except ImportError:
        # Hvis OpenCV ikke er installert, prøv Raspberry Pi kamera som backup
        try:
            from picamera2 import Picamera2
            picam2 = Picamera2()
            config = picam2.create_still_configuration()
            picam2.configure(config)
            
            picam2.start()
            time.sleep(2)
            
            timestamp = time.strftime("%Y-%m-%d_%H-%M-%S")
            filename = f"photo_{timestamp}.jpg"
            picam2.capture_file(filename)
            print(f"Bilde lagret som {filename}")
            
            picam2.stop()
            return f"📸 Bilde lagret (Pi cam): {filename}"
        except Exception as e:
            print(f"Pi-kamera feil: {e}")
            return "❌ Ingen kamera tilgjengelig"
            
    except Exception as e:
        print(f"Webcam-feil: {e}")
        return f"❌ Webcam-feil: {e}"
    finally:
        time.sleep(0.5)
        send_arduino_command("off") # Slå alltid av lyset etterpå

# Global variabel for å holde styr på LED-status og statistikker
led_status = False
start_time = time.time()
commands_sent = 0
photos_taken = 0

def init_camera():
    """Initialiserer kamera for live streaming."""
    global camera, camera_active
    with camera_lock:
        if camera is None:
            try:
                camera = cv2.VideoCapture(0)
                if not camera.isOpened():
                    # Prøv andre indekser
                    for i in range(1, 4):
                        camera = cv2.VideoCapture(i)
                        if camera.isOpened():
                            print(f"📹 Webcam funnet på indeks {i}")
                            break
                    else:
                        print("❌ Ingen webcam funnet")
                        return False
                
                # Still inn kamera-innstillinger
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
    """Generator som produserer video-frames for streaming."""
    global camera
    while True:
        if camera_active and camera is not None:
            with camera_lock:
                success, frame = camera.read()
                if success:
                    # Legg til overlays
                    cv2.putText(frame, f"LED: {'ON' if led_status else 'OFF'}", 
                               (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, 
                               (0, 255, 0) if led_status else (0, 0, 255), 2)
                    
                    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                    cv2.putText(frame, timestamp, (10, frame.shape[0]-10), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                    
                    # Encoder til JPEG
                    ret, buffer = cv2.imencode('.jpg', frame)
                    if ret:
                        frame_bytes = buffer.tobytes()
                        yield (b'--frame\r\n'
                               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        else:
            # Vis "No Camera" bilde hvis kamera ikke er tilgjengelig
            no_cam_frame = create_no_camera_frame()
            ret, buffer = cv2.imencode('.jpg', no_cam_frame)
            if ret:
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        time.sleep(0.03)  # ~30 FPS

def create_no_camera_frame():
    """Lager en frame som vises når kamera ikke er tilgjengelig."""
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    frame[:] = (50, 50, 50)  # Mørk grå bakgrunn
    
    text = "Kamera ikke tilgjengelig"
    text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 1, 2)[0]
    text_x = (frame.shape[1] - text_size[0]) // 2
    text_y = (frame.shape[0] + text_size[1]) // 2
    
    cv2.putText(frame, text, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    cv2.putText(frame, "Koble til USB webcam", (text_x-50, text_y+40), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 1)
    
    return frame

def get_uptime():
    """Returnerer oppetid i et lesbart format."""
    uptime_seconds = int(time.time() - start_time)
    hours = uptime_seconds // 3600
    minutes = (uptime_seconds % 3600) // 60
    seconds = uptime_seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

def get_latest_photo():
    """Finner det siste bildet som ble tatt."""
    photo_files = glob.glob("photo_*.jpg")
    if photo_files:
        return max(photo_files, key=os.path.getctime)
    return None

@app.route('/', methods=['GET', 'POST'])
def index():
    global led_status, commands_sent, photos_taken
    status = "🟢 Klar for kommandoer"
    
    if request.method == 'POST':
        action = request.form.get('action')
        commands_sent += 1  # Øk kommando-teller
        
        if action == 'on':
            send_arduino_command(action)
            led_status = True
            status = "💡 LED er nå slått PÅ"
        elif action == 'off':
            send_arduino_command(action)
            led_status = False
            status = "⚫ LED er nå slått AV"
        elif action == 'blink':
            send_arduino_command(action)
            status = "⚡ LED blinker normalt (3x)"
        elif action == 'blink_fast':
            send_arduino_command(action)
            status = "⚡⚡ LED blinker raskt (6x)"
        elif action == 'blink_slow':
            send_arduino_command(action)
            status = "⚡ LED blinker sakte (3x)"
        elif action == 'blink_sos':
            send_arduino_command(action)
            status = "🆘 LED blinker SOS-signal"
        elif action == 'photo':
            status = take_photo()
            photos_taken += 1  # Øk foto-teller
        else:
            status = "❌ Ukjent kommando"
    
    latest_photo = get_latest_photo()
    if latest_photo:
        latest_photo = os.path.basename(latest_photo)
    
    return render_template_string(HTML_TEMPLATE, 
                                  status=status, 
                                  led_on=led_status,
                                  latest_photo=latest_photo,
                                  photos_taken=photos_taken,
                                  commands_sent=commands_sent)

@app.route('/photo/<filename>')
def serve_photo(filename):
    """Serverer bilder til web-grensesnittet."""
    return send_file(filename)

@app.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def status():
    """API endpoint for live statusoppdateringer."""
    from flask import jsonify
    return jsonify({
        'uptime': get_uptime(),
        'photos_taken': photos_taken,
        'commands_sent': commands_sent,
        'led_status': led_status,
        'camera_active': camera_active
    })

def get_ip_address():
    """Finner den lokale IP-adressen til maskinen."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

if __name__ == '__main__':
    print("🚀 Starter Raspberry Pi Arduino Kontrollpanel...")
    
    # Initialiser kamera
    print("📹 Initialiserer kamera...")
    init_camera()
    
    # Finn og koble til Arduino
    port_name = find_arduino_port()
    if port_name:
        try:
            arduino_serial = serial.Serial(port_name, 9600, timeout=2)
            time.sleep(2) # La Arduinoen starte opp
            print("✅ Arduino serieforbindelse etablert.")
            
            ip_address = get_ip_address()
            print("\n" + "="*60)
            print("🎉 LIVE KONTROLLPANEL KLAR! 🎉")
            print("="*60)
            print(f"📱 Web-grensesnitt: http://{ip_address}:5000")
            print(f"📹 Live kamerafeed: Aktivert")
            print(f"🔧 Arduino: Tilkoblet på {port_name}")
            print(f"📊 Statistikker: Real-time oppdatering")
            print("="*60)
            print("💡 Funksjoner:")
            print("   • Live kamera-streaming")
            print("   • LED kontroll (På/Av + 4 blink-mønstre)")
            print("   • Ta høyoppløselige bilder")
            print("   • Real-time statistikker")
            print("   • Responsivt design (mobil/desktop)")
            print("="*60)
            print("🚀 Trykk Ctrl+C for å stoppe serveren")
            print("")
            
            app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
            
        except serial.SerialException as e:
            print(f"❌ Kunne ikke åpne Arduino port {port_name}: {e}")
            print("🔧 Kjører kun med kamerafunksjoner (uten Arduino)")
            
            ip_address = get_ip_address()
            print(f"\n📱 Web-grensesnitt: http://{ip_address}:5000")
            app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
        finally:
            if arduino_serial and arduino_serial.is_open:
                arduino_serial.close()
                print("📡 Arduino serieforbindelse lukket.")
            if camera:
                camera.release()
                print("📹 Kamera frigjort.")
    else:
        print("⚠️ Ingen Arduino funnet, kjører kun med kamerafunksjoner")
        ip_address = get_ip_address()
        print(f"📱 Web-grensesnitt: http://{ip_address}:5000")
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)