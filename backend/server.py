import json
import os
import socketio
import logging
from aiohttp import web
from typing import Dict, List, Any, Optional

# Logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class JeopardyGame:
    def __init__(self, board_file: str = "./questions/board_1.json"):
        self.players: Dict[str, Dict[str, Any]] = {}
        self.player_order: List[str] = []
        self.moderator_sid: Optional[str] = None
        self.opened_questions: List[str] = []
        self.current_question: Optional[Dict[str, Any]] = None
        self.show_answer: bool = False
        self.buzzer_locked: bool = True
        self.active_player: Optional[Dict[str, str]] = None
        self.board: Dict[str, Any] = self._load_board(board_file)
        self.current_turn_index: int = 0

    def _load_board(self, filename: str) -> Dict[str, Any]:
        if not os.path.exists(filename):
            logger.error(f"File {filename} not found!")
            return {"board_name": "Error", "categories": []}
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)

    def update_turn(self):
        if not self.player_order: return
        self.current_turn_index = (self.current_turn_index + 1) % len(self.player_order)

    def get_current_chooser_name(self) -> str:
        if not self.player_order: return "Warten auf Spieler..."
        current_sid = self.player_order[self.current_turn_index]
        return self.players.get(current_sid, {}).get('name', "Unbekannt")

    def get_full_state(self) -> Dict[str, Any]:
        return {
            "board": self.board,
            "players": self.players,
            "moderator_sid": self.moderator_sid,
            "opened_questions": self.opened_questions,
            "current_question": self.current_question,
            "show_answer": self.show_answer,
            "buzzer_locked": self.buzzer_locked,
            "active_player": self.active_player,
            "current_turn_index": self.current_turn_index,
            "current_chooser": self.get_current_chooser_name()
        }

# --- Server & Game Instance ---
sio = socketio.AsyncServer(async_mode='aiohttp', cors_allowed_origins='*')
app = web.Application()
sio.attach(app)
game = JeopardyGame()

async def broadcast_state():
    await sio.emit('state_update', game.get_full_state())

# --- Socket Events ---

@sio.event
async def connect(sid, environ):
    logger.info(f"Connected: {sid}")

@sio.event
async def disconnect(sid):
    if sid in game.players:
        del game.players[sid]
    if sid in game.player_order:
        game.player_order.remove(sid)
        if len(game.player_order) > 0:
            game.current_turn_index %= len(game.player_order)
        else:
            game.current_turn_index = 0
    if sid == game.moderator_sid:
        game.moderator_sid = None
    await broadcast_state()

@sio.event
async def join_game(sid, data):
    role = data.get('role')
    if role == 'moderator':
        game.moderator_sid = sid
    else:
        name = data.get('name', f"Player {len(game.players) + 1}")
        # PeerID initial leer setzen
        game.players[sid] = {"name": name, "points": 0, "peerId": None}
        if sid not in game.player_order:
            game.player_order.append(sid)
    await broadcast_state()

# NEU: Das Peer-ID Update Event (KORRIGIERT)
@sio.on('update_peer_id')
async def handle_peer_id(sid, data):
    if sid in game.players:
        peer_id = data.get('peerId')
        game.players[sid]['peerId'] = peer_id
        logger.info(f"Peer-ID für {game.players[sid]['name']} gesetzt: {peer_id}")
        await broadcast_state()

@sio.event
async def open_question(sid, data):
    if sid != game.moderator_sid: return
    q_id = data.get('question_id')
    for cat in game.board['categories']:
        for q in cat['questions']:
            if q['id'] == q_id:
                game.current_question = q
                game.buzzer_locked = True
                game.active_player = None
                break
    await broadcast_state()

@sio.event
async def arm_buzzer(sid):
    if sid == game.moderator_sid:
        game.buzzer_locked = False
        await broadcast_state()

@sio.event
async def buzz(sid):
    if not game.buzzer_locked and game.current_question and not game.active_player:
        if sid in game.players:
            game.buzzer_locked = True
            game.active_player = {"sid": sid, "name": game.players[sid]["name"]}
            await broadcast_state()

@sio.event
async def resolve_question(sid, data):
    if sid != game.moderator_sid or not game.active_player: return
    player_sid = game.active_player['sid']
    value = game.current_question['value']

    if data.get('correct'):
        game.players[player_sid]['points'] += value
        game.opened_questions.append(game.current_question['id'])
        game.current_question = None
        game.active_player = None
        game.update_turn()
    else:
        game.players[player_sid]['points'] -= int(value / 2)
        game.active_player = None
        game.buzzer_locked = False 
    await broadcast_state()

@sio.event
async def close_question(sid):
    if sid == game.moderator_sid and game.current_question:
        game.opened_questions.append(game.current_question['id'])
        game.current_question = None
        game.active_player = None
        game.update_turn()
        await broadcast_state()
        
@sio.event
async def reset_game(sid):
    # Nur der Moderator darf das Spiel zurücksetzen
    if sid == game.moderator_sid:
        logger.info("Spiel wird vom Moderator zurückgesetzt!")
        game.opened_questions = []
        game.current_question = None
        game.active_player = None
        game.buzzer_locked = True
        # Optional: Punkte auch auf 0 setzen?
        for p_sid in game.players:
            game.players[p_sid]['points'] = 0
            
        await broadcast_state()

if __name__ == '__main__':
    web.run_app(app, port=5000)