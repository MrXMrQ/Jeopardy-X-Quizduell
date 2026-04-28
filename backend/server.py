import json
import os
import logging
import socketio
from aiohttp import web
from typing import Dict, List, Any, Optional

# Configuration
LOG_FORMAT = '%(asctime)s - %(levelname)s - %(message)s'
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger(__name__)

class JeopardyGame:
    """
    Manages the core logic, player states, and board progression of the Jeopardy game.
    """
    def __init__(self, board_file: str = "./questions/board_1.json"):
        self.players: Dict[str, Dict[str, Any]] = {}
        self.player_order: List[str] = []
        self.moderator_sid: Optional[str] = None
        self.opened_questions: List[str] = []
        self.current_question: Optional[Dict[str, Any]] = None
        self.buzzer_locked: bool = True
        self.active_player: Optional[Dict[str, str]] = None
        self.current_turn_index: int = 0
        self.board: Dict[str, Any] = self._load_board(board_file)

    def _load_board(self, filename: str) -> Dict[str, Any]:
        """Loads the quiz board from a JSON file."""
        if not os.path.exists(filename):
            logger.error(f"Board file {filename} not found!")
            return {"board_name": "Error", "categories": []}
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)

    def add_player(self, sid: str, name: str):
        """Registers a new player and adds them to the turn rotation."""
        self.players[sid] = {"name": name, "points": 0, "peerId": None}
        if sid not in self.player_order:
            self.player_order.append(sid)
        logger.info(f"Player joined: {name} ({sid})")

    def remove_connection(self, sid: str):
        """Cleans up state when a player or moderator disconnects."""
        if sid == self.moderator_sid:
            self.moderator_sid = None
            logger.info("Moderator disconnected.")
        
        if sid in self.players:
            logger.info(f"Player removed: {self.players[sid]['name']}")
            del self.players[sid]
            
        if sid in self.player_order:
            self.player_order.remove(sid)
            # Ensure turn index stays within bounds
            if self.player_order:
                self.current_turn_index %= len(self.player_order)
            else:
                self.current_turn_index = 0

    def next_turn(self):
        """Rotates the turn to the next player in order."""
        if self.player_order:
            self.current_turn_index = (self.current_turn_index + 1) % len(self.player_order)

    def get_chooser_name(self) -> str:
        """Returns the name of the player whose turn it is to choose a category."""
        if not self.player_order:
            return "Waiting for players..."
        current_sid = self.player_order[self.current_turn_index]
        return self.players.get(current_sid, {}).get('name', "Unknown")

    def reset(self, reset_points: bool = True):
        """Resets the game session while keeping connected players."""
        self.opened_questions = []
        self.current_question = None
        self.active_player = None
        self.buzzer_locked = True
        if reset_points:
            for sid in self.players:
                self.players[sid]['points'] = 0
        logger.info("Game state has been reset.")

    def get_full_state(self) -> Dict[str, Any]:
        """Returns the complete serializable state for frontend synchronization."""
        return {
            "board": self.board,
            "players": self.players,
            "moderator_sid": self.moderator_sid,
            "opened_questions": self.opened_questions,
            "current_question": self.current_question,
            "buzzer_locked": self.buzzer_locked,
            "active_player": self.active_player,
            "current_turn_index": self.current_turn_index,
            "current_chooser": self.get_chooser_name()
        }

# --- Server Setup ---
sio = socketio.AsyncServer(async_mode='aiohttp', cors_allowed_origins='*')
app = web.Application()
sio.attach(app)
game = JeopardyGame()

async def broadcast_state():
    """Utility to sync all clients with the current game state."""
    await sio.emit('state_update', game.get_full_state())

# --- HTTP Routes ---
async def health_check(request) -> web.Response:
    """Status endpoint for monitoring."""
    return web.json_response({
        "status": "online",
        "players_count": len(game.players),
        "moderator_active": game.moderator_sid is not None
    })

app.router.add_get('/health', health_check)

# --- Socket.io Event Handlers ---

@sio.event
async def connect(sid, environ):
    logger.info(f"Socket connected: {sid}")

@sio.event
async def disconnect(sid):
    game.remove_connection(sid)
    await broadcast_state()

@sio.event
async def join_game(sid, data):
    role = data.get('role')
    if role == 'moderator':
        game.moderator_sid = sid
        logger.info(f"Moderator assigned: {sid}")
    else:
        name = data.get('name', f"Player {len(game.players) + 1}")
        game.add_player(sid, name)
    await broadcast_state()

@sio.on('update_peer_id')
async def handle_peer_id(sid, data):
    if sid in game.players:
        game.players[sid]['peerId'] = data.get('peerId')
        await broadcast_state()

@sio.event
async def open_question(sid, data):
    if sid != game.moderator_sid:
        return
    
    q_id = data.get('question_id')
    # Find question in board categories
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
    """Handles buzzer press: first valid press locks others out."""
    if not game.buzzer_locked and game.current_question and not game.active_player:
        if sid in game.players:
            game.buzzer_locked = True
            game.active_player = {"sid": sid, "name": game.players[sid]["name"]}
            logger.info(f"Buzzer hit by: {game.active_player['name']}")
            await broadcast_state()

@sio.event
async def resolve_question(sid, data):
    """Moderator resolves the current question as correct or incorrect."""
    if sid != game.moderator_sid or not game.active_player or not game.current_question:
        return

    player_sid = game.active_player['sid']
    value = game.current_question['value']

    if data.get('correct'):
        game.players[player_sid]['points'] += value
        game.opened_questions.append(game.current_question['id'])
        game.current_question = None
        game.active_player = None
        game.next_turn()
    else:
        # Penalty for wrong answer (e.g., half the value)
        game.players[player_sid]['points'] -= int(value / 2)
        game.active_player = None
        game.buzzer_locked = False # Allow others to buzz in
    
    await broadcast_state()

@sio.event
async def close_question(sid):
    """Closes a question if no one can answer it."""
    if sid == game.moderator_sid and game.current_question:
        game.opened_questions.append(game.current_question['id'])
        game.current_question = None
        game.active_player = None
        game.next_turn()
        await broadcast_state()

@sio.event
async def reset_game(sid):
    """Global reset triggered by moderator."""
    if sid == game.moderator_sid:
        game.reset()
        await broadcast_state()

if __name__ == '__main__':
    web.run_app(app, port=5000)