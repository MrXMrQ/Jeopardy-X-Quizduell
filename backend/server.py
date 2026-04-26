import socketio
from aiohttp import web
import json

# 1. Server initialisieren
sio = socketio.AsyncServer(async_mode='aiohttp', cors_allowed_origins='*')
app = web.Application()
sio.attach(app)

# 2. Unsere globale Variable
global_count = 0

# --- NEU: Health Check & API Routen ---

async def health_check(request):
    """Einfacher Text-Check, ob der Server lebt."""
    return web.Response(text="🚀 Server ist online und bereit!")

async def get_status(request):
    """Gibt den aktuellen Zählerstand als JSON zurück."""
    data = {
        "status": "healthy",
        "current_count": global_count,
        "connections": len(sio.eio.sockets) # Zeigt wie viele Geräte gerade dran sind
    }
    return web.json_response(data)

# Routen dem App-Router hinzufügen
app.router.add_get('/health', health_check)
app.router.add_get('/status', get_status)

# --- Ende der neuen Routen ---

@sio.event
async def connect(sid, environ):
    print(f"🟢 Neues Gerät verbunden: {sid}")
    await sio.emit('count_updated', global_count, to=sid)

@sio.event
async def disconnect(sid):
    print(f"🔴 Gerät getrennt: {sid}")

@sio.event
async def increment(sid):
    global global_count
    global_count += 1
    print(f"⬆️ Klick von {sid}. Neuer Counter: {global_count}")
    await sio.emit('count_updated', global_count)

if __name__ == '__main__':
    print("🚀 Python Backend startet auf Port 5000...")
    # Health Check ist nun unter http://IP:5000/health erreichbar
    web.run_app(app, host='0.0.0.0', port=5000)