/*
 * Enhanced Arduino Code for AR Photo Capture System
 * 
 * Features:
 * - Standard LED controls (on/off/blink patterns)
 * - Photo flash effect for AR photo capture
 * - Multiple LED patterns for different photo modes
 * - Status feedback to Raspberry Pi
 * 
 * Hardware:
 * - LED connected to pin 8
 * - Optional: Multiple LEDs for better effects
 * - Optional: Buzzer for audio feedback
 */

const int ledPin = 8;
const int buzzerPin = 9; // Optional buzzer for audio feedback
bool ledState = false;

void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT); // Optional
  
  // Startup sequence
  startupFlash();
  
  delay(1000);
  Serial.println("Arduino AR Photo System Ready! 📸");
}

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readString();
    command.trim();
    
    // Convert to lowercase for easier processing
    command.toLowerCase();

    // Basic LED controls
    if (command == "on") {
      digitalWrite(ledPin, HIGH);
      ledState = true;
      Serial.println("LED turned ON 💡");
      
    } else if (command == "off") {
      digitalWrite(ledPin, LOW);
      ledState = false;
      Serial.println("LED turned OFF ⚫");
      
    } else if (command == "blink") {
      normalBlink();
      
    } else if (command == "blink_fast") {
      fastBlink();
      
    } else if (command == "blink_slow") {
      slowBlink();
      
    } else if (command == "blink_sos") {
      sosBlink();
      
    // AR Photo specific effects
    } else if (command == "photo_flash") {
      photoFlash();
      
    } else if (command == "ar_flash") {
      arPhotoFlash();
      
    } else if (command == "camera_ready") {
      cameraReadySignal();
      
    } else if (command == "countdown") {
      photoCountdown();
      
    } else if (command == "success") {
      successPattern();
      
    } else if (command == "error") {
      errorPattern();
      
    } else {
      Serial.println("Unknown command: " + command + " ❌");
      errorBlink();
    }
  }
}

// === BASIC LED FUNCTIONS ===

void normalBlink() {
  Serial.println("LED blinking (normal) ⚡");
  for (int i = 0; i < 3; i++) {
    digitalWrite(ledPin, HIGH);
    delay(300);
    digitalWrite(ledPin, LOW);
    delay(300);
  }
  Serial.println("Blink complete ✅");
}

void fastBlink() {
  Serial.println("LED blinking (fast) ⚡⚡");
  for (int i = 0; i < 6; i++) {
    digitalWrite(ledPin, HIGH);
    delay(150);
    digitalWrite(ledPin, LOW);
    delay(150);
  }
  Serial.println("Fast blink complete ✅");
}

void slowBlink() {
  Serial.println("LED blinking (slow) 🐌");
  for (int i = 0; i < 3; i++) {
    digitalWrite(ledPin, HIGH);
    delay(600);
    digitalWrite(ledPin, LOW);
    delay(600);
  }
  Serial.println("Slow blink complete ✅");
}

void sosBlink() {
  Serial.println("LED blinking SOS signal 🆘");
  
  // S (3 short)
  for (int i = 0; i < 3; i++) {
    digitalWrite(ledPin, HIGH);
    delay(150);
    digitalWrite(ledPin, LOW);
    delay(150);
  }
  delay(300);
  
  // O (3 long)
  for (int i = 0; i < 3; i++) {
    digitalWrite(ledPin, HIGH);
    delay(450);
    digitalWrite(ledPin, LOW);
    delay(150);
  }
  delay(300);
  
  // S (3 short)
  for (int i = 0; i < 3; i++) {
    digitalWrite(ledPin, HIGH);
    delay(150);
    digitalWrite(ledPin, LOW);
    delay(150);
  }
  
  Serial.println("SOS signal complete 🆘");
}

// === AR PHOTO SPECIFIC FUNCTIONS ===

void photoFlash() {
  Serial.println("Camera flash! 📸");
  
  // Bright flash effect
  digitalWrite(ledPin, HIGH);
  delay(100);
  digitalWrite(ledPin, LOW);
  delay(50);
  digitalWrite(ledPin, HIGH);
  delay(50);
  digitalWrite(ledPin, LOW);
  
  // Optional buzzer sound
  tone(buzzerPin, 880, 100); // Camera click sound
  
  Serial.println("Photo flash complete ✅");
}

void arPhotoFlash() {
  Serial.println("AR Photo mode activated! 🎭📸");
  
  // Special AR pattern - double flash with pause
  digitalWrite(ledPin, HIGH);
  delay(80);
  digitalWrite(ledPin, LOW);
  delay(40);
  digitalWrite(ledPin, HIGH);
  delay(80);
  digitalWrite(ledPin, LOW);
  delay(200);
  
  // Second flash burst
  digitalWrite(ledPin, HIGH);
  delay(60);
  digitalWrite(ledPin, LOW);
  delay(30);
  digitalWrite(ledPin, HIGH);
  delay(60);
  digitalWrite(ledPin, LOW);
  
  // Optional AR sound effect
  tone(buzzerPin, 1000, 50);
  delay(100);
  tone(buzzerPin, 1200, 50);
  
  Serial.println("AR photo flash complete 🎭✅");
}

