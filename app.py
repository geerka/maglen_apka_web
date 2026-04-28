from flask import Flask, render_template, jsonify, request
from datetime import datetime, timedelta
import random
import os
import requests
import sqlite3
import json
from pathlib import Path

app = Flask(__name__)
DATA_DIR = Path(__file__).parent
DB_PATH = DATA_DIR / 'maglen.db'


def get_db_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute('''
    CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        program_key TEXT,
        title TEXT,
        program_name TEXT,
        day_label TEXT,
        date TEXT,
        timestamp TEXT,
        exercise_count INTEGER,
        exercises TEXT
    )
    ''')
    try:
        cur.execute('ALTER TABLE entries ADD COLUMN title TEXT')
    except sqlite3.OperationalError:
        pass
    cur.execute('''
    CREATE TABLE IF NOT EXISTS active_state (
        id INTEGER PRIMARY KEY,
        data TEXT,
        updated TEXT
    )
    ''')
    conn.commit()
    conn.close()


init_db()

# --- Demo Data ---
client = {
    "name": "Robert Maglen",
    "avatar": "RM",
    "plan": "Tr. Plán",
    "plan_week": "Current w: 2:26",
}

retests = [
    {"date": "25.2.4", "tyzdne": "12 tyzdnov"},
    {"date": "23.3.4", "tyzdne": "12 tyzdnov"},
    {"date": "25.04.", "tyzdne": "12 tyzdnov"},
]

inbody_data = {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "values": [32.1, 30.5, 28.8, 27.2, 26.0, 25.1],
}

progress_data = {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
    "values": [38, 36, 34, 31, 29],
}

DAYS = ["PO", "UT", "ST", "ŠT", "PI", "SO", "NE"]
today = datetime(2025, 4, 27)

def get_week_days():
    start = today - timedelta(days=today.weekday())
    return [
        {"label": DAYS[i], "date": (start + timedelta(days=i)).day, "active": i == today.weekday()}
        for i in range(7)
    ]

SESSIONS = [
    {"id":1,"title":"Osobny  Training","start":"08:00","end":"10:00","day":0,"color":"blue"},
    {"id":2,"title":"Osobny Training","start":"09:00","end":"10:30","day":2,"color":"blue"},
    {"id":3,"title":"Osobny Training","start":"10:00","end":"11:30","day":1,"color":"blue"},
    {"id":4,"title":"Skupinovy Tréningy","start":"11:30","end":"12:30","day":1,"color":"teal"},
    {"id":5,"title":"vzpieranie Tréningy","start":"13:00","end":"14:00","day":1,"color":"orange"},
    {"id":6,"title":"Osobny Tréningy","start":"13:00","end":"14:00","day":2,"color":"teal"},
    {"id":7,"title":"Osobny Tréningy","start":"15:00","end":"16:00","day":2,"color":"blue"},
    {"id":8,"title":"Skupinovy Tréningy","start":"15:30","end":"17:00","day":1,"color":"teal"},
]

online_coaching = [
    {"label": "Vst. Dotazník", "icon": "📋"},
    {"label": "Nahrané Foto+Videá", "icon": "📷"},
    {"label": "Inbody", "icon": "📊"},
    {"label": "Výživa", "icon": "🥗"},
    {"label": "Onl. Coach", "icon": "💬"},
]

@app.route("/")
def index():
    return render_template("index.html",
        client=client,
        week_days=get_week_days(),
        sessions=SESSIONS,
        retests=retests,
        inbody_data=inbody_data,
        progress_data=progress_data,
        online_coaching=online_coaching,
        today_date=today.strftime("%d.%m.%Y"),
    )

@app.route("/api/progress")
def api_progress():
    return jsonify(progress_data)

@app.route("/api/inbody")
def api_inbody():
    return jsonify(inbody_data)

@app.route("/api/retest", methods=["POST"])
def api_retest():
    return jsonify({"status": "ok", "message": "Retest scheduled!"})

@app.route("/api/update_plan", methods=["POST"])
def api_update_plan():
    return jsonify({"status": "ok", "message": "Plan updated!"})


@app.route('/api/save_entry', methods=['POST'])
def api_save_entry():
    try:
        payload = request.get_json(force=True)
        if not payload:
            return jsonify({'status': 'error', 'message': 'No data provided'}), 400

        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO entries (program_key, title, program_name, day_label, date, timestamp, exercise_count, exercises) VALUES (?,?,?,?,?,?,?,?)',
            (
                payload.get('programKey') or payload.get('program_key'),
                payload.get('title') or payload.get('name'),
                payload.get('programName') or payload.get('program_name'),
                payload.get('dayLabel') or payload.get('day_label'),
                payload.get('date'),
                payload.get('timestamp'),
                int(payload.get('exerciseCount') or payload.get('exercise_count') or 0),
                json.dumps(payload.get('exercises') or payload.get('exercises', [])),
            )
        )
        conn.commit()
        new_id = cur.lastrowid
        conn.close()
        return jsonify({'status': 'ok', 'message': 'Entry saved', 'id': new_id})
    except Exception as e:
        app.logger.exception('Failed to save entry')
        return jsonify({'status': 'error', 'message': 'Failed to save entry'}), 500


