# Quiz Duel: Camera Setup & Documentation

Since the application operates over **HTTP** within a local network, modern browsers block camera access by default due to security policies. To enable webcams in the `PlayerCards`, the following configurations are required.

---

## Browser Configuration

Every participant who wishes to transmit their video stream must configure their browser once.

### Firefox
1. Enter **`about:config`** in the address bar and accept the risk warning.
2. Search for **`media.getusermedia.insecure.enabled`** and set it to **`true`**.
3. Search for **`media.devices.insecure.enabled`** and set it to **`true`**.
4. Search for **`dom.securecontext.whitelist`**.
5. Click the edit icon and enter the application address: `http://192.168.178.250:5173`
6. Restart Firefox completely.

### Chrome / Edge / Brave
1. Enter **`chrome://flags/#unsafely-treat-insecure-origin-as-secure`** in the address bar.
2. Locate the setting **"Insecure origins treated as secure"**.
3. Set the status to **`Enabled`**.
4. In the text field, enter the application address: `http://192.168.178.250:5173`
5. Click the **`Relaunch`** button at the bottom right.

---

## Technical Overview: Video Transmission

The system utilizes **WebRTC** for direct Peer-to-Peer (P2P) transmission. Video data flows directly between the players' browsers, which minimizes the load on the Python server.

1. **Signaling:** Upon joining, each browser generates a unique **Peer-ID**.
2. **Registry:** The Peer-ID is sent to the Python backend and stored within the player object.
3. **Connection:** When a browser detects a valid Peer-ID from another participant, it automatically establishes a direct connection.
4. **Streaming:** The video stream is only initiated when the user clicks the **"Start Camera"** button on their interface.

---

## Moderator Controls

| Action | Effect |
| :--- | :--- |
| **Open Question** | Disables buzzers for everyone and displays the question on the overlay. |
| **Release Buzzer** | Enables the buzzers (the button turns green for players). |
| **Correct (+)** | Adds points, closes the current question, and passes the turn to the next player. |
| **Incorrect (-)** | Deducts points (50% of the question value) and reactivates buzzers for remaining players. |
| **No Answer** | Closes the question without awarding points and switches the turn. |

---

## Troubleshooting

### Camera Access Denied
Open the browser console (**F12**) and check if `window.isSecureContext` returns **`true`**. If it returns `false`, the IP exception (Whitelist/Flag) was not applied correctly.

### Remote Streams Not Visible
* Verify that the **Python backend** is running and processing `update_peer_id` events.
* Check if the local firewall or antivirus software is blocking incoming P2P connections.

### Infinite Loading or Connection Errors
Ensure that **HTTPS is disabled** in the Vite configuration. Mixing HTTPS with an HTTP backend (Port 5000) will result in "Mixed Content" blocks.

---

## Execution Instructions

### Frontend
1. Navigate to the directory: `cd jeopardy`
2. Start the development server: `npm run dev -- --host`

### Backend
1. Navigate to the directory: `cd backend`
2. Activate the virtual environment:
   * Windows: `.\venv\Scripts\activate`
   * macOS/Linux: `source venv/bin/activate`
3. Start the server: `python server.py`