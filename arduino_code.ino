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
      Serial.println("LED blinking");
      for (int i = 0; i < 3; i++) {
        digitalWrite(ledPin, HIGH);
        delay(250);
        digitalWrite(ledPin, LOW);
        delay(250);
      }
      Serial.println("Blink complete");
    } else {
      Serial.println("Unknown command");
    }
    
    // Send en bekreftelse tilbake til Pi-en
    Serial.println("ok");
  }
}