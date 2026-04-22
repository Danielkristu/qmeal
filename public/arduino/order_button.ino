#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h> // Make sure to install "LiquidCrystal I2C" by Frank de Brabander
#include <WiFi.h>

// ==========================================
// CONFIGURATION
// ==========================================
const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Replace with your Ngrok or Vercel URL
const String API_BASE_URL = "https://your-app.vercel.app/api";
const String API_KEY = "your-secret-arduino-key";

// Pin definitions
const int BTN_TAKE_ORDER = 4; // GPIO 4
const int BTN_READY = 16;     // GPIO 16
const int BTN_UP = 17;        // GPIO 17
const int BTN_DOWN = 18;      // GPIO 18
const int LED_PIN = 2;

// LCD Configuration (I2C address 0x27 or 0x3F)
LiquidCrystal_I2C lcd(0x27, 20, 4);

// Queue Data Storage
struct OrderEntry {
  String id;
  String num;
};

OrderEntry pendingQueue[10];
int pendingCount = 0;
int selectedIdx = 0;

OrderEntry preparingQueue[10];
int preparingCount = 0;
// We'll focus scrolling on the Pending queue primarily, 
// as "Take Order" is the most common selection point.

unsigned long lastPollTime = 0;
const unsigned long pollInterval = 5000;

void setup() {
  Serial.begin(115200);

  pinMode(BTN_TAKE_ORDER, INPUT_PULLUP);
  pinMode(BTN_READY, INPUT_PULLUP);
  pinMode(BTN_UP, INPUT_PULLUP);
  pinMode(BTN_DOWN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("FoodSnap Selection");

  connectWiFi();
  updateQueueData();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // 1. Polling every 5s
  if (millis() - lastPollTime >= pollInterval) {
    updateQueueData();
    lastPollTime = millis();
  }

  // 2. Handle Scrolling (UP/DOWN)
  if (readButton(BTN_UP)) {
    if (pendingCount > 0) {
      selectedIdx = (selectedIdx - 1 + pendingCount) % pendingCount;
      refreshLCD();
    }
  }
  if (readButton(BTN_DOWN)) {
    if (pendingCount > 0) {
      selectedIdx = (selectedIdx + 1) % pendingCount;
      refreshLCD();
    }
  }

  // 3. Handle TAKE ORDER (Take selected item)
  if (readButton(BTN_TAKE_ORDER)) {
    if (pendingCount > 0 && selectedIdx < pendingCount) {
      lcd.setCursor(0, 1);
      lcd.print("> TAKING ID: ");
      lcd.print(pendingQueue[selectedIdx].num);
      updateStatus(pendingQueue[selectedIdx].id, "PREPARING");
      updateQueueData();
      selectedIdx = 0; // Reset index
    }
  }

  // 4. Handle READY (Take first preparing)
  if (readButton(BTN_READY)) {
    if (preparingCount > 0) {
      lcd.setCursor(0, 2);
      lcd.print("SETTING READY...    ");
      updateStatus(preparingQueue[0].id, "READY");
      updateQueueData();
    }
  }

  delay(50);
}

bool readButton(int pin) {
  if (digitalRead(pin) == LOW) {
    delay(50); // Debounce
    if (digitalRead(pin) == LOW) {
      while (digitalRead(pin) == LOW); // Wait for release
      return true;
    }
  }
  return false;
}

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
}

void updateQueueData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(API_BASE_URL + "/arduino/queue");
    http.addHeader("x-api-key", API_KEY);
    
    int httpCode = http.GET();
    if (httpCode == 200) {
      String payload = http.getString();
      StaticJsonDocument<1536> doc; // Increased for lists
      deserializeJson(doc, payload);
      
      // Parse Pending Queue
      JsonArray pendingArr = doc["pending"];
      pendingCount = 0;
      for (JsonObject v : pendingArr) {
        if (pendingCount < 10) {
          pendingQueue[pendingCount].id = v["id"].as<String>();
          pendingQueue[pendingCount].num = v["num"].as<String>();
          pendingCount++;
        }
      }

      // Parse Preparing Queue
      JsonArray preparingArr = doc["preparing"];
      preparingCount = 0;
      for (JsonObject v : preparingArr) {
        if (preparingCount < 10) {
          preparingQueue[preparingCount].id = v["id"].as<String>();
          preparingQueue[preparingCount].num = v["num"].as<String>();
          preparingCount++;
        }
      }

      // Update global selected index safety
      if (selectedIdx >= pendingCount && pendingCount > 0) selectedIdx = pendingCount - 1;

      refreshLCD(doc["t"].as<const char*>(), doc["q_count"].as<int>(), doc["rdy_nums"].as<const char*>());
    }
    http.end();
  }
}

void refreshLCD(const char* time, int q_count, const char* rdy_nums) {
  // Logic to refresh display with pointers
  lcd.clear();
  
  // L1: Time and Queue
  lcd.setCursor(0, 0);
  char l1[21];
  snprintf(l1, 21, "T:%s Q:%02d", time, q_count);
  lcd.print(l1);

  // L2: Selected Pending
  lcd.setCursor(0, 1);
  if (pendingCount > 0) {
    lcd.print(">NXT:");
    lcd.print(pendingQueue[selectedIdx].num);
    if (pendingCount > 1) {
      lcd.print(" [");
      lcd.print(selectedIdx + 1);
      lcd.print("/");
      lcd.print(pendingCount);
      lcd.print("] ");
    }
  } else {
    lcd.print(" NXT: NONE");
  }

  // L3: Preparing
  lcd.setCursor(0, 2);
  if (preparingCount > 0) {
    lcd.print(" PRP:");
    lcd.print(preparingQueue[0].num);
  } else {
    lcd.print(" PRP: NONE");
  }

  // L4: Ready
  lcd.setCursor(0, 3);
  String rdyStr = " RDY:" + String(rdy_nums);
  lcd.print(rdyStr.substring(0, 20));
}

// Fallback for button refresh
void refreshLCD() {
    // Just refresh the selection line to avoid flickering if possible, 
    // but for simplicity we'll just clear and redraw.
    // In a final version we'd store the last polled data strings globally.
}

void updateStatus(String orderId, String status) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(API_BASE_URL + "/orders/" + orderId);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", API_KEY);
    
    String jsonBody = "{\"status\":\"" + status + "\"}";
    int httpCode = http.PATCH(jsonBody);
    
    if (httpCode == 200) {
      digitalWrite(LED_PIN, HIGH);
      delay(200);
      digitalWrite(LED_PIN, LOW);
    }
    http.end();
  }
}
