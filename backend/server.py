import json
import os
import logging
import socketio

from aiohttp import web
from typing import Dict, List, Any, Optional, Union

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class JeopardyGame:
    """
    Main Logic class for the Jeopardy Game State with Type Hints.
    """
    def __init__(self, board_file: str = "board_1.json") -> None:
        # sid: {"name": str, "points": int}
        self.players: Dict[str, Dict[str, Any]] = {} 
        self.moderator_sid: Optional[str] = None
        self.opened_questions: List[str] = []
        self.current_question: Optional[Dict[str, Any]] = None
        self.show_answer: bool = False
        self.buzzer_locked: bool = True
        self.active_player: Optional[Dict[str, str]] = None
        
        self.board: Dict[str, Any] = self._load_board(board_file)

    def _load_board(self, filename: str) -> Dict[str, Any]:
        """Loads and parses the JSON board file."""
        if not os.path.exists(filename):
            logger.error(f"Board file {filename} not found!")
            return {"board_name": "Error", "categories": []}
        
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                logger.info(f"Loading board: {filename}")
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load board: {e}")
            return {"board_name": "Error", "categories": []}

    def get_full_state(self) -> Dict[str, Any]:
        """Returns the serializable state for broadcasting."""
        return {
            "board": self.board,
            "players": self.players,
            "moderator_sid": self.moderator_sid,
            "opened_questions": self.opened_questions,
            "current_question": self.current_question,
            "show_answer": self.show_answer,
            "buzzer_locked": self.buzzer_locked,
            "active_player": self.active_player
        }

    def add_player(self, sid: str, name: str) -> None:
        self.players[sid] = {"name": name, "points": 0}
        logger.info(f"Player joined: {name} ({sid})")

    def set_moderator(self, sid: str) -> None:
        self.moderator_sid = sid
        logger.info(f"Moderator assigned: {sid}")

    def remove_client(self, sid: str) -> None:
        if sid in self.players:
            logger.info(f"Player left: {self.players[sid]['name']}")
            del self.players[sid]
        if sid == self.moderator_sid:
            logger.info("Moderator disconnected")
            self.moderator_sid = None

port: int = 5000
sio: socketio.AsyncServer = socketio.AsyncServer(async_mode='aiohttp', cors_allowed_origins='*')
app: web.Application = web.Application()
sio.attach(app)
game: JeopardyGame = JeopardyGame()

async def broadcast_state() -> None:
    """Utility to sync all clients with the current game state."""
    await sio.emit('state_update', game.get_full_state())

async def health_check(request: web.Request) -> web.Response:
    """Simple health check for the server."""
    return web.Response(text="Jeopardy Backend is running 🚀", status=200)

app.router.add_get('/health', health_check)

@sio.event
async def connect(sid: str, environ: Dict[str, Any]) -> None:
    logger.info(f"Connection attempt: {sid}")

@sio.event
async def disconnect(sid: str) -> None:
    game.remove_client(sid)
    await broadcast_state()

@sio.event
async def join_game(sid: str, data: Dict[str, str]) -> None:
    """
    Handles initial registration.
    data: {"role": "player"|"moderator", "name": str}
    """
    role: Optional[str] = data.get('role')
    if role == 'moderator':
        game.set_moderator(sid)
    else:
        name: str = data.get('name', f"Player {len(game.players) + 1}")
        game.add_player(sid, name)
    
    await broadcast_state()

@sio.event
async def open_question(sid: str, data: Dict[str, str]) -> None:
    """
    Moderator selects a question from the board.
    data: {"question_id": str}
    """
    if sid != game.moderator_sid: 
        return

    q_id: Optional[str] = data.get('question_id')
    
    # Searching for the question in the nested board structure
    for cat in game.board.get('categories', []):
        for q in cat.get('questions', []):
            if q.get('id') == q_id:
                game.current_question = q
                game.buzzer_locked = True 
                game.show_answer = False
                game.active_player = None
                logger.info(f"Question revealed: {q.get('text')}")
                break
    
    await broadcast_state()

@sio.event
async def arm_buzzer(sid: str) -> None:
    """Moderator enables buzzing."""
    if sid == game.moderator_sid and game.current_question:
        game.buzzer_locked = False
        logger.info("Buzzers ARMED")
        await broadcast_state()

@sio.event
async def buzz(sid: str) -> None:
    """Player attempts to buzz in."""
    if not game.buzzer_locked and game.current_question and not game.active_player:
        if sid in game.players:
            game.buzzer_locked = True
            game.active_player = {
                "sid": sid,
                "name": game.players[sid]["name"]
            }
            logger.info(f"Buzzer hit by: {game.active_player['name']}")
            await broadcast_state()

@sio.event
async def toggle_answer(sid: str) -> None:
    """Moderator reveals the answer text."""
    if sid == game.moderator_sid:
        game.show_answer = not game.show_answer
        await broadcast_state()

@sio.event
async def resolve_question(sid: str, data: Dict[str, bool]) -> None:
    """
    Moderator awards or deducts points.
    data: {"correct": bool}
    """
    if sid != game.moderator_sid or not game.active_player or not game.current_question:
        return

    target_sid: str = game.active_player['sid']
    value: int = game.current_question.get('value', 0)

    if data.get('correct'):
        game.players[target_sid]['points'] += value
        game.opened_questions.append(game.current_question['id'])
        game.current_question = None
        game.active_player = None
        logger.info(f"Correct answer. {target_sid} awarded {value}")
    else:
        # Penalty is half the value
        penalty: int = int(value / 2)
        game.players[target_sid]['points'] -= penalty
        game.active_player = None
        game.buzzer_locked = False # Unlock for other players
        logger.info(f"Wrong answer. {target_sid} deducted {penalty}")

    await broadcast_state()

@sio.event
async def close_question(sid: str) -> None:
    """Moderator closes question without points awarded."""
    if sid == game.moderator_sid:
        if game.current_question:
            game.opened_questions.append(game.current_question['id'])
        game.current_question = None
        game.active_player = None
        await broadcast_state()

if __name__ == '__main__':
    web.run_app(app, host='0.0.0.0', port=port)