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
    def __init__(self, board_file: str = "./questions/test_board.json"):
        self.players: Dict[str, Dict[str, Any]] = {}
        self.player_order: List[str] = []
        self.moderator_sid: Optional[str] = None
        self.opened_questions: List[str] = []
        self.current_question: Optional[Dict[str, Any]] = None
        self.buzzer_locked: bool = True
        self.active_player: Optional[Dict[str, str]] = None
        self.current_turn_index: int = 0
        self.board: Dict[str, Any] = self._load_board(board_file)
        self.revealed_hints: int = 0
        self.question_revealed: bool = False
        self.is_resolved: bool = False

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
            if self.player_order:
                self.current_turn_index %= len(self.player_order)
            else:
                self.current_turn_index = 0
                
    def reset_question_state(self):
        """Resets question-specific state variables for a new round."""
        self.revealed_hints = 0
        self.buzzer_locked = True
        self.active_player = None
        self.question_revealed = False
        self.is_resolved = False

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

    def get_remaining_questions_count(self) -> int:
        """NEW: Calculates how many questions are left on the board."""
        total_questions = sum(len(cat['questions']) for cat in self.board.get('categories', []))
        return total_questions - len(self.opened_questions)

    def reset(self, reset_points: bool = True):
        """Resets the entire game session."""
        self.opened_questions = []
        self.current_question = None
        self.reset_question_state()
        if reset_points:
            for sid in self.players:
                self.players[sid]['points'] = 0
        logger.info("Game state has been fully reset.")

    def get_full_state(self) -> Dict[str, Any]:
        """Returns the full state for frontend synchronization."""
        return {
            "board": self.board,
            "players": self.players,
            "moderator_sid": self.moderator_sid,
            "opened_questions": self.opened_questions,
            "current_question": self.current_question,
            "buzzer_locked": self.buzzer_locked,
            "active_player": self.active_player,
            "current_turn_index": self.current_turn_index,
            "current_chooser": self.get_chooser_name(),
            "revealed_hints": self.revealed_hints,
            "question_revealed": self.question_revealed,
            "is_resolved": self.is_resolved,
            "remaining_questions": self.get_remaining_questions_count()
        }

# --- Server Setup ---
sio = socketio.AsyncServer(async_mode='aiohttp', cors_allowed_origins='*')
app = web.Application()
sio.attach(app)
game = JeopardyGame()

async def broadcast_state():
    await sio.emit('state_update', game.get_full_state())

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
    if sid == game.moderator_sid:
        q_id = data.get('question_id')
        for cat in game.board['categories']:
            for q in cat['questions']:
                if q['id'] == q_id:
                    game.current_question = q
                    game.reset_question_state()
                    break
        await broadcast_state()

@sio.event
async def arm_buzzer(sid):
    if sid == game.moderator_sid:
        game.buzzer_locked = False
        game.question_revealed = True
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
    if sid == game.moderator_sid and game.active_player:
        player_sid = game.active_player['sid']
        value = game.current_question['value']
        
        # Calculate if we are in the final 5 questions phase
        remaining = game.get_remaining_questions_count()
        if remaining <= 5:
            value *= 2 # Double the value!
        
        if data.get('correct'):
            game.players[player_sid]['points'] += value
            game.is_resolved = True 
            game.buzzer_locked = True
            logger.info(f"Question resolved as correct for {game.players[player_sid]['name']} (+{value})")
        else:
            # Deducting half points as per original logic, but now using the potentially doubled value
            game.players[player_sid]['points'] -= int(value / 2)
            game.active_player = None
            game.buzzer_locked = False 
            logger.info(f"Question resolved as wrong for {game.players[player_sid]['name']} (-{int(value/2)})")
            
        await broadcast_state()

@sio.event
async def close_question(sid):
    if sid == game.moderator_sid and game.current_question:
        game.opened_questions.append(game.current_question['id'])
        game.current_question = None
        game.active_player = None
        game.next_turn()
        await broadcast_state()

@sio.event
async def reveal_next_hint(sid):
    if sid == game.moderator_sid and game.current_question:
        game.revealed_hints += 1
        await broadcast_state()

@sio.event
async def reset_game(sid):
    if sid == game.moderator_sid:
        game.reset()
        await broadcast_state()

if __name__ == '__main__':
    web.run_app(app, port=5000)