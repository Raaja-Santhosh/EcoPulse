import json
import os
from pathlib import Path
from threading import Lock
from typing import Dict, Any, List, Optional
from datetime import datetime, date

DB_FILE = Path(__file__).parent / "local_db.json"
db_lock = Lock()

DEFAULT_STATE = {
    "baseline": None,
    "logs": [],
    "xp": 0,
    "streak": 0,
    "last_active": None
}

def load_db() -> Dict[str, Any]:
    with db_lock:
        if not os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, "w") as f:
                    json.dump(DEFAULT_STATE, f, indent=2)
            except Exception:
                pass
            return DEFAULT_STATE.copy()
        
        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, Exception):
            return DEFAULT_STATE.copy()

def save_db(data: Dict[str, Any]) -> None:
    with db_lock:
        try:
            with open(DB_FILE, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving to DB: {e}")

def get_state() -> Dict[str, Any]:
    return load_db()

def update_streak_and_xp(data: Dict[str, Any], xp_gained: int) -> Dict[str, Any]:
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
            data["streak"] = 1
    else:
        # First active day
        data["streak"] = 1
        
    data["last_active"] = today_str
    data["xp"] = max(0, data.get("xp", 0) + xp_gained)
    return data

def save_baseline(baseline_data: Dict[str, Any], calculations: Dict[str, Any]) -> Dict[str, Any]:
    data = load_db()
    data["baseline"] = {
        **baseline_data,
        "calculations": calculations
    }
    # Award 50 XP for completing the baseline quiz
    data = update_streak_and_xp(data, xp_gained=50)
    save_db(data)
    return data

def add_log(log_item: Dict[str, Any]) -> Dict[str, Any]:
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
    data = load_db()
    logs = data.get("logs", [])
    new_logs = [log for log in logs if log.get("id") != log_id]
    
    # We don't necessarily deduct XP to avoid negative user reinforcement, 
    # but we will just update the logs list.
    data["logs"] = new_logs
    save_db(data)
    return data

def get_logs() -> List[Dict[str, Any]]:
    data = load_db()
    return data.get("logs", [])
