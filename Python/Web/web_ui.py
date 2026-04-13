# web_ui.py
from flask import Flask, render_template_string, request, send_file, Response, jsonify
from threading import Lock
import os
import time
import glob
import cv2
import numpy as np
from Python.core_logic import (
    send_arduino_command, take_photo, get_latest_photo, get_uptime, generate_frames, led_status, camera_active, commands_sent, photos_taken, init_camera
)

app = Flask(__name__)

HTML_TEMPLATE = """
...existing code...
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
    return send_file(filename)



@app.route('/status')
def status():
    return jsonify({
        'uptime': get_uptime(),
        'photos_taken': photos_taken,
        'commands_sent': commands_sent,
        'led_status': led_status,
        'camera_active': camera_active
    })

if __name__ == '__main__':
    print("🚀 Starter web UI...")
    init_camera()
    app.run(host='0.0.0.0', port=5000, debug=False)
