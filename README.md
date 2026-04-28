# 🎮 Quiz Duel: Comprehensive Documentation

This documentation covers the setup, technical specifications, and operation of the Quiz Duel application. Since the system operates over a local network (HTTP), specific browser configurations are required for camera access.

---

## Table of Contents
- [🎮 Quiz Duel: Comprehensive Documentation](#-quiz-duel-comprehensive-documentation)
  - [Table of Contents](#table-of-contents)
  - [1. Setup \& Installation](#1-setup--installation)
    - [Option A: Docker Compose (Recommended)](#option-a-docker-compose-recommended)
    - [Option B: Manual Installation](#option-b-manual-installation)
  - [2. Browser Configuration (Camera Access)](#2-browser-configuration-camera-access)
    - [🦊 Firefox](#-firefox)
    - [🌐 Chrome / Edge / Brave](#-chrome--edge--brave)
  - [3. Board Structure (JSON Format)](#3-board-structure-json-format)
    - [Data Schema Example](#data-schema-example)
  - [4. Technical Details: Video Transmission](#4-technical-details-video-transmission)
  - [5. Moderator Controls](#5-moderator-controls)
  - [6. Troubleshooting](#6-troubleshooting)
    - [❌ Camera Access Denied](#-camera-access-denied)
    - [❌ Remote Streams Not Visible](#-remote-streams-not-visible)
    - [❌ Connection Errors / Mixed Content](#-connection-errors--mixed-content)

---

## 1. Setup & Installation

The project is a real-time Jeopardy-style quiz application featuring WebRTC streaming and a Python backend.

### Option A: Docker Compose (Recommended)
For a quick deployment including all dependencies:
1. Open a terminal in the root directory.
2. Run the following command:
   ```bash
   docker compose up --build
   ```
### Option B: Manual Installation

- Backend (Python): Run pip install -r requirements.txt and start the server with python main.py.

- Frontend (Vite/React): Navigate to the frontend folder, run npm install, then npm run dev.

## 2. Browser Configuration (Camera Access)

Since modern browsers block camera access under HTTP by default, exceptions must be defined for the server's IP address (http://[YOUR IP]:5173).
### 🦊 Firefox

- Enter about:config in the address bar and accept the risk warning.

- Search for media.getusermedia.insecure.enabled → set to true.

- Search for media.devices.insecure.enabled → set to true.

- Search for dom.securecontext.whitelist.

- Click the edit icon and enter the URL: http:/[YOUR IP]:5173

- Restart Firefox completely.

### 🌐 Chrome / Edge / Brave

- Enter the address: chrome://flags/#unsafely-treat-insecure-origin-as-secure

- Locate the setting "Insecure origins treated as secure".

- Set the status to Enabled.

- In the text field, enter the address: http://[YOUR IP]:5173

- Click Relaunch at the bottom right.

## 3. Board Structure (JSON Format)

Questions are defined in a JSON file. Every question must include a type field to ensure the frontend renders the content correctly and applies the "Fairness Blur."

| Type | Description | Required Fields |
| :--- | :--- | :--- |
| text | Traditional text-only question. | id, value, type, text, answer |
| image | Displays one main image with text. | id, value, type, text, image_main, answer |
| mix | Main image with additional manual hints. | id, value, type, text, image_main, hints, answer |
### Data Schema Example
```JSON

{
  "board_name": "The Ultimate Quiz Duel",
  "categories": [
    {
      "name": "Image Gallery",
      "questions": [
        {
          "id": "q1",
          "value": 100,
          "type": "text",
          "text": "What is the capital of France?",
          "answer": "Paris"
        },
        {
          "id": "q2",
          "value": 200,
          "type": "image",
          "text": "Identify this object:",
          "image_main": "/images/example/microscope.png",
          "answer": "Microscope"
        },
         {
            "id": "q23",
            "value": 300,
            "type": "mix",
            "text": "Identifiziere die Kombination, die in diesem Bild gezeigt wird.",
            "image_main": "/images/example/flyingLion.png",
            "hints": [
                  "/images/example/bird.png",
                  "/images/example/lion.png"
            ],
            "answer": "Bird & Lion"
         }
      ]
    }
  ]
}
```

## 4. Technical Details: Video Transmission

The system utilizes WebRTC for direct Peer-to-Peer (P2P) transmission. This minimizes the load on the Python server.

- Signaling: Upon joining, each browser generates a unique Peer-ID.

- Registry: The Peer-ID is sent to the backend and stored within the player object.

- Connection: When a browser detects a Peer-ID from another participant, it automatically establishes a direct connection.

- Streaming: The video stream is only initiated when the user clicks the "Start Camera" button.

## 5. Moderator Controls
| Action | Effect |
| :--- | :--- |
| Open Question | Disables buzzers for everyone and displays the question on the overlay. |
| Release Buzzer | Enables the buzzers (the button turns green for players). |
| Correct (+) | Adds points, closes the question, and passes the turn. |
| Incorrect (-) | Deducts 50% of the question value and reactivates buzzers for remaining players. |
| No Answer | Closes the question without awarding points. |

## 6. Troubleshooting
### ❌ Camera Access Denied
Open the browser console (F12) and check if window.`isSecureContext` returns `true`. If it returns `false`, the IP exception (Step 2) was not applied correctly.

### ❌ Remote Streams Not Visible

- Verify that the Python backend is running and processing update_peer_id events.

- Check if a local firewall or antivirus software is blocking P2P connections.

### ❌ Connection Errors / Mixed Content
Ensure that `HTTPS` is disabled in the Vite configuration. Mixing `HTTPS` with an `HTTP` backend will result in `"Mixed Content"` blocks.
