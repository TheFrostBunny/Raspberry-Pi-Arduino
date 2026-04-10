import time
import serial
import serial.tools.list_ports
import socket
import os
import glob
from flask import Flask, render_template_string, request, send_file
from threading import Lock

# --- Globale variabler ---
app = Flask(__name__)
arduino_serial = None
serial_lock = Lock()

# --- HTML og CSS for web-grensesnittet ---
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔧 Pi-Arduino Kontrollpanel</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; padding: 20px; min-height: 100vh;
            display: flex; justify-content: center; align-items: center;
        }
        .container {
            background: white; padding: 40px; border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 100%; max-width: 600px;
        }
        h1 {
            color: #333; text-align: center; margin-bottom: 30px;
            font-size: 2.2em; font-weight: 300;
        }
        .led-status {
            display: flex; align-items: center; justify-content: center;
            margin: 20px 0; font-size: 1.1em;
        }
        .led-indicator {
            width: 20px; height: 20px; border-radius: 50%;
            background-color: #ccc; margin-right: 10px;
            border: 2px solid #999; transition: all 0.3s;
        }
        .led-indicator.on { background-color: #4CAF50; border-color: #45a049; box-shadow: 0 0 20px #4CAF50; }
        .button-group {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 15px; margin: 30px 0;
        }
        .blink-group {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 10px; margin: 20px 0;
        }
        button {
            background: linear-gradient(45deg, #007bff, #0056b3);
            color: white; border: none; padding: 18px;
            border-radius: 12px; font-size: 16px; font-weight: 600;
            cursor: pointer; transition: all 0.3s;
            text-transform: uppercase; letter-spacing: 1px;
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
            font-size: 18px; padding: 20px;
        }
        .status {
            background: rgba(108, 117, 125, 0.1);
            text-align: center; padding: 15px;
            margin: 20px 0; border-radius: 10px;
            font-weight: 600; color: #495057;
            border-left: 4px solid #007bff;
        }
        .photo-gallery {
            margin-top: 30px; text-align: center;
        }
        .photo-gallery img {
            max-width: 100%; height: auto;
            border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            margin-top: 15px;
        }
        .photo-gallery h3 {
            color: #666; margin-bottom: 10px;
        }
        @media (max-width: 600px) {
            .container { padding: 20px; }
            .button-group { grid-template-columns: 1fr; }
            .btn-photo { grid-column: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Arduino Kontrollpanel</h1>
        
        <div class="led-status">
            <div class="led-indicator {{ 'on' if led_on else '' }}"></div>
            <span>LED Status: {{ 'PÅ' if led_on else 'AV' }}</span>
        </div>
        
        <div class="status">{{ status }}</div>
        
        <form method="post" action="/">
            <div class="button-group">
                <button class="btn-on" name="action" value="on">💡 LED På</button>
                <button class="btn-off" name="action" value="off">⚫ LED Av</button>
            </div>
            
            <h3 style="text-align: center; color: #666; margin: 25px 0 15px 0;">⚡ Blink-alternativer</h3>
            <div class="blink-group">
                <button class="btn-blink" name="action" value="blink">⚡ Normal</button>
                <button class="btn-blink-fast" name="action" value="blink_fast">⚡⚡ Rask</button>
                <button class="btn-blink-slow" name="action" value="blink_slow">🐌 Langsom</button>
                <button class="btn-blink-sos" name="action" value="blink_sos">🆘 SOS</button>
            </div>
            
            <div style="margin-top: 20px;">
                <button class="btn-photo" name="action" value="photo">📸 Ta Bilde</button>
            </div>
        </form>
        
        {% if latest_photo %}
        <div class="photo-gallery">
            <h3>📷 Siste bilde:</h3>
            <img src="/photo/{{ latest_photo }}" alt="Siste bilde">
        </div>
        {% endif %}
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
    """Slår på lys, tar bilde, og slår av lyset."""
    print("Starter bilde-sekvens...")
    send_arduino_command("on")
    time.sleep(1) # Gi lyset tid til å slå seg på

    try:
        # Importerer kamera-biblioteket her for å unngå feil hvis det ikke er installert
        from picamera2 import Picamera2
        picam2 = Picamera2()
        config = picam2.create_still_configuration()
        picam2.configure(config)
        
        picam2.start()
        time.sleep(2) # Tid for kameraet å justere seg
        
        timestamp = time.strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"photo_{timestamp}.jpg"
        picam2.capture_file(filename)
        print(f"Bilde lagret som {filename}")
        
        picam2.stop()
        return f"Bilde lagret: {filename}"
    except ImportError:
        print("picamera2 er ikke installert. Kan ikke ta bilde.")
        return "Kamera-bibliotek mangler"
    except Exception as e:
        print(f"Kamerafeil: {e}")
        return f"Kamerafeil: {e}"
    finally:
        time.sleep(0.5)
        send_arduino_command("off") # Slå alltid av lyset etterpå

# Global variabel for å holde styr på LED-status
led_status = False

def get_latest_photo():
    """Finner det siste bildet som ble tatt."""
    photo_files = glob.glob("photo_*.jpg")
    if photo_files:
        return max(photo_files, key=os.path.getctime)
    return None

@app.route('/', methods=['GET', 'POST'])
def index():
    global led_status
    status = "🟢 Klar for kommandoer"
    
    if request.method == 'POST':
        action = request.form.get('action')
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
        else:
            status = "❌ Ukjent kommando"
    
    latest_photo = get_latest_photo()
    if latest_photo:
        latest_photo = os.path.basename(latest_photo)
    
    return render_template_string(HTML_TEMPLATE, 
                                  status=status, 
                                  led_on=led_status,
                                  latest_photo=latest_photo)

@app.route('/photo/<filename>')
def serve_photo(filename):
    """Serverer bilder til web-grensesnittet."""
    return send_file(filename)

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
    port_name = find_arduino_port()
    if port_name:
        try:
            arduino_serial = serial.Serial(port_name, 9600, timeout=2)
            time.sleep(2) # La Arduinoen starte opp
            print("Serieforbindelse etablert.")
            
            ip_address = get_ip_address()
            print("\n----------------------------------------------------")
            print("Web-serveren er klar!")
            print(f"Åpne denne adressen i en nettleser:")
            print(f"http://{ip_address}:5000")
            print("----------------------------------------------------\n")
            
            app.run(host='0.0.0.0', port=5000)
            
        except serial.SerialException as e:
            print(f"Kunne ikke åpne port {port_name}: {e}")
        finally:
            if arduino_serial and arduino_serial.is_open:
                arduino_serial.close()
                print("Serieport lukket.")
    else:
        print("Avslutter, fant ingen Arduino.")