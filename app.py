from flask import Flask, render_template, jsonify, request
from datetime import datetime, timedelta
import random

app = Flask(__name__)

# --- Demo Data ---
client = {
    "name": "Robert Maglen",
    "avatar": "RM",
    "plan": "Tr. Plán",
    "plan_week": "Current w: 2:26",
}

retests = [
    {"date": "25.2.4", "weeks": "12 week"},
    {"date": "23.3.4", "weeks": "12 week"},
    {"date": "25.04.", "weeks": "12 week"},
]

inbody_data = {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "values": [32.1, 30.5, 28.8, 27.2, 26.0, 25.1],
}

progress_data = {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
    "values": [38, 36, 34, 31, 29],
}

DAYS = ["MI", "UT", "ST", "ŠT", "PI", "SO", "NE"]
today = datetime(2025, 4, 27)

def get_week_days():
    start = today - timedelta(days=today.weekday())
    return [
        {"label": DAYS[i], "date": (start + timedelta(days=i)).day, "active": i == today.weekday()}
        for i in range(7)
    ]

SESSIONS = [
    {"id":1,"title":"Personal Training","start":"08:00","end":"10:00","day":0,"color":"blue"},
    {"id":2,"title":"Personal Training","start":"09:00","end":"10:30","day":2,"color":"blue"},
    {"id":3,"title":"Personal Training","start":"10:00","end":"11:30","day":1,"color":"blue"},
    {"id":4,"title":"Group Tréningy","start":"11:30","end":"12:30","day":1,"color":"teal"},
    {"id":5,"title":"Olym. Tréningy","start":"13:00","end":"14:00","day":1,"color":"orange"},
    {"id":6,"title":"Group Tréningy","start":"13:00","end":"14:00","day":2,"color":"teal"},
    {"id":7,"title":"Biatlon Tréningy","start":"15:00","end":"16:00","day":2,"color":"orange"},
    {"id":8,"title":"Personal Tréningy","start":"15:30","end":"17:00","day":1,"color":"blue"},
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

if __name__ == "__main__":
    app.run(debug=True, port=5000)