void photoCountdown() {
  Serial.println("Photo countdown starting! ⏰");
  
  // 3 second countdown with LED
  for (int i = 3; i > 0; i--) {
    Serial.println("📸 " + String(i) + "...");
    
    // LED pulse for each count
    digitalWrite(ledPin, HIGH);
    delay(200);
    digitalWrite(ledPin, LOW);
    delay(200);
    digitalWrite(ledPin, HIGH);
    delay(200);
    digitalWrite(ledPin, LOW);
    delay(400);
    
    // Countdown beep
    tone(buzzerPin, 800 + (i * 100), 200);
  }
  
  Serial.println("📸 SMILE! Taking photo now!");
  
  // Final flash
  arPhotoFlash();
}

void cameraReadySignal() {
  Serial.println("Camera ready for AR photo! 📹🎭");
  
  // Gentle pulsing effect
  for (int i = 0; i < 3; i++) {
    digitalWrite(ledPin, HIGH);
    delay(100);
    digitalWrite(ledPin, LOW);
    delay(100);
  }
  
  tone(buzzerPin, 1500, 100);
  
  Serial.println("Camera ready signal complete ✅");
}

void successPattern() {
  Serial.println("AR Photo captured successfully! 🎉");
  
  // Victory pattern
  for (int i = 0; i < 5; i++) {
    digitalWrite(ledPin, HIGH);
    delay(100);
    digitalWrite(ledPin, LOW);
    delay(50);
  }
  
  // Success melody
  tone(buzzerPin, 1000, 100);
  delay(150);
  tone(buzzerPin, 1200, 100);
  delay(150);
  tone(buzzerPin, 1500, 200);
  
  Serial.println("Success pattern complete 🎉✅");
}

void errorPattern() {
  Serial.println("Error in photo capture! ❌");
  
  // Error pattern - fast red blinks
  for (int i = 0; i < 8; i++) {
    digitalWrite(ledPin, HIGH);
    delay(80);
    digitalWrite(ledPin, LOW);
    delay(80);
  }
  
  // Error sound
  tone(buzzerPin, 400, 500);
  
  Serial.println("Error pattern complete ❌");
}

void errorBlink() {
  // Quick error indication
  digitalWrite(ledPin, HIGH);
  delay(100);
  digitalWrite(ledPin, LOW);
  delay(100);
  digitalWrite(ledPin, HIGH);
  delay(100);
  digitalWrite(ledPin, LOW);
}

void startupFlash() {
  Serial.println("Starting AR Photo System... 🚀");
  
  // Startup sequence
  for (int i = 0; i < 3; i++) {
    digitalWrite(ledPin, HIGH);
    delay(200);
    digitalWrite(ledPin, LOW);
    delay(200);
  }
  
  // Startup melody
  tone(buzzerPin, 800, 100);
  delay(150);
  tone(buzzerPin, 1000, 100);
  delay(150);
  tone(buzzerPin, 1200, 150);
  
  Serial.println("AR Photo System initialized! 📸🎭✅");
}

// === UTILITY FUNCTIONS ===

void pulseEffect(int duration) {
  // Smooth LED pulsing effect
  int steps = 50;
  float stepDelay = duration / (steps * 2.0);
  
  // Fade in
  for (int i = 0; i <= steps; i++) {
    int brightness = map(i, 0, steps, 0, 255);
    analogWrite(ledPin, brightness);
    delay(stepDelay);
  }
  
  // Fade out
  for (int i = steps; i >= 0; i--) {
    int brightness = map(i, 0, steps, 0, 255);
    analogWrite(ledPin, brightness);
    delay(stepDelay);
  }
  
  digitalWrite(ledPin, LOW);
}

/*
 * Usage Examples from Raspberry Pi:
 * 
 * Basic Controls:
 * - send_arduino_command("on")
 * - send_arduino_command("off") 
 * - send_arduino_command("blink")
 * 
 * AR Photo Commands:
 * - send_arduino_command("ar_flash")      # For AR photo capture
 * - send_arduino_command("countdown")     # 3-second countdown + flash
 * - send_arduino_command("camera_ready")  # Ready signal
 * - send_arduino_command("success")       # Photo saved successfully
 * - send_arduino_command("error")         # Photo capture failed
 * 
 * The Python code can call these new functions:
 * 
 * def take_ar_photo_enhanced(...):
 *     send_arduino_command("countdown")  # Start countdown
 *     # ... capture and process image ...
 *     if success:
 *         send_arduino_command("success")
 *     else:
 *         send_arduino_command("error")
 */