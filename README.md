# Project: Raspberry Pi with Arduino  

This project includes code for both Arduino and Python, along with a web interface and an installation script for Raspberry Pi.

## Project Structure  

```
start.sh  
Arduino/  
    arduino_code.ino  
Python/  
    core_logic.py  
    requirements.txt  
    Web/  
        web_ui.py  
Script/  
    install_pi.sh  
```

## Description of Folders and Files  

- **start.sh**: Startup script for the project.  
- **Arduino/**: Contains Arduino code (`arduino_code.ino`).  
- **Python/**: Python code for the project logic.  
  - `core_logic.py`: Core logic written in Python.  
  - `requirements.txt`: Dependencies required for the Python code.  
  - **Web/**: Web interface written in Python (`web_ui.py`).  
- **Script/**: Installation script for Raspberry Pi (`install_pi.sh`).  

## Getting Started  

1. **Install dependencies**  
   Navigate to the `Python/` folder and install the required Python packages:  
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the web interface**  
   From the `Python/Web/` folder:  
   ```bash
   python web_ui.py
   ```

3. **Upload the Arduino code**  
   Open `Arduino/arduino_code.ino` in the Arduino IDE and upload it to your Arduino device.  

4. **Install on Raspberry Pi**  
   Run the installation script:  
   ```bash
   bash Script/install_pi.sh
   ```
