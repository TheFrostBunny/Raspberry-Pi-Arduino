# web_ui.py
from flask import Flask, render_template_string, request, send_file, Response, jsonify
from threading import Lock
import os
import time
import glob
import cv2
import numpy as np
from Python.core_logic import (
    send_arduino_command, take_photo, get_latest_photo, get_uptime, generate_frames, 
    led_status, camera_active, commands_sent, photos_taken, init_camera,
    take_ar_photo, get_ar_photo_list, get_latest_ar_photo
)

app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="no">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🍓 Raspberry Pi Arduino Kontroll & AR Kamera</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: #2c3e50;
        }
        .section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .button-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin: 15px 0;
        }
        button, input[type="submit"] {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            font-size: 14px;
        }
        .btn-primary { background: #3498db; color: white; }
        .btn-success { background: #27ae60; color: white; }
        .btn-warning { background: #f39c12; color: white; }
        .btn-danger { background: #e74c3c; color: white; }
        .btn-info { background: #9b59b6; color: white; }
        .btn-ar { background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; }
        button:hover, input[type="submit"]:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .form-group {
            margin: 15px 0;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #2c3e50;
        }
        select, input[type="text"] {
            width: 100%;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            box-sizing: border-box;
        }
        select:focus, input[type="text"]:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 10px 0;
        }
        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: bold;
            text-align: center;
        }
        .status.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .status.info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #e9ecef;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #495057;
        }
        .photo-preview {
            text-align: center;
            margin: 20px 0;
        }
        .photo-preview img {
            max-width: 100%;
            max-height: 300px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .video-container {
            text-align: center;
            margin: 20px 0;
        }
        #camera-stream {
            max-width: 100%;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .ar-controls {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 15px;
            padding: 25px;
            margin: 20px 0;
        }
        .ar-controls h3 {
            margin-top: 0;
            color: #fff;
        }
        .ar-controls label {
            color: #f8f9fa;
        }
        .ar-preview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin: 15px 0;
        }
        .effect-btn {
            padding: 8px 12px;
            border: 2px solid rgba(255,255,255,0.3);
            background: rgba(255,255,255,0.1);
            color: white;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
        }
        .effect-btn:hover {
            background: rgba(255,255,255,0.2);
            border-color: rgba(255,255,255,0.6);
        }
        .gallery-link {
            display: inline-block;
            background: #6c757d;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            margin: 10px 0;
        }
        .gallery-link:hover {
            background: #545b62;
            text-decoration: none;
            color: white;
        }
        @media (max-width: 768px) {
            .grid { grid-template-columns: 1fr; }
            .container { padding: 15px; }
            .button-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍓 Raspberry Pi Arduino Kontroll</h1>
            <h2>📸 + AR Kamera System</h2>
        </div>

        <!-- Status Display -->
        <div class="status info">
            {{ status }}
        </div>

        <!-- System Statistics -->
        <div class="section">
            <h3>📊 System Status</h3>
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-value">{{ photos_taken }}</div>
                    <div>Bilder tatt</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ commands_sent }}</div>
                    <div>Kommandoer sendt</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{% if led_on %}🟢 ON{% else %}🔴 OFF{% endif %}</div>
                    <div>LED Status</div>
                </div>
            </div>
        </div>

        <div class="grid">
            <!-- Arduino LED Controls -->
            <div class="section">
                <h3>💡 Arduino LED Kontroll</h3>
                <form method="post">
                    <div class="button-grid">
                        <button type="submit" name="action" value="on" class="btn-success">🟢 LED PÅ</button>
                        <button type="submit" name="action" value="off" class="btn-danger">🔴 LED AV</button>
                        <button type="submit" name="action" value="blink" class="btn-info">⚡ Normal Blink</button>
                        <button type="submit" name="action" value="blink_fast" class="btn-warning">⚡⚡ Rask Blink</button>
                        <button type="submit" name="action" value="blink_slow" class="btn-primary">⚡ Sakte Blink</button>
                        <button type="submit" name="action" value="blink_sos" class="btn-danger">🆘 SOS Signal</button>
                    </div>
                </form>
            </div>

            <!-- Basic Camera -->
            <div class="section">
                <h3>📷 Vanlig Kamera</h3>
                <form method="post">
                    <button type="submit" name="action" value="photo" class="btn-primary" style="width: 100%;">
                        📸 Ta vanlig bilde
                    </button>
                </form>
                {% if latest_photo %}
                <div class="photo-preview">
                    <h4>Siste vanlige bilde:</h4>
                    <img src="/photo/{{ latest_photo }}" alt="Latest Photo">
                    <br><em>{{ latest_photo }}</em>
                </div>
                {% endif %}
            </div>
        </div>

        <!-- AR Camera Controls -->
        <div class="ar-controls">
            <h3>🎭 AR Kamera - Augmented Reality Foto</h3>
            <form method="post">
                <input type="hidden" name="action" value="ar_photo">
                
                <div class="grid">
                    <div>
                        <div class="form-group">
                            <label for="filter">🎨 Bildefilter:</label>
                            <select name="filter" id="filter">
                                <option value="none">Ingen filter</option>
                                <option value="grayscale">📷 Gråskala</option>
                                <option value="blur">🌫️ Uskarphet</option>
                                <option value="sepia">🏜️ Sepia</option>
                                <option value="vintage">📸 Vintage</option>
                                <option value="cool">❄️ Kjølig tone</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="ar_face_effect">👤 AR Ansikts-effekter:</label>
                            <select name="ar_face_effect" id="ar_face_effect">
                                <option value="none">Ingen AR</option>
                                <option value="glasses">👓 Briller</option>
                                <option value="hat">🎩 Hatt</option>
                                <option value="mustache">🥸 Bart</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="frame_style">🖼️ Bilderamme:</label>
                            <select name="frame_style" id="frame_style">
                                <option value="none">Ingen ramme</option>
                                <option value="polaroid">📸 Polaroid</option>
                                <option value="vintage">🎞️ Vintage</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div class="form-group">
                            <label for="custom_text">✍️ Tilpasset tekst:</label>
                            <input type="text" name="custom_text" id="custom_text" 
                                   placeholder="F.eks: Hei fra Raspberry Pi!" maxlength="50">
                        </div>

                        <div class="checkbox-group">
                            <input type="checkbox" name="show_timestamp" id="show_timestamp" checked>
                            <label for="show_timestamp">🕒 Vis tidsstempel</label>
                        </div>

                        <div class="checkbox-group">
                            <input type="checkbox" name="trigger_led" id="trigger_led" checked>
                            <label for="trigger_led">💡 Blink LED ved fotografering</label>
                        </div>
                    </div>
                </div>

                <button type="submit" class="btn-ar" style="width: 100%; margin-top: 20px; padding: 15px;">
                    🎭 Ta AR Foto!
                </button>
            </form>
        </div>

        <!-- AR Photo Display -->
        {% if latest_ar_photo %}
        <div class="section">
            <h3>🎭 Siste AR Bilde</h3>
            <div class="photo-preview">
                <img src="/photo/{{ latest_ar_photo }}" alt="Latest AR Photo">
                <br><em>{{ latest_ar_photo }}</em>
            </div>
        </div>
        {% endif %}

        <!-- Live Camera Stream -->
        <div class="section">
            <h3>📹 Live Kamera Stream</h3>
            <div class="video-container">
                <img id="camera-stream" src="/video_feed" alt="Live Camera Stream">
            </div>
        </div>

        <!-- Photo Gallery Links -->
        <div class="section">
            <h3>🖼️ Bildegalleri</h3>
            <a href="/ar_photos" class="gallery-link">🎭 Se alle AR bilder</a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
            <p>🍓 Raspberry Pi + Arduino + OpenCV AR Kamera System</p>
            <p>🔧 Med ansiktsgjenkjenning, bildefiltre og AR effekter</p>
        </div>
    </div>

    <script>
        // Add some basic interactivity
        document.getElementById('filter').addEventListener('change', function() {
            console.log('Filter changed:', this.value);
        });
        
        document.getElementById('ar_face_effect').addEventListener('change', function() {
            console.log('AR effect changed:', this.value);
        });

        // Auto-refresh status every 30 seconds
        setInterval(function() {
            fetch('/status')
                .then(response => response.json())
                .then(data => {
                    console.log('Status update:', data);
                })
                .catch(error => console.log('Status update failed:', error));
        }, 30000);
    </script>
</body>
</html>
"""

@app.route('/', methods=['GET', 'POST'])
def index():
    global led_status, commands_sent, photos_taken
    status = "🟢 Klar for kommandoer"
    if request.method == 'POST':
        action = request.form.get('action')
        commands_sent += 1
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
            photos_taken += 1
        elif action == 'ar_photo':
            # Get AR photo parameters from form
            filter_type = request.form.get('filter', 'none')
            custom_text = request.form.get('custom_text', '')
            frame_style = request.form.get('frame_style', 'none')
            ar_face_effect = request.form.get('ar_face_effect', 'none')
            show_timestamp = request.form.get('show_timestamp') == 'on'
            trigger_led = request.form.get('trigger_led') == 'on'
            
            # Take AR photo
            result = take_ar_photo(
                filter_type=filter_type,
                custom_text=custom_text if custom_text else None,
                frame_style=frame_style,
                ar_face_effect=ar_face_effect,
                show_timestamp=show_timestamp,
                trigger_led=trigger_led
            )
            
            if result['status'] == 'success':
                status = result['message']
                photos_taken += 1
            else:
                status = result['message']
        else:
            status = "❌ Ukjent kommando"
    latest_photo = get_latest_photo()
    if latest_photo:
        latest_photo = os.path.basename(latest_photo)
    
    latest_ar_photo = get_latest_ar_photo()
    if latest_ar_photo:
        latest_ar_photo = os.path.basename(latest_ar_photo)
    
    return render_template_string(HTML_TEMPLATE, 
                                  status=status, 
                                  led_on=led_status,
                                  latest_photo=latest_photo,
                                  latest_ar_photo=latest_ar_photo,
                                  photos_taken=photos_taken,
                                  commands_sent=commands_sent)

@app.route('/photo/<filename>')
def serve_photo(filename):
    return send_file(filename)

@app.route('/ar_photos')
def ar_photo_gallery():
    """Route to display AR photo gallery"""
    photos = get_ar_photo_list()
    gallery_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>AR Photo Gallery</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; background: #f0f0f0; margin: 0; padding: 20px; }
            .container { max-width: 1200px; margin: 0 auto; }
            .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
            .photo-card { background: white; border-radius: 10px; padding: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .photo-card img { width: 100%; border-radius: 5px; }
            .photo-info { margin-top: 10px; font-size: 14px; color: #666; }
            .back-btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; text-decoration: none; display: inline-block; margin-bottom: 20px; }
            h1 { color: #333; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <a href="/" class="back-btn">← Tilbake til hovedside</a>
            <h1>📸 AR Photo Gallery</h1>
            <div class="gallery">
    """
    
    for photo in photos:
        gallery_html += f"""
        <div class="photo-card">
            <img src="/photo/{photo['filename']}" alt="AR Photo">
            <div class="photo-info">
                <strong>📁 {photo['filename']}</strong><br>
                🕒 {photo['created']}<br>
                📏 {photo['size']} bytes
            </div>
        </div>
        """
    
    if not photos:
        gallery_html += "<p style='text-align: center; color: #666;'>Ingen AR bilder funnet ennå. Ta ditt første AR bilde!</p>"
    
    gallery_html += """
            </div>
        </div>
    </body>
    </html>
    """
    return gallery_html

@app.route('/video_feed')
def video_feed():
    """Route for live camera stream"""
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')



@app.route('/status')
def status():
    ar_photos = get_ar_photo_list()
    return jsonify({
        'uptime': get_uptime(),
        'photos_taken': photos_taken,
        'commands_sent': commands_sent,
        'led_status': led_status,
        'camera_active': camera_active,
        'ar_photos_count': len(ar_photos),
        'latest_ar_photo': get_latest_ar_photo()
    })

if __name__ == '__main__':
    print("🚀 Starter web UI...")
    init_camera()
    app.run(host='0.0.0.0', port=5000, debug=False)
