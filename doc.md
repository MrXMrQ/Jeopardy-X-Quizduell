# 🎮 Quiz-Duell: Kamera-Setup & Dokumentation

Da das Spiel im lokalen Netzwerk über **HTTP** läuft, blockieren Browser den Kamerazugriff standardmäßig. Um die Webcams in den `PlayerCards` nutzen zu können, müssen folgende Einstellungen vorgenommen werden.

---

## 🛠️ Browser-Konfiguration

Jeder Mitspieler, der seine Kamera übertragen möchte, muss seinen Browser einmalig konfigurieren.

### 🦊 Firefox (Empfohlen)
1. Gib **`about:config`** in die Adresszeile ein und bestätige die Warnung.
2. Suche nach **`media.getusermedia.insecure.enabled`** und setze es auf **`true`**.
3. Suche nach **`media.devices.insecure.enabled`** und setze es auf **`true`**.
4. Suche nach **`dom.securecontext.whitelist`**.
5. Klicke auf das Stift-Icon und trage die Adresse ein: `http://192.168.178.250:5173`
6. **Wichtig:** Starte Firefox komplett neu.

### 🌐 Chrome / Edge / Brave
1. Gib **`chrome://flags/#unsafely-treat-insecure-origin-as-secure`** in die Adresszeile ein.
2. Suche den Punkt **"Insecure origins treated as secure"**.
3. Schalte den Status auf **`Enabled`**.
4. Trage in das Textfeld die Adresse ein: `http://192.168.178.250:5173`
5. Klicke unten rechts auf **`Relaunch`**.

---

## 📡 Funktionsweise der Videoübertragung

Das System nutzt **WebRTC** für eine direkte Peer-to-Peer (P2P) Übertragung. Das bedeutet, die Videodaten fließen direkt zwischen den Browsern der Spieler und belasten nicht deinen Python-Server.

1. **Signaling:** Beim Beitritt generiert jeder Browser eine **Peer-ID**.
2. **Registry:** Die Peer-ID wird an das Python-Backend gesendet und dort im Spieler-Objekt gespeichert.
3. **Connection:** Sobald ein Spieler eine gültige Peer-ID von einem anderen Teilnehmer sieht, baut sein Browser automatisch eine direkte Verbindung zu diesem Spieler auf.
4. **Stream:** Das Video wird erst übertragen, wenn der Nutzer auf seiner Karte auf **"📷 Start"** klickt.

---

## 🕹️ Spielsteuerung für den Moderator

| Aktion | Auswirkung |
| :--- | :--- |
| **Frage öffnen** | Sperrt den Buzzer für alle, zeigt die Frage auf dem Overlay. |
| **Buzzer freigeben** | Schaltet die Buzzer für die Spieler scharf (Button leuchtet grün). |
| **Richtig (+)** | Addiert Punkte, schließt die Frage (X), wechselt den Turn zum nächsten Spieler. |
| **Falsch (-)** | Zieht Punkte ab (Hälfte des Wertes), gibt den Buzzer sofort wieder für die anderen frei. |
| **Niemand wusste es** | Schließt die Frage ohne Punktvergabe, wechselt den Turn. |

---

## 🔍 Fehlerbehebung (Troubleshooting)

### "Kamera-Zugriff verweigert"
Prüfe in der Browser-Konsole (**F12**), ob `window.isSecureContext` auf **`true`** steht. Wenn es `false` ist, wurde die IP-Ausnahme (Whitelist/Flag) nicht korrekt vom Browser übernommen.

### "Ich sehe nur mich selbst, aber keine anderen"
* Stelle sicher, dass das **Python-Backend** aktuell ist und das `update_peer_id` Event verarbeitet.
* Prüfe, ob die Firewall deines PCs eingehende P2P-Verbindungen blockiert.

### "Das Spielfeld lädt nicht (Endlosschleife)"
Stelle sicher, dass du **kein HTTPS** in Vite aktiviert hast, da sonst der "Mixed Content Block" die Kommunikation zum HTTP-Backend (Port 5000) verhindert.