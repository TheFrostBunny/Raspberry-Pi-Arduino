
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import os
import core_logic

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['POST'])
def post_action():
    action = request.form.get('action')
    body = {k: v for k, v in request.form.items() if k != 'action'}
    result = None
    if action == 'take_photo':
        result = core_logic.take_photo()
    elif action == 'led_on':
        result = core_logic.send_arduino_command('on')
    elif action == 'led_off':
        result = core_logic.send_arduino_command('off')
    elif action == 'camera_on':
        result = core_logic.init_camera()
    elif action == 'camera_off':
        core_logic.camera_active = False
        result = 'Camera deactivated'
    else:
        result = f'Unknown action: {action}'
    return jsonify({'result': result})

@app.route('/status', methods=['GET'])
def status():
    latest_photo = core_logic.get_latest_photo()
    return jsonify({
        'uptime': core_logic.get_uptime(),
        'photos_taken': core_logic.photos_taken if hasattr(core_logic, 'photos_taken') else 0,
        'commands_sent': core_logic.commands_sent if hasattr(core_logic, 'commands_sent') else 0,
        'led_status': core_logic.led_status if hasattr(core_logic, 'led_status') else False,
        'camera_active': core_logic.camera_active if hasattr(core_logic, 'camera_active') else False,
        'ar_photos_count': 0,
        'latest_ar_photo': latest_photo
    })

@app.route('/photo/<filename>')
def photo(filename):
    return send_from_directory(os.getcwd(), filename)

@app.route('/video_feed')
def video_feed():
    core_logic.init_camera()
    return Response(core_logic.generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/', methods=['GET'])
def index():
    return 'Python web server is running.'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