@app.route('/api/entries')
def api_entries():
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('SELECT * FROM entries ORDER BY id DESC')
        rows = cur.fetchall()
        conn.close()
        out = []
        for r in rows:
            out.append({
                'id': r['id'],
                'programKey': r['program_key'],
                'title': r['title'],
                'programName': r['program_name'],
                'dayLabel': r['day_label'],
                'date': r['date'],
                'timestamp': r['timestamp'],
                'exerciseCount': r['exercise_count'],
                'exercises': json.loads(r['exercises'] or '[]')
            })
        return jsonify({'status': 'ok', 'entries': out})
    except Exception as e:
        app.logger.exception('Failed to fetch entries')
        return jsonify({'status': 'error', 'message': 'Failed to fetch entries'}), 500


@app.route('/api/entries/<int:entry_id>', methods=['DELETE'])
def api_delete_entry(entry_id):
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('DELETE FROM entries WHERE id = ?', (entry_id,))
        conn.commit()
        deleted = cur.rowcount
        conn.close()
        if deleted == 0:
            return jsonify({'status': 'error', 'message': 'Entry not found'}), 404
        return jsonify({'status': 'ok', 'message': 'Entry deleted'})
    except Exception:
        app.logger.exception('Failed to delete entry')
        return jsonify({'status': 'error', 'message': 'Failed to delete entry'}), 500


@app.route('/api/active_state', methods=['GET', 'POST', 'DELETE'])
def api_active_state():
    try:
        if request.method == 'GET':
            conn = get_db_conn()
            cur = conn.cursor()
            cur.execute('SELECT data, updated FROM active_state WHERE id = 1')
            row = cur.fetchone()
            conn.close()
            if not row:
                return jsonify({'status': 'ok', 'state': None})
            return jsonify({'status': 'ok', 'state': json.loads(row['data']), 'updated': row['updated']})

        if request.method == 'POST':
            payload = request.get_json(force=True) or {}
            data = json.dumps(payload.get('state') or payload)
            updated = payload.get('updated') or datetime.utcnow().isoformat()
            conn = get_db_conn()
            cur = conn.cursor()
            cur.execute('REPLACE INTO active_state (id, data, updated) VALUES (1, ?, ?)', (data, updated))
            conn.commit()
            conn.close()
            return jsonify({'status': 'ok', 'message': 'State saved'})

        if request.method == 'DELETE':
            conn = get_db_conn()
            cur = conn.cursor()
            cur.execute('DELETE FROM active_state WHERE id = 1')
            conn.commit()
            conn.close()
            return jsonify({'status': 'ok', 'message': 'State cleared'})

    except Exception as e:
        app.logger.exception('Active state error')
        return jsonify({'status': 'error', 'message': 'Active state failed'}), 500

@app.route("/api/food-search")
def api_food_search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"products": []})
    try:
        resp = requests.get(
            "https://world.openfoodfacts.org/cgi/search.pl",
            params={
                "search_terms": query,
                "search_simple": 1,
                "action": "process",
                "json": 1,
                "page_size": 12,
                "fields": "product_name,nutriments,brands,image_front_thumb_url",
            },
            headers={"User-Agent": "MaglenTrainingCenter/1.0 (contact@maglentrainingcenter.sk)"},
            timeout=15,
        )
        resp.raise_for_status()
        raw = resp.json()
        products = []
        for p in raw.get("products", []):
            name = (p.get("product_name") or "").strip()
            if not name:
                continue
            n = p.get("nutriments") or {}
            products.append({
                "name": name,
                "brand": (p.get("brands") or "").split(",")[0].strip(),
                "calories": round(float(n.get("energy-kcal_100g") or 0), 1),
                "carbs":    round(float(n.get("carbohydrates_100g") or 0), 1),
                "proteins": round(float(n.get("proteins_100g") or 0), 1),
                "fats":     round(float(n.get("fat_100g") or 0), 1),
                "image":    p.get("image_front_thumb_url") or "",
            })
        return jsonify({"products": products})
    except requests.exceptions.Timeout:
        app.logger.warning("Food search timed out for query: %s", query)
        return jsonify({"products": [], "error": "Food search request timed out"}), 504
    except Exception as exc:
        app.logger.error("Food search error: %s", exc)
        return jsonify({"products": [], "error": "Failed to fetch food data"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
