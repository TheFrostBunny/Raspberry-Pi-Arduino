// --- Konfigurasjon ---
const int ledPin = 8;

void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
  
  // Gi Arduino tid til å starte opp
  delay(1000);
  Serial.println("Arduino is ready.");
}

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readString();
    command.trim();

    if (command == "on") {
      digitalWrite(ledPin, HIGH);
      Serial.println("LED turned ON");
    } else if (command == "off") {
      digitalWrite(ledPin, LOW);
      Serial.println("LED turned OFF");
    } else if (command == "blink") {
      Serial.println("LED blinking (normal)");
      for (int i = 0; i < 3; i++) {
        digitalWrite(ledPin, HIGH);
        delay(300);
        digitalWrite(ledPin, LOW);
        delay(300);
      }
      Serial.println("Blink complete");
    } else if (command == "blink_fast") {
      Serial.println("LED blinking (fast)");
      for (int i = 0; i < 6; i++) {
        digitalWrite(ledPin, HIGH);
        delay(100);
        digitalWrite(ledPin, LOW);
        delay(100);
      }
      Serial.println("Fast blink complete");
    } else if (command == "blink_slow") {
      Serial.println("LED blinking (slow)");
      for (int i = 0; i < 3; i++) {
        digitalWrite(ledPin, HIGH);
        delay(800);
        digitalWrite(ledPin, LOW);
        delay(800);
      }
      Serial.println("Slow blink complete");
    } else if (command == "blink_sos") {
      Serial.println("LED blinking SOS");
      // S: 3 korte
      for (int i = 0; i < 3; i++) {
        digitalWrite(ledPin, HIGH);
        delay(150);
        digitalWrite(ledPin, LOW);
        delay(150);
      }
      delay(300);
      // O: 3 lange
      for (int i = 0; i < 3; i++) {
        digitalWrite(ledPin, HIGH);
        delay(500);
        digitalWrite(ledPin, LOW);
        delay(500);
      }
      delay(300);
      // S: 3 korte
      for (int i = 0; i < 3; i++) {
        digitalWrite(ledPin, HIGH);
        delay(150);
        digitalWrite(ledPin, LOW);
        delay(150);
      }
      Serial.println("SOS blink complete");
    } else {
      Serial.println("Unknown command");
    }
    
    // Send en bekreftelse tilbake til Pi-en
    Serial.println("ok");
  }
}