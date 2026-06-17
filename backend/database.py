"""
EcoPulse Database — Thread-safe JSON File Storage

Provides a minimal persistent storage layer using a local JSON file.
Supports baseline calculations, activity logs, XP tracking, and streak management.
Uses a threading lock to ensure safe concurrent access from multiple API requests.
"""

import json
import os
import logging
from pathlib import Path
from threading import Lock
from typing import Dict, Any, List
from datetime import date

logger = logging.getLogger("ecopulse.database")

DB_FILE = Path(__file__).parent / "local_db.json"
db_lock = Lock()

DEFAULT_STATE: Dict[str, Any] = {
    "baseline": None,
    "logs": [],
    "xp": 0,
    "streak": 0,
    "last_active": None,
}


def load_db() -> Dict[str, Any]:
    """Load the application state from the JSON database file.

    If the file does not exist, it is created with default state.
    If the file is corrupt, default state is returned and the corruption is logged.

    Returns:
        A dictionary representing the full application state.
    """
    with db_lock:
        if not os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, "w") as f:
                    json.dump(DEFAULT_STATE, f, indent=2)
                logger.info("Initialized new database at %s", DB_FILE)
            except OSError as exc:
                logger.error("Could not create database file %s: %s", DB_FILE, exc)
            return DEFAULT_STATE.copy()

        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except json.JSONDecodeError as exc:
            logger.error("Database file is corrupted (invalid JSON): %s", exc)
            return DEFAULT_STATE.copy()
        except OSError as exc:
            logger.error("Failed to read database file %s: %s", DB_FILE, exc)
            return DEFAULT_STATE.copy()


def save_db(data: Dict[str, Any]) -> None:
    """Persist the application state to the JSON database file.

    Args:
        data: The full application state dictionary to write.
    """
    with db_lock:
        try:
            with open(DB_FILE, "w") as f:
                json.dump(data, f, indent=2)
        except OSError as exc:
            logger.error("Error saving to database: %s", exc)


def get_state() -> Dict[str, Any]:
    """Retrieve the current application state.

    Returns:
        A dictionary containing baseline, logs, xp, streak, and last_active fields.
    """
    return load_db()


def update_streak_and_xp(data: Dict[str, Any], xp_gained: int) -> Dict[str, Any]:
    """Update the daily streak counter and add XP to the running total.

    Streak logic:
    - If the last active day was yesterday, increment the streak (consecutive day).
    - If more than one day has passed, reset the streak to 1.
    - If the same day, streak remains unchanged.

    Args:
        data: The current application state dictionary (mutated in place).
        xp_gained: The amount of XP to add.

    Returns:
        The updated state dictionary.
    """
    today_str = date.today().isoformat()
    last_active_str = data.get("last_active")

    if last_active_str:
        try:
            last_active = date.fromisoformat(last_active_str)
            today = date.today()
            delta = (today - last_active).days
            if delta == 1:
                # Consecutive day
                data["streak"] = data.get("streak", 0) + 1
            elif delta > 1:
                # Streak broken (inactive for more than 1 day)
                data["streak"] = 1
            # If delta == 0, today is the same as last active day; streak is unchanged.
        except ValueError:
            logger.warning("Invalid last_active date format: %s — resetting streak", last_active_str)
            data["streak"] = 1
    else:
        # First active day
        data["streak"] = 1

    data["last_active"] = today_str
    data["xp"] = max(0, data.get("xp", 0) + xp_gained)
    return data


def save_baseline(baseline_data: Dict[str, Any], calculations: Dict[str, Any]) -> Dict[str, Any]:
    """Save the user's baseline quiz answers and computed carbon calculations.

    Awards 50 XP for completing the baseline quiz.

    Args:
        baseline_data: The raw quiz answers.
        calculations: The computed carbon breakdown (transport, diet, energy, waste, total).

    Returns:
        The updated application state.
    """
    data = load_db()
    data["baseline"] = {
        **baseline_data,
        "calculations": calculations,
    }
    # Award 50 XP for completing the baseline quiz
    data = update_streak_and_xp(data, xp_gained=50)
    save_db(data)
    logger.info("Baseline saved with total: %.2f", calculations.get("total", 0))
    return data


def add_log(log_item: Dict[str, Any]) -> Dict[str, Any]:
    """Append a new activity log entry and award XP.

    XP formula: 15 base XP + 10 XP per kg of CO2 saved (only for positive savings).

    Args:
        log_item: A dictionary with id, date, category, description, and carbon_saved.

    Returns:
        The updated application state.
    """
    data = load_db()
    data["logs"].append(log_item)
    # Award 15 XP + additional XP for positive carbon saved
    carbon_saved = log_item.get("carbon_saved", 0.0)
    xp_gained = 15
    if carbon_saved > 0:
        xp_gained += int(carbon_saved * 10)  # 10 XP per kg of CO2 saved
    data = update_streak_and_xp(data, xp_gained=xp_gained)
    save_db(data)
    return data


def delete_log(log_id: str) -> Dict[str, Any]:
    """Remove a log entry by its unique ID.

    XP is not deducted on deletion to avoid negative user reinforcement.

    Args:
        log_id: The UUID string of the log entry to remove.

    Returns:
        The updated application state.
    """
    data = load_db()
    logs = data.get("logs", [])
    new_logs = [log for log in logs if log.get("id") != log_id]
    data["logs"] = new_logs
    save_db(data)
    return data


def get_logs() -> List[Dict[str, Any]]:
    """Retrieve all activity log entries.

    Returns:
        A list of log entry dictionaries.
    """
    data = load_db()
    return data.get("logs", [])
