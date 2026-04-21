
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
    # Støtt både gamle og nye kommando-navn fra frontend
    if action in ['take_photo', 'photo']:
        result = core_logic.take_photo()
    elif action in ['led_on', 'on']:
        result = core_logic.send_arduino_command('on')
    elif action in ['led_off', 'off']:
        result = core_logic.send_arduino_command('off')
    elif action in ['blink']:
        result = core_logic.send_arduino_command('blink')
    elif action in ['blink_fast']:
        result = core_logic.send_arduino_command('blink_fast')
    elif action in ['blink_slow']:
        result = core_logic.send_arduino_command('blink_slow')
    elif action in ['blink_sos']:
        result = core_logic.send_arduino_command('blink_sos')
    elif action in ['camera_on', 'cameraon']:
        result = core_logic.init_camera()
    elif action in ['camera_off', 'cameraoff']:
        core_logic.camera_active = False
        result = 'Camera deactivated'
    elif action in ['ar_photo']:
        # Kall AR-funksjonen med parametre fra frontend
        filter_type = body.get('filter', 'none')
        custom_text = body.get('custom_text', None)
        frame_style = body.get('frame_style', 'none')
        ar_face_effect = body.get('ar_face_effect', 'none')
        show_timestamp = body.get('show_timestamp', '') == 'on'
        trigger_led = body.get('trigger_led', '') == 'on'
        result = core_logic.take_ar_photo(
            filter_type=filter_type,
            custom_text=custom_text,
            frame_style=frame_style,
            ar_face_effect=ar_face_effect,
            show_timestamp=show_timestamp,
            trigger_led=trigger_led
        )
    else:
        result = f'Unknown action: {action}'
    return jsonify({'result': result})

@app.route('/status', methods=['GET'])
def status():
    latest_photo = core_logic.get_latest_photo()
    latest_ar_photo = core_logic.get_latest_ar_photo() if hasattr(core_logic, 'get_latest_ar_photo') else None
    ar_photos_count = len(core_logic.get_ar_photo_list()) if hasattr(core_logic, 'get_ar_photo_list') else 0
    return jsonify({
        'uptime': core_logic.get_uptime(),
        'photos_taken': core_logic.photos_taken if hasattr(core_logic, 'photos_taken') else 0,
        'commands_sent': core_logic.commands_sent if hasattr(core_logic, 'commands_sent') else 0,
        'led_status': core_logic.led_status if hasattr(core_logic, 'led_status') else False,
        'camera_active': core_logic.camera_active if hasattr(core_logic, 'camera_active') else False,
        'ar_photos_count': ar_photos_count,
        'latest_ar_photo': latest_ar_photo,
        'latest_photo': latest_photo
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
